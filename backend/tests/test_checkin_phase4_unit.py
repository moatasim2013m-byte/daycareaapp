from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from routers import checkin


class FakeCollection:
    def __init__(self, find_one_results=None):
        self.find_one_results = list(find_one_results or [])
        self.inserted = []
        self.updated = []

    async def find_one(self, *args, **kwargs):
        if self.find_one_results:
            return self.find_one_results.pop(0)
        return None

    async def insert_one(self, doc):
        self.inserted.append(doc)

    async def update_one(self, flt, update):
        self.updated.append((flt, update))


class FakeDB:
    def __init__(self, *, products=None, users=None, customers=None, sessions=None, orders=None):
        self.products = products or FakeCollection()
        self.users = users or FakeCollection()
        self.customers = customers or FakeCollection()
        self.checkin_sessions = sessions or FakeCollection()
        self.orders = orders or FakeCollection()


def test_calculate_overdue_uses_hourly_ceiling_rule():
    overdue_minutes, amount = checkin._calculate_overdue(minutes_used=181, included_minutes=120)
    assert overdue_minutes == 61
    assert amount == 6.0


def test_calculate_overdue_no_fee_within_included_minutes():
    overdue_minutes, amount = checkin._calculate_overdue(minutes_used=120, included_minutes=120)
    assert overdue_minutes == 0
    assert amount == 0.0


def test_resolve_included_minutes_prefers_session_value():
    assert checkin._resolve_included_minutes({"included_minutes": 60, "payment_type": "HOURLY"}) == 60


@pytest.mark.asyncio
async def test_create_overtime_order_uses_uuid_and_customer_links():
    products = FakeCollection([
        {"product_id": "OT-1", "name_ar": "رسوم إضافية", "name_en": "Overtime", "is_active": True}
    ])
    users = FakeCollection([{"user_id": "guardian-1"}])
    orders = FakeCollection()
    db = FakeDB(products=products, users=users, orders=orders)

    order_id, order_number = await checkin._create_overtime_order(
        db,
        customer={
            "customer_id": "cust-1",
            "guardian": {"email": "g@example.com"},
        },
        amount=3.0,
        user={"user_id": "staff-1"},
        session_id="sess-1",
    )

    assert order_id
    assert order_number.startswith("ORD-")
    assert len(order_number.split("-")) == 3

    saved = orders.inserted[0]
    assert saved["guardian_id"] == "guardian-1"
    assert saved["child_id"] == "cust-1"
    assert saved["items"][0]["unit_price"] == 3.0


@pytest.mark.asyncio
async def test_checkout_marks_overdue_and_persists_order_number(monkeypatch):
    check_in_time = (datetime.now(timezone.utc) - timedelta(minutes=185)).isoformat()

    sessions = FakeCollection([
        {
            "session_id": "sess-1",
            "customer_id": "cust-1",
            "card_number": "CARD-1",
            "branch_id": "branch-1",
            "payment_type": "HOURLY",
            "check_in_time": check_in_time,
            "status": "CHECKED_IN",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        {
            "session_id": "sess-1",
            "customer_id": "cust-1",
            "card_number": "CARD-1",
            "branch_id": "branch-1",
            "payment_type": "HOURLY",
            "check_in_time": check_in_time,
            "check_out_time": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 185,
            "included_minutes": 120,
            "overdue_minutes": 65,
            "overdue_amount": 6.0,
            "overtime_order_id": "order-1",
            "overtime_order_number": "ORD-20260101-ABCDEFGH",
            "amount_charged": 6.0,
            "status": "OVERDUE",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    ])
    customers = FakeCollection([
        {"customer_id": "cust-1", "guardian": {"name": "Parent", "phone": "123"}, "child_name": "Kid"},
        {"customer_id": "cust-1", "guardian": {"name": "Parent", "phone": "123"}, "child_name": "Kid"},
    ])

    db = FakeDB(sessions=sessions, customers=customers)

    async def fake_create_order(*args, **kwargs):
        return "order-1", "ORD-20260101-ABCDEFGH"

    async def fake_audit(*args, **kwargs):
        return None

    monkeypatch.setattr(checkin, "_create_overtime_order", fake_create_order)
    monkeypatch.setattr(checkin, "log_audit", fake_audit)

    response = await checkin.check_out(
        session_id="sess-1",
        user={"user_id": "staff-1", "role": "RECEPTION"},
        db=db,
    )

    assert response.status == "OVERDUE"
    assert response.overdue_amount == 6.0
    assert response.overtime_order_id == "order-1"
    assert response.overtime_order_number == "ORD-20260101-ABCDEFGH"

    update_payload = sessions.updated[0][1]["$set"]
    assert update_payload["status"] == "OVERDUE"
    assert update_payload["overtime_order_number"] == "ORD-20260101-ABCDEFGH"


@pytest.mark.asyncio
async def test_checkout_rejects_closed_sessions(monkeypatch):
    sessions = FakeCollection([
        {
            "session_id": "sess-closed",
            "customer_id": "cust-1",
            "status": "CHECKED_OUT",
            "check_in_time": datetime.now(timezone.utc).isoformat(),
        }
    ])

    db = FakeDB(sessions=sessions)

    async def fake_audit(*args, **kwargs):
        return None

    monkeypatch.setattr(checkin, "log_audit", fake_audit)

    with pytest.raises(HTTPException) as exc:
        await checkin.check_out(
            session_id="sess-closed",
            user={"user_id": "staff-1", "role": "RECEPTION"},
            db=db,
        )

    assert exc.value.status_code == 400
