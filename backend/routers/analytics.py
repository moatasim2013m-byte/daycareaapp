from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from middleware.auth import require_role

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def get_db():
    from server import db
    return db


def _to_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def _is_between(value: Any, start: datetime, end: datetime) -> bool:
    parsed = _to_datetime(value)
    return bool(parsed and start <= parsed <= end)


def _classify_line_item(item: Dict[str, Any]) -> str:
    category = str(item.get("category") or "").upper()
    product_name = f"{item.get('product_name_en', '')} {item.get('product_name_ar', '')}".upper()

    if "EVENT" in category or "BOOK" in product_name or "EVENT" in product_name:
        return "event"
    if "SUBSCRIPTION" in category or "MONTHLY" in product_name or "HALF-DAY" in product_name:
        return "membership"
    return "pos"


@router.get("/revenue")
async def analytics_revenue(
    user: dict = Depends(require_role("ADMIN", "RECEPTION", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Revenue KPIs and chart data for the admin dashboard."""
    _ = user
    now = datetime.now(timezone.utc)
    start_today = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    start_week = start_today - timedelta(days=6)

    paid_orders = await db.orders.find(
        {
            "status": "PAID",
            "paid_at": {"$gte": start_week.isoformat(), "$lte": now.isoformat()},
        },
        {"_id": 0},
    ).to_list(5000)

    revenue_today = 0.0
    revenue_week = 0.0
    membership_revenue = 0.0
    pos_revenue = 0.0
    event_bookings_revenue = 0.0
    daily_bucket: Dict[str, float] = defaultdict(float)
    product_bucket: Dict[str, Dict[str, float]] = defaultdict(lambda: {"revenue": 0.0, "units": 0})

    for order in paid_orders:
        paid_at = order.get("paid_at")
        if not _is_between(paid_at, start_week, now):
            continue

        paid_dt = _to_datetime(paid_at)
        if not paid_dt:
            continue

        order_total = float(order.get("total_amount", 0) or 0)
        revenue_week += order_total
        if paid_dt >= start_today:
            revenue_today += order_total

        day_key = paid_dt.date().isoformat()
        daily_bucket[day_key] += order_total

        for item in order.get("items", []):
            line_total = float(item.get("line_total", 0) or 0)
            quantity = int(item.get("quantity", 0) or 0)
            bucket_name = _classify_line_item(item)

            if bucket_name == "membership":
                membership_revenue += line_total
            elif bucket_name == "event":
                event_bookings_revenue += line_total
            else:
                pos_revenue += line_total

            product_name = item.get("product_name_en") or item.get("product_name_ar") or "Unknown Product"
            product_bucket[product_name]["revenue"] += line_total
            product_bucket[product_name]["units"] += quantity

    daily_revenue: List[Dict[str, Any]] = []
    for offset in range(6, -1, -1):
        day = (date.today() - timedelta(days=offset)).isoformat()
        daily_revenue.append({"date": day, "revenue": round(daily_bucket.get(day, 0.0), 2)})

    top_products = sorted(
        (
            {
                "name": product_name,
                "revenue": round(metrics["revenue"], 2),
                "units": metrics["units"],
            }
            for product_name, metrics in product_bucket.items()
        ),
        key=lambda row: row["revenue"],
        reverse=True,
    )[:5]

    return {
        "metrics": {
            "revenue_today": round(revenue_today, 2),
            "revenue_this_week": round(revenue_week, 2),
            "membership_revenue": round(membership_revenue, 2),
            "pos_revenue": round(pos_revenue, 2),
            "event_bookings_revenue": round(event_bookings_revenue, 2),
        },
        "charts": {
            "daily_revenue": daily_revenue,
            "top_products": top_products,
        },
    }


@router.get("/attendance")
async def analytics_attendance(
    user: dict = Depends(require_role("ADMIN", "RECEPTION", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Attendance KPIs and membership trend chart data."""
    _ = user
    now = datetime.now(timezone.utc)
    start_today = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)

    sessions_today = await db.sessions.count_documents(
        {
            "checkin_at": {"$gte": start_today.isoformat(), "$lte": now.isoformat()},
        }
    )

    month_labels: List[datetime] = []
    current_month = date.today().replace(day=1)
    for offset in range(5, -1, -1):
        month_start = current_month - timedelta(days=offset * 30)
        month_labels.append(datetime.combine(month_start.replace(day=1), datetime.min.time()).replace(tzinfo=timezone.utc))

    subscriptions = await db.subscriptions.find({}, {"_id": 0, "plan_type": 1, "purchased_at": 1, "price": 1}).to_list(5000)

    trends: Dict[str, Dict[str, Any]] = {}
    for month_start in month_labels:
        label = month_start.strftime("%Y-%m")
        trends[label] = {"month": label, "memberships": 0, "revenue": 0.0}

    for sub in subscriptions:
        purchased_at = _to_datetime(sub.get("purchased_at"))
        if not purchased_at:
            continue
        label = purchased_at.strftime("%Y-%m")
        if label in trends:
            trends[label]["memberships"] += 1
            trends[label]["revenue"] += float(sub.get("price", 0) or 0)

    membership_trends = [
        {
            "month": item["month"],
            "memberships": item["memberships"],
            "revenue": round(item["revenue"], 2),
        }
        for item in trends.values()
    ]

    return {
        "metrics": {
            "visits_today": sessions_today,
        },
        "charts": {
            "membership_trends": membership_trends,
        },
    }


@router.get("/sessions")
async def analytics_sessions(
    user: dict = Depends(require_role("ADMIN", "RECEPTION", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Session activity KPIs and utilization chart data."""
    _ = user

    active_states = ["CHECKED_IN", "ACTIVE", "OVERDUE"]
    active_sessions = await db.sessions.count_documents({"state": {"$in": active_states}})

    utilization_counts = {"DAYCARE": 0, "SAND": 0}
    session_type_counts = {"WALK_IN": 0, "SUBSCRIPTION": 0, "VISIT_PACK": 0}

    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    todays_sessions = await db.sessions.find(
        {"checkin_at": {"$gte": today_start.isoformat(), "$lte": now.isoformat()}},
        {"_id": 0, "area": 1, "session_type": 1},
    ).to_list(5000)

    for session in todays_sessions:
        area = session.get("area", "DAYCARE")
        session_type = session.get("session_type", "WALK_IN")
        if area in utilization_counts:
            utilization_counts[area] += 1
        if session_type in session_type_counts:
            session_type_counts[session_type] += 1

    session_utilization = [
        {"name": "Daycare", "sessions": utilization_counts["DAYCARE"]},
        {"name": "Sand Area", "sessions": utilization_counts["SAND"]},
    ]

    return {
        "metrics": {
            "active_sessions": active_sessions,
        },
        "charts": {
            "session_utilization": session_utilization,
            "session_mix": [
                {"name": key, "value": value}
                for key, value in session_type_counts.items()
            ],
        },
    }
