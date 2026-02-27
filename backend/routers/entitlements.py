from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.entitlement import EntitlementUsage, EntitlementUsageCreate, EntitlementUsageResponse, EntitlementCheck
from models.subscription import PLAN_TIME_WINDOWS
from middleware.auth import get_current_user, require_role
from datetime import datetime, timezone, date, timedelta

router = APIRouter(prefix="/entitlements", tags=["Entitlements"])

PEEKABOO_DAILY_LIMIT_MINUTES = 120  # 2 hours per day for Monthly All-Access


def get_db():
    from server import db
    return db


@router.post("/check", response_model=EntitlementCheck)
async def check_entitlement(
    child_id: str,
    area: str = "DAYCARE",
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Check if a child can access an area based on their entitlements.
    Returns access status and available entitlement details.
    """
    now = datetime.now(timezone.utc)
    today = date.today()
    
    # Check for active subscription
    sub = await db.subscriptions.find_one({
        "child_id": child_id,
        "status": "ACTIVE",
        "expires_at": {"$gt": now.isoformat()}
    }, {"_id": 0})
    
    if sub:
        # Check time window
        plan_type = sub.get("plan_type")
        window = PLAN_TIME_WINDOWS.get(plan_type)
        
        # Check if within allowed time
        jordan_time = now + timedelta(hours=3)  # UTC+3
        current_time = jordan_time.time()
        
        if window and not (window["start"] <= current_time <= window["end"]):
            return EntitlementCheck(
                can_access=False,
                reason=f"الوقت خارج نطاق الاشتراك ({window['start'].strftime('%H:%M')} - {window['end'].strftime('%H:%M')})",
                entitlement_type="SUBSCRIPTION",
                subscription_id=sub["subscription_id"],
                time_window={"start": window["start"].strftime("%H:%M"), "end": window["end"].strftime("%H:%M")}
            )
        
        # Check Peekaboo usage for Monthly All-Access
        peekaboo_minutes_today = 0
        peekaboo_minutes_remaining = PEEKABOO_DAILY_LIMIT_MINUTES
        
        if plan_type == "MONTHLY_ALL_ACCESS":
            # Get today's Peekaboo usage
            usage_today = await db.entitlement_usage.find({
                "subscription_id": sub["subscription_id"],
                "usage_date": today.isoformat()
            }, {"_id": 0}).to_list(100)
            
            peekaboo_minutes_today = sum(u.get("minutes_used", 0) for u in usage_today)
            peekaboo_minutes_remaining = max(0, PEEKABOO_DAILY_LIMIT_MINUTES - peekaboo_minutes_today)
        
        return EntitlementCheck(
            can_access=True,
            reason="اشتراك نشط",
            entitlement_type="SUBSCRIPTION",
            subscription_id=sub["subscription_id"],
            time_window={"start": window["start"].strftime("%H:%M"), "end": window["end"].strftime("%H:%M")} if window else None,
            peekaboo_minutes_today=peekaboo_minutes_today if plan_type == "MONTHLY_ALL_ACCESS" else None,
            peekaboo_minutes_remaining=peekaboo_minutes_remaining if plan_type == "MONTHLY_ALL_ACCESS" else None
        )
    
    # Check for pending subscription (can be activated)
    pending_sub = await db.subscriptions.find_one({
        "child_id": child_id,
        "status": "PENDING"
    }, {"_id": 0})
    
    if pending_sub:
        return EntitlementCheck(
            can_access=True,
            reason="يوجد اشتراك معلق - سيتم تفعيله عند الدخول",
            entitlement_type="SUBSCRIPTION",
            subscription_id=pending_sub["subscription_id"]
        )
    
    # Check for active visit pack
    pack = await db.visit_packs.find_one({
        "child_id": child_id,
        "status": "ACTIVE",
        "remaining_visits": {"$gt": 0}
    }, {"_id": 0})
    
    if pack:
        return EntitlementCheck(
            can_access=True,
            reason=f"باقة زيارات نشطة - متبقي {pack['remaining_visits']} زيارة",
            entitlement_type="VISIT_PACK",
            visit_pack_id=pack["pack_id"],
            remaining_visits=pack["remaining_visits"]
        )
    
    # No entitlement - walk-in required
    return EntitlementCheck(
        can_access=True,
        reason="لا يوجد اشتراك أو باقة - يمكن الدخول بالساعة",
        entitlement_type="WALK_IN"
    )


@router.post("/peekaboo-usage", response_model=EntitlementUsageResponse, status_code=status.HTTP_201_CREATED)
async def record_peekaboo_usage(
    usage_data: EntitlementUsageCreate,
    user: dict = Depends(require_role("ADMIN", "RECEPTION", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Record Peekaboo usage for Monthly All-Access subscription.
    Max 2 hours (120 minutes) per day.
    """
    # Verify subscription exists and is Monthly All-Access
    sub = await db.subscriptions.find_one({
        "subscription_id": usage_data.subscription_id,
        "status": "ACTIVE"
    }, {"_id": 0})
    
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الاشتراك غير موجود أو غير نشط"
        )
    
    if sub.get("plan_type") != "MONTHLY_ALL_ACCESS":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="هذا الاشتراك لا يشمل استخدام بيكابو"
        )
    
    # Check today's usage
    existing_usage = await db.entitlement_usage.find({
        "subscription_id": usage_data.subscription_id,
        "usage_date": usage_data.date.isoformat()
    }, {"_id": 0}).to_list(100)
    
    total_today = sum(u.get("minutes_used", 0) for u in existing_usage)
    
    if total_today + usage_data.minutes_used > PEEKABOO_DAILY_LIMIT_MINUTES:
        remaining = PEEKABOO_DAILY_LIMIT_MINUTES - total_today
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"تجاوز الحد اليومي لبيكابو. المتبقي: {remaining} دقيقة"
        )
    
    # Create usage record
    usage = EntitlementUsage(
        subscription_id=usage_data.subscription_id,
        child_id=usage_data.child_id,
        usage_date=usage_data.date,
        minutes_used=usage_data.minutes_used,
        notes=usage_data.notes,
        recorded_by=user["user_id"]
    )
    
    usage_dict = usage.model_dump()
    usage_dict["created_at"] = usage_dict["created_at"].isoformat()
    usage_dict["usage_date"] = usage_dict["usage_date"].isoformat()
    
    await db.entitlement_usage.insert_one(usage_dict)
    
    response = EntitlementUsageResponse(**usage.model_dump())
    response.remaining_minutes_today = PEEKABOO_DAILY_LIMIT_MINUTES - total_today - usage_data.minutes_used
    
    return response


@router.get("/peekaboo-usage", response_model=List[EntitlementUsageResponse])
async def list_peekaboo_usage(
    subscription_id: Optional[str] = None,
    child_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List Peekaboo usage records"""
    query = {}
    
    if subscription_id:
        query["subscription_id"] = subscription_id
    
    if child_id:
        query["child_id"] = child_id
    
    if date_from:
        query["usage_date"] = {"$gte": date_from}
    
    if date_to:
        if "usage_date" in query:
            query["usage_date"]["$lte"] = date_to
        else:
            query["usage_date"] = {"$lte": date_to}
    
    usage_records = await db.entitlement_usage.find(query, {"_id": 0}).sort("usage_date", -1).to_list(100)
    
    result = []
    for record in usage_records:
        if isinstance(record.get("created_at"), str):
            record["created_at"] = datetime.fromisoformat(record["created_at"])
        if isinstance(record.get("usage_date"), str):
            record["usage_date"] = date.fromisoformat(record["usage_date"])
        
        result.append(EntitlementUsageResponse(**record))
    
    return result
