import pytest
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from routers.checkin import _build_overdue_meta, _create_overtime_order, _resolve_included_minutes


class FakeCollection:
    def __init__(self, one=None):
        self.one = one
        self.inserted = []

    async def find_one(self, *args, **kwargs):
        return self.one

    async def insert_one(self, doc):
        self.inserted.append(doc)
        return {"inserted_id": doc.get("order_id")}


class FakeDB:
    def __init__(self, product=None):
        self.products = FakeCollection(one=product)
        self.orders = FakeCollection()


def test_overdue_rule_ceil_hourly_rate():
    meta = _build_overdue_meta(duration=181, included_minutes=120)
    assert meta["overdue_minutes"] == 61
    assert meta["overdue_hours_charged"] == 2
    assert meta["overdue_amount"] == 6.0


def test_overdue_rule_zero_when_within_included_time():
    meta = _build_overdue_meta(duration=60, included_minutes=120)
    assert meta["overdue_minutes"] == 0
    assert meta["overdue_amount"] == 0.0
    assert meta["is_overdue"] is False


def test_resolve_included_minutes_prefers_session_value():
    assert _resolve_included_minutes({"included_minutes": 60, "payment_type": "HOURLY"}) == 60
    assert _resolve_included_minutes({"payment_type": "SUBSCRIPTION"}) == 600
    assert _resolve_included_minutes({"payment_type": "HOURLY"}) == 120


@pytest.mark.asyncio
async def test_overtime_order_uses_uuid_and_customer_context():
    db = FakeDB(product={
        "product_id": "OVERTIME_PRODUCT",
        "name_ar": "رسوم الوقت الإضافي",
        "name_en": "Overtime Fee"
    })

    customer = {
        "customer_id": "cust-123",
        "guardian": {"national_id": "guard-777"}
    }
    order_id, order_number = await _create_overtime_order(
        db=db,
        customer=customer,
        amount=3.0,
        user={"user_id": "staff-1"},
        session_id="sess-1",
    )

    assert order_id
    assert order_number.startswith("ORD-")

    inserted = db.orders.inserted[0]
    assert inserted["order_id"] == order_id
    assert inserted["guardian_id"] == "guard-777"
    assert inserted["child_id"] == "cust-123"
    assert inserted["items"][0]["item_id"]
