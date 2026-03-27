from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from middleware.auth import require_role

router = APIRouter(prefix="/parent", tags=["Parent Portal"])


def get_db():
    from server import db
    return db


def _sample_feed():
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "feed-1",
            "type": "daily_report",
            "title": "Daily report shared",
            "description": "Today your child completed circle time and art activities.",
            "photo_url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600",
            "created_at": (now - timedelta(hours=2)).isoformat(),
        },
        {
            "id": "feed-2",
            "type": "photo",
            "title": "Photo update",
            "description": "Outdoor play session with classmates.",
            "photo_url": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600",
            "created_at": (now - timedelta(hours=4)).isoformat(),
        },
    ]


def _sample_attendance():
    now = datetime.now(timezone.utc)
    return [
        {
            "session_id": "session-1",
            "date": (now - timedelta(days=1)).date().isoformat(),
            "check_in": (now - timedelta(days=1, hours=8)).isoformat(),
            "check_out": (now - timedelta(days=1, hours=1)).isoformat(),
            "duration_minutes": 420,
            "status": "Present",
        },
        {
            "session_id": "session-2",
            "date": (now - timedelta(days=2)).date().isoformat(),
            "check_in": (now - timedelta(days=2, hours=8)).isoformat(),
            "check_out": (now - timedelta(days=2, hours=2)).isoformat(),
            "duration_minutes": 360,
            "status": "Present",
        },
    ]


def _sample_payments():
    now = datetime.now(timezone.utc)
    return {
        "subscription_status": "ACTIVE",
        "visit_pack": {
            "name": "10 Visits Pack",
            "status": "ACTIVE",
            "visits_remaining": 6,
            "expiry_date": (now + timedelta(days=45)).isoformat(),
        },
        "payment_history": [
            {
                "payment_id": "pay-1",
                "amount": 180.0,
                "currency": "JOD",
                "status": "COMPLETED",
                "method": "CARD",
                "paid_at": (now - timedelta(days=8)).isoformat(),
                "description": "Monthly subscription",
            },
            {
                "payment_id": "pay-2",
                "amount": 25.0,
                "currency": "JOD",
                "status": "COMPLETED",
                "method": "CARD",
                "paid_at": (now - timedelta(days=2)).isoformat(),
                "description": "Extended hours",
            },
        ],
        "recent_orders": [
            {
                "order_id": "ord-1",
                "total_amount": 180.0,
                "currency": "JOD",
                "status": "PAID",
                "created_at": (now - timedelta(days=8)).isoformat(),
            },
            {
                "order_id": "ord-2",
                "total_amount": 25.0,
                "currency": "JOD",
                "status": "PAID",
                "created_at": (now - timedelta(days=2)).isoformat(),
            },
        ],
    }


def _sample_messages():
    now = datetime.now(timezone.utc)
    return [
        {
            "id": "msg-1",
            "sender": "Teacher Dana",
            "subject": "Nap time update",
            "body": "She slept for 1 hour and woke up cheerful.",
            "created_at": (now - timedelta(hours=3)).isoformat(),
            "unread": True,
        },
        {
            "id": "msg-2",
            "sender": "Front Desk",
            "subject": "Reminder",
            "body": "Please confirm tomorrow pickup schedule.",
            "created_at": (now - timedelta(days=1)).isoformat(),
            "unread": False,
        },
    ]


def _sample_bookings():
    now = datetime.now(timezone.utc)
    return {
        "session_visits": [
            {
                "booking_id": "book-1",
                "service": "After-school care",
                "date": (now + timedelta(days=1)).date().isoformat(),
                "time": "14:00",
                "status": "CONFIRMED",
            },
            {
                "booking_id": "book-2",
                "service": "Weekend activity",
                "date": (now + timedelta(days=4)).date().isoformat(),
                "time": "10:00",
                "status": "PENDING",
            },
        ],
        "upcoming_event": {
            "title": "Family day workshop",
            "status": "OPEN",
            "start_at": (now + timedelta(days=3, hours=1)).isoformat(),
        },
    }


@router.get("/feed")
async def get_parent_feed(
    current_user: dict = Depends(require_role("PARENT", "ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return _sample_feed()

    children = await db.children.find({"guardian_id": current_user.get("user_id")}, {"_id": 0, "child_id": 1}).to_list(length=20)
    child_ids = [c.get("child_id") for c in children if c.get("child_id")]

    if not child_ids:
        return []

    feed = await db.parent_feed.find(
        {"child_id": {"$in": child_ids}},
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=50)

    return feed


@router.get("/attendance")
async def get_parent_attendance(
    current_user: dict = Depends(require_role("PARENT", "ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return _sample_attendance()

    children = await db.children.find({"guardian_id": current_user.get("user_id")}, {"_id": 0, "child_id": 1}).to_list(length=20)
    child_ids = [c.get("child_id") for c in children if c.get("child_id")]
    if not child_ids:
        return []

    sessions = await db.sessions.find(
        {"child_id": {"$in": child_ids}},
        {"_id": 0, "session_id": 1, "checkin_at": 1, "checkout_at": 1, "duration_minutes": 1, "state": 1},
    ).sort("checkin_at", -1).to_list(length=90)

    mapped = []
    for session in sessions:
        check_in = session.get("checkin_at")
        check_out = session.get("checkout_at")
        if isinstance(check_in, datetime):
            check_in = check_in.isoformat()
        if isinstance(check_out, datetime):
            check_out = check_out.isoformat()

        mapped.append(
            {
                "session_id": session.get("session_id"),
                "date": check_in[:10] if isinstance(check_in, str) else None,
                "check_in": check_in,
                "check_out": check_out,
                "duration_minutes": session.get("duration_minutes", 0),
                "status": "Present" if session.get("state") in {"ACTIVE", "CLOSED"} else "Absent",
            }
        )

    return mapped


@router.get("/payments")
async def get_parent_payments(
    current_user: dict = Depends(require_role("PARENT", "ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return _sample_payments()

    children = await db.children.find({"guardian_id": current_user.get("user_id")}, {"_id": 0, "child_id": 1}).to_list(length=20)
    child_ids = [c.get("child_id") for c in children if c.get("child_id")]

    subscription = await db.subscriptions.find_one(
        {"child_id": {"$in": child_ids}, "status": {"$in": ["ACTIVE", "PAUSED", "EXPIRED"]}},
        {"_id": 0, "status": 1},
        sort=[("created_at", -1)],
    )

    payment_query = {"child_id": {"$in": child_ids}} if child_ids else {"_id": None}
    payments = await db.payments.find(payment_query, {"_id": 0}).sort("created_at", -1).to_list(length=30)

    normalized = []
    for payment in payments:
        created_at = payment.get("created_at")
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()

        normalized.append(
            {
                "payment_id": payment.get("payment_id"),
                "amount": payment.get("amount", 0),
                "currency": "JOD",
                "status": payment.get("status", "PENDING"),
                "method": payment.get("payment_method", "CARD"),
                "paid_at": created_at,
                "description": payment.get("notes") or "Payment",
            }
        )

    visit_pack = await db.entitlements.find_one(
        {
            "child_id": {"$in": child_ids},
            "kind": {"$in": ["VISIT_PACK", "PACKAGE", "PACK"]},
        },
        {"_id": 0, "name": 1, "status": 1, "remaining_visits": 1, "visits_remaining": 1, "expires_at": 1, "expiry_date": 1},
        sort=[("created_at", -1)],
    )

    recent_orders = await db.orders.find(
        {"child_id": {"$in": child_ids}},
        {"_id": 0, "order_id": 1, "total_amount": 1, "status": 1, "created_at": 1, "currency": 1},
    ).sort("created_at", -1).to_list(length=5)

    normalized_orders = []
    for order in recent_orders:
        created_at = order.get("created_at")
        if isinstance(created_at, datetime):
            created_at = created_at.isoformat()

        normalized_orders.append(
            {
                "order_id": order.get("order_id"),
                "total_amount": order.get("total_amount", 0),
                "status": order.get("status", "PENDING"),
                "currency": order.get("currency", "JOD"),
                "created_at": created_at,
            }
        )

    mapped_pack = None
    if visit_pack:
        expiry_date = visit_pack.get("expires_at") or visit_pack.get("expiry_date")
        if isinstance(expiry_date, datetime):
            expiry_date = expiry_date.isoformat()

        mapped_pack = {
            "name": visit_pack.get("name") or "Visit Pack",
            "status": visit_pack.get("status", "ACTIVE"),
            "visits_remaining": visit_pack.get("visits_remaining", visit_pack.get("remaining_visits")),
            "expiry_date": expiry_date,
        }

    return {
        "subscription_status": subscription.get("status", "NONE") if subscription else "NONE",
        "visit_pack": mapped_pack,
        "payment_history": normalized,
        "recent_orders": normalized_orders,
    }


@router.get("/messages")
async def get_parent_messages(
    current_user: dict = Depends(require_role("PARENT", "ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return _sample_messages()

    messages = await db.parent_messages.find(
        {"guardian_id": current_user.get("user_id")},
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=50)

    return messages


@router.get("/bookings")
async def get_parent_bookings(
    current_user: dict = Depends(require_role("PARENT", "ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return _sample_bookings()

    bookings = await db.bookings.find(
        {"guardian_id": current_user.get("user_id")},
        {"_id": 0},
    ).sort("date", 1).to_list(length=30)

    child_ids = [booking.get("child_id") for booking in bookings if booking.get("child_id")]
    upcoming_event = None
    if child_ids:
        upcoming_event = await db.event_bookings.find_one(
            {
                "child_id": {"$in": child_ids},
                "start_at": {"$gte": datetime.now(timezone.utc)},
            },
            {"_id": 0, "title": 1, "status": 1, "start_at": 1},
            sort=[("start_at", 1)],
        )
        if upcoming_event and isinstance(upcoming_event.get("start_at"), datetime):
            upcoming_event["start_at"] = upcoming_event["start_at"].isoformat()

    return {
        "session_visits": bookings,
        "upcoming_event": upcoming_event,
    }
