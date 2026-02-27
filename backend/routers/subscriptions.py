from fastapi import APIRouter, HTTPException, status, Depends, Security
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.subscription import Subscription, SubscriptionCreate, SubscriptionResponse
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def get_db():
    from server import db
    return db


@router.get("", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    branch_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 50,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List subscriptions"""
    query = {}
    
    if branch_id:
        query["branch_id"] = branch_id
    elif user.get("role") not in ["ADMIN"]:
        if user.get("branch_id"):
            query["branch_id"] = user["branch_id"]
    
    if customer_id:
        query["customer_id"] = customer_id
    
    if status_filter:
        query["status"] = status_filter
    
    subscriptions = await db.subscriptions.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    now = datetime.now(timezone.utc)
    
    for sub in subscriptions:
        # Parse dates
        if isinstance(sub.get("purchased_at"), str):
            sub["purchased_at"] = datetime.fromisoformat(sub["purchased_at"])
        if isinstance(sub.get("activated_at"), str):
            sub["activated_at"] = datetime.fromisoformat(sub["activated_at"])
        if isinstance(sub.get("expires_at"), str):
            sub["expires_at"] = datetime.fromisoformat(sub["expires_at"])
        
        # Calculate days remaining and active status
        if sub.get("expires_at") and sub.get("status") == "ACTIVE":
            expires_at = sub["expires_at"]
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            if expires_at > now:
                sub["days_remaining"] = (expires_at - now).days
                sub["is_active"] = True
            else:
                sub["days_remaining"] = 0
                sub["is_active"] = False
        
        result.append(SubscriptionResponse(**sub))
    
    return result


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    sub_data: SubscriptionCreate,
    user: dict = Depends(require_role("ADMIN", "MANAGER", "CASHIER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new subscription (pending activation)"""
    # Verify customer exists
    customer = await db.customers.find_one({"customer_id": sub_data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="العميل غير موجود"
        )
    
    # Check if customer already has active/pending subscription
    existing = await db.subscriptions.find_one({
        "customer_id": sub_data.customer_id,
        "status": {"$in": ["PENDING", "ACTIVE"]}
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="العميل لديه اشتراك نشط أو معلق بالفعل"
        )
    
    subscription = Subscription(
        customer_id=sub_data.customer_id,
        branch_id=sub_data.branch_id,
        subscription_type=sub_data.subscription_type,
        status="PENDING",
        notes=sub_data.notes
    )
    
    sub_dict = subscription.model_dump()
    sub_dict["purchased_at"] = sub_dict["purchased_at"].isoformat()
    sub_dict["created_at"] = sub_dict["created_at"].isoformat()
    sub_dict["updated_at"] = sub_dict["updated_at"].isoformat()
    
    await db.subscriptions.insert_one(sub_dict)
    
    await log_audit(
        db, "SUBSCRIPTION", subscription.subscription_id, "CREATED",
        user["user_id"], user["role"],
        after_state={"customer_id": sub_data.customer_id, "type": sub_data.subscription_type},
        notes="Subscription created (pending)"
    )
    
    return SubscriptionResponse(**subscription.model_dump())


@router.post("/{subscription_id}/activate", response_model=SubscriptionResponse)
async def activate_subscription(
    subscription_id: str,
    user: dict = Depends(require_role("ADMIN", "MANAGER", "CASHIER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Activate a subscription (starts 1 month countdown)"""
    sub = await db.subscriptions.find_one({"subscription_id": subscription_id}, {"_id": 0})
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الاشتراك غير موجود"
        )
    
    if sub.get("status") != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"لا يمكن تفعيل اشتراك بحالة: {sub.get('status')}"
        )
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=30)  # 1 month = 30 days
    
    update_data = {
        "status": "ACTIVE",
        "activated_at": now.isoformat(),
        "expires_at": expires_at.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.subscriptions.update_one(
        {"subscription_id": subscription_id},
        {"$set": update_data}
    )
    
    await log_audit(
        db, "SUBSCRIPTION", subscription_id, "ACTIVATED",
        user["user_id"], user["role"],
        after_state={"expires_at": expires_at.isoformat()},
        notes="Subscription activated - expires in 30 days"
    )
    
    # Get updated subscription
    updated = await db.subscriptions.find_one({"subscription_id": subscription_id}, {"_id": 0})
    
    if isinstance(updated.get("purchased_at"), str):
        updated["purchased_at"] = datetime.fromisoformat(updated["purchased_at"])
    if isinstance(updated.get("activated_at"), str):
        updated["activated_at"] = datetime.fromisoformat(updated["activated_at"])
    if isinstance(updated.get("expires_at"), str):
        updated["expires_at"] = datetime.fromisoformat(updated["expires_at"])
    
    updated["days_remaining"] = 30
    updated["is_active"] = True
    
    return SubscriptionResponse(**updated)


@router.post("/{subscription_id}/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    subscription_id: str,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Cancel a subscription"""
    sub = await db.subscriptions.find_one({"subscription_id": subscription_id}, {"_id": 0})
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الاشتراك غير موجود"
        )
    
    if sub.get("status") in ["CANCELLED", "EXPIRED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الاشتراك ملغى أو منتهي بالفعل"
        )
    
    now = datetime.now(timezone.utc)
    
    await db.subscriptions.update_one(
        {"subscription_id": subscription_id},
        {"$set": {
            "status": "CANCELLED",
            "updated_at": now.isoformat()
        }}
    )
    
    await log_audit(
        db, "SUBSCRIPTION", subscription_id, "CANCELLED",
        user["user_id"], user["role"],
        notes="Subscription cancelled"
    )
    
    updated = await db.subscriptions.find_one({"subscription_id": subscription_id}, {"_id": 0})
    
    if isinstance(updated.get("purchased_at"), str):
        updated["purchased_at"] = datetime.fromisoformat(updated["purchased_at"])
    if isinstance(updated.get("activated_at"), str):
        updated["activated_at"] = datetime.fromisoformat(updated["activated_at"])
    if isinstance(updated.get("expires_at"), str):
        updated["expires_at"] = datetime.fromisoformat(updated["expires_at"])
    
    updated["is_active"] = False
    
    return SubscriptionResponse(**updated)


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(
    subscription_id: str,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get subscription details"""
    sub = await db.subscriptions.find_one({"subscription_id": subscription_id}, {"_id": 0})
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الاشتراك غير موجود"
        )
    
    if isinstance(sub.get("purchased_at"), str):
        sub["purchased_at"] = datetime.fromisoformat(sub["purchased_at"])
    if isinstance(sub.get("activated_at"), str):
        sub["activated_at"] = datetime.fromisoformat(sub["activated_at"])
    if isinstance(sub.get("expires_at"), str):
        sub["expires_at"] = datetime.fromisoformat(sub["expires_at"])
    
    now = datetime.now(timezone.utc)
    if sub.get("expires_at") and sub.get("status") == "ACTIVE":
        expires_at = sub["expires_at"]
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        if expires_at > now:
            sub["days_remaining"] = (expires_at - now).days
            sub["is_active"] = True
        else:
            sub["days_remaining"] = 0
            sub["is_active"] = False
    
    return SubscriptionResponse(**sub)
