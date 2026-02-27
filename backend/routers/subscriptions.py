from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.subscription import (
    Subscription, SubscriptionCreate, SubscriptionResponse,
    VisitPack, VisitPackCreate, VisitPackResponse,
    PLAN_TIME_WINDOWS
)
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def get_db():
    from server import db
    return db


@router.get("", response_model=List[SubscriptionResponse])
async def list_subscriptions(
    guardian_id: Optional[str] = None,
    child_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List subscriptions"""
    query = {}
    
    if user.get("role") == "PARENT":
        query["guardian_id"] = user["user_id"]
    elif guardian_id:
        query["guardian_id"] = guardian_id
    
    if child_id:
        query["child_id"] = child_id
    
    if status_filter:
        query["status"] = status_filter
    
    subs = await db.subscriptions.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    now = datetime.now(timezone.utc)
    
    for sub in subs:
        if isinstance(sub.get("purchased_at"), str):
            sub["purchased_at"] = datetime.fromisoformat(sub["purchased_at"])
        if isinstance(sub.get("activated_at"), str):
            sub["activated_at"] = datetime.fromisoformat(sub["activated_at"])
        if isinstance(sub.get("expires_at"), str):
            sub["expires_at"] = datetime.fromisoformat(sub["expires_at"])
        
        # Calculate days remaining and active status
        sub["is_active"] = False
        if sub.get("status") == "ACTIVE" and sub.get("expires_at"):
            expires_at = sub["expires_at"]
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            if expires_at > now:
                sub["days_remaining"] = (expires_at - now).days
                sub["is_active"] = True
            else:
                sub["days_remaining"] = 0
        
        # Add time window
        sub["time_window"] = PLAN_TIME_WINDOWS.get(sub.get("plan_type"))
        
        # Get child name
        if sub.get("child_id"):
            child = await db.children.find_one({"child_id": sub["child_id"]}, {"_id": 0})
            if child:
                sub["child_name"] = child.get("full_name")
        
        result.append(SubscriptionResponse(**sub))
    
    return result


@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    sub_data: SubscriptionCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new subscription (pending activation until first check-in)"""
    # Verify child belongs to guardian
    child = await db.children.find_one({"child_id": sub_data.child_id}, {"_id": 0})
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطفل غير موجود"
        )
    
    if user.get("role") == "PARENT" and child.get("guardian_id") != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="هذا الطفل ليس مسجلاً لك"
        )
    
    # Check for existing active subscription
    existing = await db.subscriptions.find_one({
        "child_id": sub_data.child_id,
        "status": {"$in": ["PENDING", "ACTIVE"]}
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="يوجد اشتراك نشط أو معلق لهذا الطفل"
        )
    
    subscription = Subscription(
        guardian_id=sub_data.guardian_id,
        child_id=sub_data.child_id,
        plan_type=sub_data.plan_type,
        order_id=sub_data.order_id,
        status="PENDING"
    )
    
    sub_dict = subscription.model_dump()
    sub_dict["purchased_at"] = sub_dict["purchased_at"].isoformat()
    sub_dict["created_at"] = sub_dict["created_at"].isoformat()
    sub_dict["updated_at"] = sub_dict["updated_at"].isoformat()
    
    await db.subscriptions.insert_one(sub_dict)
    
    await log_audit(
        db, "SUBSCRIPTION", subscription.subscription_id, "CREATED",
        user["user_id"], user["role"],
        after_state={"plan_type": sub_data.plan_type, "child_id": sub_data.child_id}
    )
    
    response = SubscriptionResponse(**subscription.model_dump())
    response.child_name = child.get("full_name")
    response.time_window = PLAN_TIME_WINDOWS.get(sub_data.plan_type)
    return response


@router.post("/{subscription_id}/activate", response_model=SubscriptionResponse)
async def activate_subscription(
    subscription_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Activate a subscription (starts 30-day countdown)"""
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
    expires_at = now + timedelta(days=30)
    
    await db.subscriptions.update_one(
        {"subscription_id": subscription_id},
        {
            "$set": {
                "status": "ACTIVE",
                "activated_at": now.isoformat(),
                "expires_at": expires_at.isoformat(),
                "updated_at": now.isoformat()
            }
        }
    )
    
    await log_audit(
        db, "SUBSCRIPTION", subscription_id, "ACTIVATED",
        user["user_id"], user["role"],
        after_state={"expires_at": expires_at.isoformat()}
    )
    
    updated = await db.subscriptions.find_one({"subscription_id": subscription_id}, {"_id": 0})
    if isinstance(updated.get("purchased_at"), str):
        updated["purchased_at"] = datetime.fromisoformat(updated["purchased_at"])
    if isinstance(updated.get("activated_at"), str):
        updated["activated_at"] = datetime.fromisoformat(updated["activated_at"])
    if isinstance(updated.get("expires_at"), str):
        updated["expires_at"] = datetime.fromisoformat(updated["expires_at"])
    
    updated["days_remaining"] = 30
    updated["is_active"] = True
    updated["time_window"] = PLAN_TIME_WINDOWS.get(updated.get("plan_type"))
    
    return SubscriptionResponse(**updated)


# Visit Packs
@router.get("/visit-packs", response_model=List[VisitPackResponse])
async def list_visit_packs(
    guardian_id: Optional[str] = None,
    child_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List visit packs"""
    query = {}
    
    if user.get("role") == "PARENT":
        query["guardian_id"] = user["user_id"]
    elif guardian_id:
        query["guardian_id"] = guardian_id
    
    if child_id:
        query["child_id"] = child_id
    
    if status_filter:
        query["status"] = status_filter
    
    packs = await db.visit_packs.find(query, {"_id": 0}).sort("purchased_at", -1).to_list(100)
    
    result = []
    for pack in packs:
        if isinstance(pack.get("purchased_at"), str):
            pack["purchased_at"] = datetime.fromisoformat(pack["purchased_at"])
        
        if pack.get("child_id"):
            child = await db.children.find_one({"child_id": pack["child_id"]}, {"_id": 0})
            if child:
                pack["child_name"] = child.get("full_name")
        
        result.append(VisitPackResponse(**pack))
    
    return result


@router.post("/visit-packs", response_model=VisitPackResponse, status_code=status.HTTP_201_CREATED)
async def create_visit_pack(
    pack_data: VisitPackCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new visit pack (12 visits, 4 hours each)"""
    # Verify child
    child = await db.children.find_one({"child_id": pack_data.child_id}, {"_id": 0})
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطفل غير موجود"
        )
    
    if user.get("role") == "PARENT" and child.get("guardian_id") != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="هذا الطفل ليس مسجلاً لك"
        )
    
    pack = VisitPack(
        guardian_id=pack_data.guardian_id,
        child_id=pack_data.child_id,
        order_id=pack_data.order_id,
        total_visits=12,
        remaining_visits=12,
        hours_per_visit=4.0
    )
    
    pack_dict = pack.model_dump()
    pack_dict["purchased_at"] = pack_dict["purchased_at"].isoformat()
    pack_dict["created_at"] = pack_dict["created_at"].isoformat()
    pack_dict["updated_at"] = pack_dict["updated_at"].isoformat()
    
    await db.visit_packs.insert_one(pack_dict)
    
    await log_audit(
        db, "VISIT_PACK", pack.pack_id, "CREATED",
        user["user_id"], user["role"],
        after_state={"child_id": pack_data.child_id, "visits": 12}
    )
    
    response = VisitPackResponse(**pack.model_dump())
    response.child_name = child.get("full_name")
    return response


@router.post("/visit-packs/{pack_id}/consume", response_model=VisitPackResponse)
async def consume_visit(
    pack_id: str,
    user: dict = Depends(require_role("ADMIN", "RECEPTION", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Consume one visit from a visit pack"""
    pack = await db.visit_packs.find_one({"pack_id": pack_id}, {"_id": 0})
    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الباقة غير موجودة"
        )
    
    if pack.get("status") != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الباقة غير نشطة"
        )
    
    if pack.get("remaining_visits", 0) <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="لا توجد زيارات متبقية"
        )
    
    new_remaining = pack["remaining_visits"] - 1
    new_status = "ACTIVE" if new_remaining > 0 else "EXHAUSTED"
    
    now = datetime.now(timezone.utc)
    await db.visit_packs.update_one(
        {"pack_id": pack_id},
        {
            "$set": {
                "remaining_visits": new_remaining,
                "status": new_status,
                "updated_at": now.isoformat()
            }
        }
    )
    
    await log_audit(
        db, "VISIT_PACK", pack_id, "VISIT_CONSUMED",
        user["user_id"], user["role"],
        before_state={"remaining": pack["remaining_visits"]},
        after_state={"remaining": new_remaining}
    )
    
    updated = await db.visit_packs.find_one({"pack_id": pack_id}, {"_id": 0})
    if isinstance(updated.get("purchased_at"), str):
        updated["purchased_at"] = datetime.fromisoformat(updated["purchased_at"])
    
    return VisitPackResponse(**updated)
