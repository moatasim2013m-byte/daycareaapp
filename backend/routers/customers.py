from fastapi import APIRouter, HTTPException, status, Depends, Security
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.customer import Customer, CustomerCreate, CustomerUpdate, CustomerResponse, WaiverAcceptance, GuardianInfo
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from datetime import datetime, timezone, date
from dateutil.relativedelta import relativedelta

router = APIRouter(prefix="/customers", tags=["Customers"])


def get_db():
    from server import db
    return db


def calculate_age_months(dob: date) -> int:
    """Calculate age in months from date of birth"""
    today = date.today()
    rd = relativedelta(today, dob)
    return rd.years * 12 + rd.months


def validate_child_age(dob: date) -> bool:
    """Check if child is 4 years or below"""
    age_months = calculate_age_months(dob)
    return age_months <= 48  # 4 years = 48 months


@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    branch_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List customers - filtered by branch for non-admin staff"""
    query = {}
    
    # Branch filter
    if branch_id:
        query["branch_id"] = branch_id
    elif user.get("role") not in ["ADMIN"]:
        if user.get("branch_id"):
            query["branch_id"] = user["branch_id"]
    
    # Status filter
    if status_filter:
        query["status"] = status_filter
    
    # Search by name or card
    if search:
        query["$or"] = [
            {"child_name": {"$regex": search, "$options": "i"}},
            {"card_number": {"$regex": search, "$options": "i"}},
            {"guardian.name": {"$regex": search, "$options": "i"}},
            {"guardian.phone": {"$regex": search, "$options": "i"}}
        ]
    
    customers = await db.customers.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    for cust in customers:
        # Parse dates
        if isinstance(cust.get("created_at"), str):
            cust["created_at"] = datetime.fromisoformat(cust["created_at"])
        if isinstance(cust.get("child_dob"), str):
            cust["child_dob"] = date.fromisoformat(cust["child_dob"])
        if isinstance(cust.get("waiver_accepted_at"), str):
            cust["waiver_accepted_at"] = datetime.fromisoformat(cust["waiver_accepted_at"])
        if isinstance(cust.get("last_visit"), str):
            cust["last_visit"] = datetime.fromisoformat(cust["last_visit"])
        
        # Calculate age
        cust["child_age_months"] = calculate_age_months(cust["child_dob"])
        
        # Check for active subscription
        subscription = await db.subscriptions.find_one({
            "customer_id": cust["customer_id"],
            "status": "ACTIVE",
            "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
        }, {"_id": 0})
        
        if subscription:
            cust["has_active_subscription"] = True
            if isinstance(subscription.get("expires_at"), str):
                cust["subscription_expires_at"] = datetime.fromisoformat(subscription["expires_at"])
        
        result.append(CustomerResponse(**cust))
    
    return result


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def register_customer(
    customer_data: CustomerCreate,
    user: dict = Depends(require_role("ADMIN", "MANAGER", "RECEPTION", "STAFF", "CASHIER", "ATTENDANT")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Register a new child with their card"""
    # Validate child age (4 years or below)
    if not validate_child_age(customer_data.child_dob):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الطفل يجب أن يكون بعمر 4 سنوات أو أقل"  # Child must be 4 years or below
        )
    
    # Check card number uniqueness
    existing = await db.customers.find_one({"card_number": customer_data.card_number})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رقم البطاقة مستخدم بالفعل"  # Card number already in use
        )
    
    # Branch access check
    if user.get("role") in ["MANAGER", "RECEPTION", "STAFF", "CASHIER", "ATTENDANT"]:
        if user.get("branch_id") != customer_data.branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="لا يمكنك التسجيل في فرع آخر"
            )
    
    # Create customer
    customer = Customer(
        card_number=customer_data.card_number,
        child_name=customer_data.child_name,
        child_dob=customer_data.child_dob,
        guardian=customer_data.guardian,
        branch_id=customer_data.branch_id,
        notes=customer_data.notes
    )
    
    # Serialize for MongoDB
    customer_dict = customer.model_dump()
    customer_dict["created_at"] = customer_dict["created_at"].isoformat()
    customer_dict["updated_at"] = customer_dict["updated_at"].isoformat()
    customer_dict["child_dob"] = customer_dict["child_dob"].isoformat()
    customer_dict["guardian"] = dict(customer_dict["guardian"])
    
    await db.customers.insert_one(customer_dict)
    
    # Audit log
    await log_audit(
        db, "CUSTOMER", customer.customer_id, "REGISTERED",
        user["user_id"], user["role"],
        after_state={"child_name": customer.child_name, "card_number": customer.card_number},
        notes=f"Customer registered: {customer.child_name}"
    )
    
    response = CustomerResponse(**customer.model_dump())
    response.child_age_months = calculate_age_months(customer.child_dob)
    return response


@router.get("/card/{card_number}", response_model=CustomerResponse)
async def get_customer_by_card(
    card_number: str,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get customer by card number (for scanning)"""
    customer = await db.customers.find_one({"card_number": card_number}, {"_id": 0})
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="البطاقة غير مسجلة"  # Card not registered
        )
    
    # Parse dates
    if isinstance(customer.get("created_at"), str):
        customer["created_at"] = datetime.fromisoformat(customer["created_at"])
    if isinstance(customer.get("child_dob"), str):
        customer["child_dob"] = date.fromisoformat(customer["child_dob"])
    if isinstance(customer.get("waiver_accepted_at"), str):
        customer["waiver_accepted_at"] = datetime.fromisoformat(customer["waiver_accepted_at"])
    if isinstance(customer.get("last_visit"), str):
        customer["last_visit"] = datetime.fromisoformat(customer["last_visit"])
    
    # Calculate age
    customer["child_age_months"] = calculate_age_months(customer["child_dob"])
    
    # Check for active subscription
    subscription = await db.subscriptions.find_one({
        "customer_id": customer["customer_id"],
        "status": "ACTIVE",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0})
    
    if subscription:
        customer["has_active_subscription"] = True
        if isinstance(subscription.get("expires_at"), str):
            customer["subscription_expires_at"] = datetime.fromisoformat(subscription["expires_at"])
    
    return CustomerResponse(**customer)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: str,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get customer by ID"""
    customer = await db.customers.find_one({"customer_id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="العميل غير موجود"
        )
    
    # Parse dates
    if isinstance(customer.get("created_at"), str):
        customer["created_at"] = datetime.fromisoformat(customer["created_at"])
    if isinstance(customer.get("child_dob"), str):
        customer["child_dob"] = date.fromisoformat(customer["child_dob"])
    if isinstance(customer.get("waiver_accepted_at"), str):
        customer["waiver_accepted_at"] = datetime.fromisoformat(customer["waiver_accepted_at"])
    if isinstance(customer.get("last_visit"), str):
        customer["last_visit"] = datetime.fromisoformat(customer["last_visit"])
    
    customer["child_age_months"] = calculate_age_months(customer["child_dob"])
    
    # Check subscription
    subscription = await db.subscriptions.find_one({
        "customer_id": customer_id,
        "status": "ACTIVE",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0})
    
    if subscription:
        customer["has_active_subscription"] = True
        if isinstance(subscription.get("expires_at"), str):
            customer["subscription_expires_at"] = datetime.fromisoformat(subscription["expires_at"])
    
    return CustomerResponse(**customer)


@router.patch("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    updates: CustomerUpdate,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update customer info"""
    existing = await db.customers.find_one({"customer_id": customer_id}, {"_id": 0})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="العميل غير موجود"
        )
    
    # Validate age if DOB is being updated
    if updates.child_dob and not validate_child_age(updates.child_dob):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الطفل يجب أن يكون بعمر 4 سنوات أو أقل"
        )
    
    update_data = {}
    if updates.child_name:
        update_data["child_name"] = updates.child_name
    if updates.child_dob:
        update_data["child_dob"] = updates.child_dob.isoformat()
    if updates.guardian:
        update_data["guardian"] = updates.guardian.model_dump()
    if updates.notes is not None:
        update_data["notes"] = updates.notes
    if updates.status:
        update_data["status"] = updates.status
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.customers.update_one(
            {"customer_id": customer_id},
            {"$set": update_data}
        )
        
        await log_audit(
            db, "CUSTOMER", customer_id, "UPDATED",
            user["user_id"], user["role"],
            before_state=existing,
            after_state=update_data,
            notes="Customer updated"
        )
    
    # Return updated customer
    return await get_customer(customer_id, user, db)


@router.post("/{customer_id}/waiver", response_model=CustomerResponse)
async def accept_waiver(
    customer_id: str,
    waiver: WaiverAcceptance,
    user: dict = Depends(require_role("ADMIN", "MANAGER", "RECEPTION", "STAFF", "CASHIER", "ATTENDANT")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Accept waiver for customer"""
    existing = await db.customers.find_one({"customer_id": customer_id}, {"_id": 0})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="العميل غير موجود"
        )
    
    if not waiver.accepted_terms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يجب الموافقة على الشروط والأحكام"
        )
    
    now = datetime.now(timezone.utc)
    update_data = {
        "waiver_accepted": True,
        "waiver_accepted_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    # Store signature if provided
    if waiver.guardian_signature:
        update_data["guardian_signature"] = waiver.guardian_signature
    
    await db.customers.update_one(
        {"customer_id": customer_id},
        {"$set": update_data}
    )
    
    await log_audit(
        db, "CUSTOMER", customer_id, "WAIVER_ACCEPTED",
        user["user_id"], user["role"],
        after_state={"waiver_accepted": True},
        notes="Waiver accepted"
    )
    
    return await get_customer(customer_id, user, db)
