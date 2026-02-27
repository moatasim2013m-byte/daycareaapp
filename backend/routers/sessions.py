from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.session import (
    Session, SessionCreate, SessionResponse, CheckInRequest, CheckOutRequest,
    calculate_overtime_fee, OVERTIME_RATE_PER_HOUR
)
from models.subscription import PLAN_TIME_WINDOWS
from models.order import Order, OrderItem
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from datetime import datetime, timezone, timedelta, time
import random
import math

router = APIRouter(prefix="/sessions", tags=["Sessions"])


def get_db():
    from server import db
    return db


def is_within_time_window(plan_type: str) -> bool:
    """Check if current time is within the plan's allowed time window"""
    window = PLAN_TIME_WINDOWS.get(plan_type)
    if not window:
        return True
    
    now = datetime.now(timezone.utc)
    # Convert to Jordan time (UTC+3)
    jordan_time = now + timedelta(hours=3)
    current_time = jordan_time.time()
    
    return window["start"] <= current_time <= window["end"]


def calculate_walk_in_price(hours: int) -> tuple:
    """
    Calculate walk-in price based on business rules:
    - 1 hour = 7 JD
    - 2 hours = 10 JD (best value)
    - After 2h: 3 JD per additional hour
    Returns (price, included_minutes)
    """
    if hours <= 1:
        return (7.0, 60)
    elif hours == 2:
        return (10.0, 120)
    else:
        # 2 hours base (10 JD) + 3 JD per additional hour
        additional_hours = hours - 2
        price = 10.0 + (additional_hours * 3.0)
        return (price, hours * 60)


@router.get("", response_model=List[SessionResponse])
async def list_sessions(
    state: Optional[str] = None,
    child_id: Optional[str] = None,
    guardian_id: Optional[str] = None,
    active_only: bool = False,
    limit: int = 50,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List sessions"""
    query = {}
    
    if user.get("role") == "PARENT":
        query["guardian_id"] = user["user_id"]
    elif guardian_id:
        query["guardian_id"] = guardian_id
    
    if state:
        query["state"] = state
    
    if child_id:
        query["child_id"] = child_id
    
    if active_only:
        query["state"] = {"$in": ["CHECKED_IN", "ACTIVE", "OVERDUE"]}
    
    sessions = await db.sessions.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    now = datetime.now(timezone.utc)
    
    for sess in sessions:
        # Parse dates
        for field in ["created_at", "checkin_at", "started_at", "planned_end_at", "ended_at", "closed_at"]:
            if isinstance(sess.get(field), str):
                sess[field] = datetime.fromisoformat(sess[field])
        
        # Calculate time remaining
        if sess.get("state") in ["CHECKED_IN", "ACTIVE"] and sess.get("planned_end_at"):
            planned_end = sess["planned_end_at"]
            if planned_end.tzinfo is None:
                planned_end = planned_end.replace(tzinfo=timezone.utc)
            
            remaining = (planned_end - now).total_seconds() / 60
            sess["time_remaining_minutes"] = max(0, int(remaining))
            sess["is_overdue"] = remaining < 0
        
        # Get child and guardian info
        if sess.get("child_id"):
            child = await db.children.find_one({"child_id": sess["child_id"]}, {"_id": 0})
            if child:
                sess["child_name"] = child.get("full_name")
        
        if sess.get("guardian_id"):
            guardian = await db.users.find_one({"user_id": sess["guardian_id"]}, {"_id": 0})
            if guardian:
                sess["guardian_name"] = guardian.get("display_name")
                sess["guardian_phone"] = guardian.get("phone")
        
        result.append(SessionResponse(**sess))
    
    return result


@router.get("/active", response_model=List[SessionResponse])
async def get_active_sessions(
    user: dict = Depends(require_role("ADMIN", "RECEPTION", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get all active sessions (staff dashboard)"""
    query = {"state": {"$in": ["CHECKED_IN", "ACTIVE", "OVERDUE"]}}
    
    sessions = await db.sessions.find(query, {"_id": 0}).sort("checkin_at", 1).to_list(100)
    
    result = []
    now = datetime.now(timezone.utc)
    
    for sess in sessions:
        for field in ["created_at", "checkin_at", "started_at", "planned_end_at", "ended_at", "closed_at"]:
            if isinstance(sess.get(field), str):
                sess[field] = datetime.fromisoformat(sess[field])
        
        # Calculate time remaining / overdue
        if sess.get("planned_end_at"):
            planned_end = sess["planned_end_at"]
            if planned_end.tzinfo is None:
                planned_end = planned_end.replace(tzinfo=timezone.utc)
            
            remaining = (planned_end - now).total_seconds() / 60
            sess["time_remaining_minutes"] = int(remaining)
            sess["is_overdue"] = remaining < 0
            
            # Update state to OVERDUE if needed
            if remaining < 0 and sess.get("state") == "ACTIVE":
                sess["state"] = "OVERDUE"
                await db.sessions.update_one(
                    {"session_id": sess["session_id"]},
                    {"$set": {"state": "OVERDUE", "updated_at": now.isoformat()}}
                )
        
        # Get child and guardian info
        if sess.get("child_id"):
            child = await db.children.find_one({"child_id": sess["child_id"]}, {"_id": 0})
            if child:
                sess["child_name"] = child.get("full_name")
        
        if sess.get("guardian_id"):
            guardian = await db.users.find_one({"user_id": sess["guardian_id"]}, {"_id": 0})
            if guardian:
                sess["guardian_name"] = guardian.get("display_name")
                sess["guardian_phone"] = guardian.get("phone")
        
        result.append(SessionResponse(**sess))
    
    return result


@router.post("/checkin", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def check_in(
    request: CheckInRequest,
    user: dict = Depends(require_role("ADMIN", "RECEPTION", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Check in a child.
    Supports: Walk-in (1h/2h), Subscription, Visit Pack
    """
    # Verify child exists
    child = await db.children.find_one({"child_id": request.child_id}, {"_id": 0})
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطفل غير موجود"
        )
    
    # Check no active session
    existing = await db.sessions.find_one({
        "child_id": request.child_id,
        "state": {"$in": ["CHECKED_IN", "ACTIVE", "OVERDUE"]}
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الطفل لديه جلسة نشطة بالفعل"
        )
    
    now = datetime.now(timezone.utc)
    session_type = "WALK_IN"
    included_minutes = 120  # Default 2 hours
    subscription_id = None
    visit_pack_id = None
    order_id = None
    
    # Handle subscription check-in
    if request.use_subscription:
        sub = await db.subscriptions.find_one({
            "child_id": request.child_id,
            "status": "ACTIVE",
            "expires_at": {"$gt": now.isoformat()}
        }, {"_id": 0})
        
        if not sub:
            # Check for pending subscription to auto-activate
            pending_sub = await db.subscriptions.find_one({
                "child_id": request.child_id,
                "status": "PENDING"
            }, {"_id": 0})
            
            if pending_sub:
                # Auto-activate
                expires_at = now + timedelta(days=30)
                await db.subscriptions.update_one(
                    {"subscription_id": pending_sub["subscription_id"]},
                    {
                        "$set": {
                            "status": "ACTIVE",
                            "activated_at": now.isoformat(),
                            "expires_at": expires_at.isoformat(),
                            "updated_at": now.isoformat()
                        }
                    }
                )
                sub = pending_sub
                sub["status"] = "ACTIVE"
                sub["expires_at"] = expires_at
                
                await log_audit(
                    db, "SUBSCRIPTION", sub["subscription_id"], "AUTO_ACTIVATED",
                    user["user_id"], user["role"]
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="لا يوجد اشتراك نشط لهذا الطفل"
                )
        
        # Verify time window
        if not is_within_time_window(sub.get("plan_type")):
            window = PLAN_TIME_WINDOWS.get(sub.get("plan_type"))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"الوقت خارج نطاق الاشتراك ({window['start'].strftime('%H:%M')} - {window['end'].strftime('%H:%M')})"
            )
        
        session_type = "SUBSCRIPTION"
        subscription_id = sub["subscription_id"]
        
        # Calculate allowed time based on plan
        if sub.get("plan_type") == "MONTHLY_ALL_ACCESS":
            included_minutes = 600  # 10 hours (full day window)
        elif sub.get("plan_type") == "HALF_DAY_MORNING":
            included_minutes = 420  # 7 hours (7AM-2PM)
        elif sub.get("plan_type") == "HALF_DAY_EVENING":
            included_minutes = 420  # 7 hours (12PM-7PM)
    
    # Handle visit pack check-in
    elif request.use_visit_pack:
        pack = await db.visit_packs.find_one({
            "child_id": request.child_id,
            "status": "ACTIVE",
            "remaining_visits": {"$gt": 0}
        }, {"_id": 0})
        
        if not pack:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="لا توجد باقة زيارات نشطة لهذا الطفل"
            )
        
        # Consume one visit
        new_remaining = pack["remaining_visits"] - 1
        new_status = "ACTIVE" if new_remaining > 0 else "EXHAUSTED"
        
        await db.visit_packs.update_one(
            {"pack_id": pack["pack_id"]},
            {
                "$set": {
                    "remaining_visits": new_remaining,
                    "status": new_status,
                    "updated_at": now.isoformat()
                }
            }
        )
        
        session_type = "VISIT_PACK"
        visit_pack_id = pack["pack_id"]
        included_minutes = int(pack.get("hours_per_visit", 4) * 60)  # 4 hours = 240 minutes
        
        await log_audit(
            db, "VISIT_PACK", pack["pack_id"], "VISIT_CONSUMED",
            user["user_id"], user["role"],
            after_state={"remaining": new_remaining}
        )
    
    # Handle walk-in check-in
    else:
        hours = request.walk_in_hours or 2  # Default to 2 hours (best value)
        price, included_minutes = calculate_walk_in_price(hours)
        
        # Create order for walk-in
        # Get walk-in product
        product = await db.products.find_one({
            "category": "WALK_IN",
            "duration_hours": float(hours)
        }, {"_id": 0})
        
        if not product:
            # Fallback to 2-hour product
            product = await db.products.find_one({
                "name_en": "2 Hour Session (Best Value)"
            }, {"_id": 0})
        
        if product:
            order = Order(
                order_number=f"ORD-{now.strftime('%Y%m%d')}-{random.randint(1000,9999)}",
                guardian_id=request.guardian_id,
                child_id=request.child_id,
                items=[OrderItem(
                    product_id=product["product_id"],
                    product_name_ar=product["name_ar"],
                    product_name_en=product["name_en"],
                    quantity=1,
                    unit_price=price,
                    line_total=price
                )],
                subtotal=price,
                total_amount=price,
                status="OPEN",
                payment_method=request.payment_method or "CASH",
                created_by=user["user_id"]
            )
            
            order_dict = order.model_dump()
            order_dict["created_at"] = order_dict["created_at"].isoformat()
            order_dict["updated_at"] = order_dict["updated_at"].isoformat()
            order_dict["items"] = [dict(item) for item in order_dict["items"]]
            
            await db.orders.insert_one(order_dict)
            order_id = order.order_id
    
    # Create session
    planned_end = now + timedelta(minutes=included_minutes)
    
    session = Session(
        child_id=request.child_id,
        guardian_id=request.guardian_id,
        area=request.area,
        session_type=session_type,
        state="ACTIVE",  # Skip CHECKED_IN, go directly to ACTIVE
        checkin_at=now,
        started_at=now,
        planned_end_at=planned_end,
        included_minutes=included_minutes,
        subscription_id=subscription_id,
        visit_pack_id=visit_pack_id,
        order_id=order_id,
        checked_in_by=user["user_id"]
    )
    
    session_dict = session.model_dump()
    session_dict["created_at"] = session_dict["created_at"].isoformat()
    session_dict["checkin_at"] = session_dict["checkin_at"].isoformat()
    session_dict["started_at"] = session_dict["started_at"].isoformat()
    session_dict["planned_end_at"] = session_dict["planned_end_at"].isoformat()
    session_dict["updated_at"] = session_dict["updated_at"].isoformat()
    
    await db.sessions.insert_one(session_dict)
    
    await log_audit(
        db, "SESSION", session.session_id, "CHECKED_IN",
        user["user_id"], user["role"],
        after_state={
            "child_id": request.child_id,
            "type": session_type,
            "included_minutes": included_minutes
        }
    )
    
    response = SessionResponse(**session.model_dump())
    response.child_name = child.get("full_name")
    response.time_remaining_minutes = included_minutes
    
    return response


@router.post("/checkout", response_model=SessionResponse)
async def check_out(
    request: CheckOutRequest,
    user: dict = Depends(require_role("ADMIN", "RECEPTION", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Check out a child.
    Calculates overtime and creates order for overdue fees if applicable.
    """
    session = await db.sessions.find_one({"session_id": request.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الجلسة غير موجودة"
        )
    
    if session.get("state") not in ["CHECKED_IN", "ACTIVE", "OVERDUE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"لا يمكن إنهاء جلسة بحالة: {session.get('state')}"
        )
    
    now = datetime.now(timezone.utc)
    
    # Calculate actual duration
    started_at = session.get("started_at")
    if isinstance(started_at, str):
        started_at = datetime.fromisoformat(started_at)
    if started_at.tzinfo is None:
        started_at = started_at.replace(tzinfo=timezone.utc)
    
    actual_minutes = int((now - started_at).total_seconds() / 60)
    included_minutes = session.get("included_minutes", 0)
    
    # Calculate overdue
    overdue_minutes = max(0, actual_minutes - included_minutes)
    overdue_amount = calculate_overtime_fee(overdue_minutes)
    
    overtime_order_id = None
    
    # Create overtime order if overdue
    if overdue_amount > 0:
        overtime_product = await db.products.find_one({"category": "OVERTIME"}, {"_id": 0})
        
        if overtime_product:
            extra_hours = math.ceil(overdue_minutes / 60)
            
            order = Order(
                order_number=f"OVT-{now.strftime('%Y%m%d')}-{random.randint(1000,9999)}",
                guardian_id=session.get("guardian_id"),
                child_id=session.get("child_id"),
                items=[OrderItem(
                    product_id=overtime_product["product_id"],
                    product_name_ar=overtime_product["name_ar"],
                    product_name_en=overtime_product["name_en"],
                    quantity=extra_hours,
                    unit_price=OVERTIME_RATE_PER_HOUR,
                    line_total=overdue_amount
                )],
                subtotal=overdue_amount,
                total_amount=overdue_amount,
                status="OPEN",
                payment_method=request.payment_method or "CASH",
                notes=f"رسوم وقت إضافي: {overdue_minutes} دقيقة",
                created_by=user["user_id"]
            )
            
            order_dict = order.model_dump()
            order_dict["created_at"] = order_dict["created_at"].isoformat()
            order_dict["updated_at"] = order_dict["updated_at"].isoformat()
            order_dict["items"] = [dict(item) for item in order_dict["items"]]
            
            await db.orders.insert_one(order_dict)
            overtime_order_id = order.order_id
    
    # Update session
    await db.sessions.update_one(
        {"session_id": request.session_id},
        {
            "$set": {
                "state": "CLOSED",
                "ended_at": now.isoformat(),
                "closed_at": now.isoformat(),
                "actual_minutes": actual_minutes,
                "overdue_minutes": overdue_minutes,
                "overdue_amount": overdue_amount,
                "overtime_order_id": overtime_order_id,
                "checked_out_by": user["user_id"],
                "updated_at": now.isoformat()
            }
        }
    )
    
    await log_audit(
        db, "SESSION", request.session_id, "CHECKED_OUT",
        user["user_id"], user["role"],
        after_state={
            "actual_minutes": actual_minutes,
            "overdue_minutes": overdue_minutes,
            "overdue_amount": overdue_amount
        }
    )
    
    # Get updated session
    updated = await db.sessions.find_one({"session_id": request.session_id}, {"_id": 0})
    for field in ["created_at", "checkin_at", "started_at", "planned_end_at", "ended_at", "closed_at"]:
        if isinstance(updated.get(field), str):
            updated[field] = datetime.fromisoformat(updated[field])
    
    # Get child info
    if updated.get("child_id"):
        child = await db.children.find_one({"child_id": updated["child_id"]}, {"_id": 0})
        if child:
            updated["child_name"] = child.get("full_name")
    
    return SessionResponse(**updated)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get session details"""
    session = await db.sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الجلسة غير موجودة"
        )
    
    # Parents can only view their own children's sessions
    if user.get("role") == "PARENT" and session.get("guardian_id") != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مصرح"
        )
    
    for field in ["created_at", "checkin_at", "started_at", "planned_end_at", "ended_at", "closed_at"]:
        if isinstance(session.get(field), str):
            session[field] = datetime.fromisoformat(session[field])
    
    # Calculate time remaining
    now = datetime.now(timezone.utc)
    if session.get("state") in ["CHECKED_IN", "ACTIVE"] and session.get("planned_end_at"):
        planned_end = session["planned_end_at"]
        if planned_end.tzinfo is None:
            planned_end = planned_end.replace(tzinfo=timezone.utc)
        
        remaining = (planned_end - now).total_seconds() / 60
        session["time_remaining_minutes"] = int(remaining)
        session["is_overdue"] = remaining < 0
    
    # Get child info
    if session.get("child_id"):
        child = await db.children.find_one({"child_id": session["child_id"]}, {"_id": 0})
        if child:
            session["child_name"] = child.get("full_name")
    
    return SessionResponse(**session)
