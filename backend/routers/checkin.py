from fastapi import APIRouter, HTTPException, status, Depends, Security
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.checkin import CheckInSession, CheckInCreate, CheckOutCreate, CheckInSessionResponse
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from datetime import datetime, timezone, date
import math
import random
import uuid
from constants.roles import FRONTDESK_ROLES

router = APIRouter(prefix="/checkin", tags=["Check-In"])


def get_db():
    from server import db
    return db


def _generate_order_number() -> str:
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = str(random.randint(1000, 9999))
    return f"ORD-{date_part}-{random_part}"


def _calculate_overdue(minutes_used: int, included_minutes: int) -> tuple[int, float]:
    extra_minutes = max(0, minutes_used - included_minutes)
    if extra_minutes <= 0:
        return 0, 0.0
    extra_hours = math.ceil(extra_minutes / 60)
    return extra_minutes, float(extra_hours * 3)


async def _create_overtime_order(db: AsyncIOMotorDatabase, customer: dict, amount: float, user: dict, session_id: str) -> str:
    overtime_product = await db.products.find_one({"category": "OVERTIME", "is_active": True}, {"_id": 0})

    if overtime_product:
        product_id = overtime_product["product_id"]
        product_name_ar = overtime_product.get("name_ar", "رسوم الوقت الإضافي")
        product_name_en = overtime_product.get("name_en", "Overtime Fee")
    else:
        # Fallback in case products were not seeded yet
        product_id = "OVERTIME_MANUAL"
        product_name_ar = "رسوم الوقت الإضافي"
        product_name_en = "Overtime Fee"

    line_item = {
        "item_id": str(uuid.uuid4()),
        "product_id": product_id,
        "product_name_ar": product_name_ar,
        "product_name_en": product_name_en,
        "quantity": 1,
        "unit_price": round(amount, 2),
        "line_total": round(amount, 2),
        "notes": f"Session overtime charge for {session_id}"
    }

    order_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    guardian_info = customer.get("guardian") or {}
    guardian_id = customer.get("guardian_id") or guardian_info.get("national_id")
    child_id = customer.get("child_id") or customer.get("customer_id")
    order_doc = {
        "order_id": order_id,
        "order_number": _generate_order_number(),
        "guardian_id": guardian_id,
        "child_id": child_id,
        "items": [line_item],
        "subtotal": round(amount, 2),
        "tax_amount": 0.0,
        "total_amount": round(amount, 2),
        "status": "OPEN",
        "payment_method": "CASH",
        "notes": f"Auto-generated overdue order for customer {customer.get('customer_id')}",
        "created_by": user.get("user_id"),
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    await db.orders.insert_one(order_doc)
    return order_doc["order_id"], order_doc["order_number"]


def _resolve_included_minutes(session: dict) -> int:
    """Use persisted included_minutes first, then safe business defaults."""
    if session.get("included_minutes"):
        return int(session["included_minutes"])
    if session.get("payment_type") == "SUBSCRIPTION":
        return 600
    return 120


def _build_overdue_meta(duration: int, included_minutes: int) -> dict:
    overdue_minutes, overdue_amount = _calculate_overdue(duration, included_minutes)
    return {
        "duration_minutes": duration,
        "included_minutes": included_minutes,
        "overdue_minutes": overdue_minutes,
        "overdue_amount": overdue_amount,
        "overdue_hours_charged": math.ceil(overdue_minutes / 60) if overdue_minutes > 0 else 0,
        "is_overdue": overdue_amount > 0,
    }


def _enrich_session_for_ui(session: dict) -> dict:
    """Populate computed fields needed by reception UI for active sessions/checkouts."""
    check_in_time = session.get("check_in_time")
    if isinstance(check_in_time, str):
        check_in_time = datetime.fromisoformat(check_in_time)

    if isinstance(check_in_time, datetime):
        if check_in_time.tzinfo is None:
            check_in_time = check_in_time.replace(tzinfo=timezone.utc)
        elapsed_minutes = max(0, int((datetime.now(timezone.utc) - check_in_time).total_seconds() / 60))
        included_minutes = _resolve_included_minutes(session)
        session["elapsed_minutes"] = elapsed_minutes
        session["included_minutes"] = included_minutes
        session["is_overdue"] = elapsed_minutes > included_minutes
    else:
        session.setdefault("elapsed_minutes", 0)
        session.setdefault("is_overdue", False)

    session.setdefault("overdue_hours_charged", math.ceil(session.get("overdue_minutes", 0) / 60) if session.get("overdue_minutes", 0) > 0 else 0)
    return session


@router.post("/scan", response_model=dict)
async def scan_card(
    scan_data: CheckInCreate,
    user: dict = Depends(require_role(*FRONTDESK_ROLES)),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Scan card to check in or get customer info.
    Returns customer data and whether they need to register or can check in.
    """
    # Look up customer by card
    customer = await db.customers.find_one({"card_number": scan_data.card_number}, {"_id": 0})
    
    if not customer:
        # Card not registered - need to create new customer
        return {
            "status": "NEW_CARD",
            "message": "البطاقة غير مسجلة - يرجى تسجيل عميل جديد",
            "card_number": scan_data.card_number,
            "customer": None,
            "active_session": None,
            "has_subscription": False
        }
    
    # Parse dates
    if isinstance(customer.get("child_dob"), str):
        customer["child_dob"] = customer["child_dob"]  # Keep as string for response
    
    # Check if already checked in (active session)
    active_session = await db.checkin_sessions.find_one({
        "customer_id": customer["customer_id"],
        "status": "CHECKED_IN"
    }, {"_id": 0})
    
    if active_session:
        if isinstance(active_session.get("check_in_time"), str):
            active_session["check_in_time"] = datetime.fromisoformat(active_session["check_in_time"])
        active_session = _enrich_session_for_ui(active_session)
        
        return {
            "status": "ALREADY_CHECKED_IN",
            "message": "الطفل مسجل دخول بالفعل",
            "card_number": scan_data.card_number,
            "customer": customer,
            "active_session": active_session,
            "has_subscription": False
        }
    
    # Check waiver status
    if not customer.get("waiver_accepted"):
        return {
            "status": "WAIVER_REQUIRED",
            "message": "يجب الموافقة على إقرار المسؤولية أولاً",
            "card_number": scan_data.card_number,
            "customer": customer,
            "active_session": None,
            "has_subscription": False
        }
    
    # Check for active subscription
    subscription = await db.subscriptions.find_one({
        "customer_id": customer["customer_id"],
        "status": "ACTIVE",
        "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
    }, {"_id": 0})
    
    has_subscription = subscription is not None
    subscription_info = None
    
    if subscription:
        if isinstance(subscription.get("expires_at"), str):
            expires_at = datetime.fromisoformat(subscription["expires_at"])
            days_remaining = (expires_at - datetime.now(timezone.utc)).days
            subscription_info = {
                "subscription_id": subscription["subscription_id"],
                "expires_at": subscription["expires_at"],
                "days_remaining": days_remaining
            }
    
    return {
        "status": "READY_TO_CHECK_IN",
        "message": "جاهز لتسجيل الدخول",
        "card_number": scan_data.card_number,
        "customer": customer,
        "active_session": None,
        "has_subscription": has_subscription,
        "subscription": subscription_info
    }


@router.post("", response_model=CheckInSessionResponse, status_code=status.HTTP_201_CREATED)
async def check_in(
    checkin_data: CheckInCreate,
    use_subscription: bool = False,
    user: dict = Depends(require_role(*FRONTDESK_ROLES)),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Check in a customer"""
    # Get customer
    customer = await db.customers.find_one({"card_number": checkin_data.card_number}, {"_id": 0})
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="البطاقة غير مسجلة"
        )
    
    # Check waiver
    if not customer.get("waiver_accepted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يجب الموافقة على إقرار المسؤولية أولاً"
        )
    
    # Check if already checked in
    existing_session = await db.checkin_sessions.find_one({
        "customer_id": customer["customer_id"],
        "status": "CHECKED_IN"
    })
    if existing_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الطفل مسجل دخول بالفعل"
        )
    
    # Determine payment type
    payment_type = "HOURLY"
    subscription_id = None
    included_minutes = 120
    
    if use_subscription:
        # Check for active subscription
        subscription = await db.subscriptions.find_one({
            "customer_id": customer["customer_id"],
            "status": "ACTIVE",
            "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
        }, {"_id": 0})
        
        if subscription:
            payment_type = "SUBSCRIPTION"
            subscription_id = subscription["subscription_id"]
            included_minutes = 600
        else:
            # Check for pending subscription to activate
            pending_sub = await db.subscriptions.find_one({
                "customer_id": customer["customer_id"],
                "status": "PENDING"
            }, {"_id": 0})
            
            if pending_sub:
                # Activate the subscription on first use
                now = datetime.now(timezone.utc)
                from datetime import timedelta
                expires_at = now + timedelta(days=30)
                
                await db.subscriptions.update_one(
                    {"subscription_id": pending_sub["subscription_id"]},
                    {"$set": {
                        "status": "ACTIVE",
                        "activated_at": now.isoformat(),
                        "expires_at": expires_at.isoformat(),
                        "updated_at": now.isoformat()
                    }}
                )
                
                payment_type = "SUBSCRIPTION"
                subscription_id = pending_sub["subscription_id"]
                included_minutes = 600
                
                await log_audit(
                    db, "SUBSCRIPTION", subscription_id, "AUTO_ACTIVATED",
                    user["user_id"], user["role"],
                    notes="Subscription auto-activated on first check-in"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="لا يوجد اشتراك نشط"
                )
    
    # Create check-in session
    session = CheckInSession(
        customer_id=customer["customer_id"],
        card_number=checkin_data.card_number,
        branch_id=checkin_data.branch_id,
        payment_type=payment_type,
        subscription_id=subscription_id,
        created_by=user["user_id"],
        included_minutes=included_minutes
    )
    
    session_dict = session.model_dump()
    session_dict["check_in_time"] = session_dict["check_in_time"].isoformat()
    session_dict["created_at"] = session_dict["created_at"].isoformat()
    session_dict["updated_at"] = session_dict["updated_at"].isoformat()
    
    await db.checkin_sessions.insert_one(session_dict)
    
    # Update customer visit stats
    await db.customers.update_one(
        {"customer_id": customer["customer_id"]},
        {
            "$inc": {"total_visits": 1},
            "$set": {
                "last_visit": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    await log_audit(
        db, "CHECKIN", session.session_id, "CHECKED_IN",
        user["user_id"], user["role"],
        after_state={"customer_id": customer["customer_id"], "payment_type": payment_type},
        notes=f"Check-in: {customer.get('child_name')}"
    )
    
    response = CheckInSessionResponse(**session.model_dump())
    response.child_name = customer.get("child_name")
    response.guardian_name = customer.get("guardian", {}).get("name")
    response.guardian_phone = customer.get("guardian", {}).get("phone")
    
    return response


@router.post("/{session_id}/checkout", response_model=CheckInSessionResponse)
async def check_out(
    session_id: str,
    user: dict = Depends(require_role(*FRONTDESK_ROLES)),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Check out a customer"""
    session = await db.checkin_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الجلسة غير موجودة"
        )
    
    if session.get("status") != "CHECKED_IN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الجلسة منتهية بالفعل"
        )
    
    now = datetime.now(timezone.utc)
    check_in_time = session.get("check_in_time")
    if isinstance(check_in_time, str):
        check_in_time = datetime.fromisoformat(check_in_time)
    if check_in_time.tzinfo is None:
        check_in_time = check_in_time.replace(tzinfo=timezone.utc)
    
    duration = int((now - check_in_time).total_seconds() / 60)
    included_minutes = _resolve_included_minutes(session)
    overdue_meta = _build_overdue_meta(duration, included_minutes)

    # Checkout lifecycle:
    # - CHECKED_OUT: session fully closed with no overtime charge
    # - OVERDUE: session closed and overtime order generated for settlement
    checkout_status = "OVERDUE" if overdue_meta["is_overdue"] else "CHECKED_OUT"
    overtime_order_id = None
    overtime_order_number = None

    customer = await db.customers.find_one({"customer_id": session["customer_id"]}, {"_id": 0})

    if overdue_meta["is_overdue"]:
        overtime_order_id, overtime_order_number = await _create_overtime_order(
            db,
            customer or {"customer_id": session["customer_id"]},
            overdue_meta["overdue_amount"],
            user,
            session_id,
        )

    await db.checkin_sessions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": checkout_status,
            "check_out_time": now.isoformat(),
            **overdue_meta,
            "overtime_order_id": overtime_order_id,
            "overtime_order_number": overtime_order_number,
            "amount_charged": overdue_meta["overdue_amount"],
            "updated_at": now.isoformat()
        }}
    )

    await log_audit(
        db, "CHECKIN", session_id, "CHECKED_OUT",
        user["user_id"], user["role"],
        after_state={
            **overdue_meta,
            "overtime_order_id": overtime_order_id
        },
        notes=f"Check-out after {duration} minutes"
    )
    
    # Get updated session
    updated = await db.checkin_sessions.find_one({"session_id": session_id}, {"_id": 0})
    
    if isinstance(updated.get("check_in_time"), str):
        updated["check_in_time"] = datetime.fromisoformat(updated["check_in_time"])
    if isinstance(updated.get("check_out_time"), str):
        updated["check_out_time"] = datetime.fromisoformat(updated["check_out_time"])
    
    # Get customer info
    customer = await db.customers.find_one({"customer_id": updated["customer_id"]}, {"_id": 0})
    
    updated = _enrich_session_for_ui(updated)
    response = CheckInSessionResponse(**updated)
    if customer:
        response.child_name = customer.get("child_name")
        response.guardian_name = customer.get("guardian", {}).get("name")
        response.guardian_phone = customer.get("guardian", {}).get("phone")
    
    return response


@router.get("/active", response_model=List[CheckInSessionResponse])
async def list_active_sessions(
    branch_id: Optional[str] = None,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List all currently checked-in customers"""
    query = {"status": "CHECKED_IN"}
    
    if branch_id:
        query["branch_id"] = branch_id
    elif user.get("role") not in ["ADMIN"]:
        if user.get("branch_id"):
            query["branch_id"] = user["branch_id"]
    
    sessions = await db.checkin_sessions.find(query, {"_id": 0}).sort("check_in_time", -1).to_list(100)
    
    result = []
    for sess in sessions:
        if isinstance(sess.get("check_in_time"), str):
            sess["check_in_time"] = datetime.fromisoformat(sess["check_in_time"])
        sess = _enrich_session_for_ui(sess)
        
        # Get customer info
        customer = await db.customers.find_one({"customer_id": sess["customer_id"]}, {"_id": 0})
        
        response = CheckInSessionResponse(**sess)
        if customer:
            response.child_name = customer.get("child_name")
            response.guardian_name = customer.get("guardian", {}).get("name")
            response.guardian_phone = customer.get("guardian", {}).get("phone")
        
        result.append(response)
    
    return result


@router.get("/history", response_model=List[CheckInSessionResponse])
async def list_session_history(
    branch_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    date_from: Optional[str] = None,
    limit: int = 50,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List check-in history"""
    query = {}
    
    if branch_id:
        query["branch_id"] = branch_id
    elif user.get("role") not in ["ADMIN"]:
        if user.get("branch_id"):
            query["branch_id"] = user["branch_id"]
    
    if customer_id:
        query["customer_id"] = customer_id
    
    if date_from:
        query["check_in_time"] = {"$gte": date_from}
    
    sessions = await db.checkin_sessions.find(query, {"_id": 0}).sort("check_in_time", -1).limit(limit).to_list(limit)
    
    result = []
    for sess in sessions:
        if isinstance(sess.get("check_in_time"), str):
            sess["check_in_time"] = datetime.fromisoformat(sess["check_in_time"])
        if isinstance(sess.get("check_out_time"), str):
            sess["check_out_time"] = datetime.fromisoformat(sess["check_out_time"])
        
        customer = await db.customers.find_one({"customer_id": sess["customer_id"]}, {"_id": 0})
        
        response = CheckInSessionResponse(**sess)
        if customer:
            response.child_name = customer.get("child_name")
            response.guardian_name = customer.get("guardian", {}).get("name")
            response.guardian_phone = customer.get("guardian", {}).get("phone")
        
        result.append(response)
    
    return result
