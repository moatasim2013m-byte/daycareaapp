import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from services import notification_service
from utils.audit import log_audit


class FakeCollection:
    def __init__(self, one=None):
        self.one = one
        self.inserted = []

    async def find_one(self, *args, **kwargs):
        return self.one

    async def insert_one(self, doc):
        self.inserted.append(doc)
        return {"inserted_id": doc.get("event_id") or doc.get("audit_id")}


class FakeDB:
    def __init__(self):
        self.audit_logs = FakeCollection()
        self.notification_logs = FakeCollection()
        self.orders = FakeCollection()
        self.sessions = FakeCollection()
        self.checkin_sessions = FakeCollection()
        self.customers = FakeCollection()
        self.users = FakeCollection()
        self.subscriptions = FakeCollection()


def test_notification_sent_for_payment_event(monkeypatch):
    db = FakeDB()
    db.orders.one = {"order_id": "ord-1", "guardian_id": "parent-1"}

    captured = {}

    async def fake_send(user_id, message):
        captured["user_id"] = user_id
        captured["message"] = message

    monkeypatch.setattr(notification_service, "sendWhatsAppMessage", fake_send)

    event = asyncio.run(notification_service.maybe_send_whatsapp_notification(
        db=db,
        entity_type="ORDER",
        entity_id="ord-1",
        action="PAID",
        after_state={"amount": 22.5, "order_number": "ORD-20260310-1001"},
    ))

    assert event is not None
    assert event["template"] == "PAYMENT"
    assert captured["user_id"] == "parent-1"
    assert "22.5" in captured["message"]
    assert db.notification_logs.inserted


def test_unsupported_event_does_not_send(monkeypatch):
    db = FakeDB()

    called = {"value": False}

    async def fake_send(user_id, message):
        called["value"] = True

    monkeypatch.setattr(notification_service, "sendWhatsAppMessage", fake_send)

    event = asyncio.run(notification_service.maybe_send_whatsapp_notification(
        db=db,
        entity_type="ORDER",
        entity_id="ord-2",
        action="CREATED",
        after_state={"guardian_id": "parent-2"},
    ))

    assert event is None
    assert called["value"] is False
    assert db.notification_logs.inserted == []


def test_log_audit_triggers_notification_pipeline(monkeypatch):
    db = FakeDB()

    async def fake_send(user_id, message):
        return None

    monkeypatch.setattr(notification_service, "sendWhatsAppMessage", fake_send)

    entry = asyncio.run(log_audit(
        db=db,
        entity_type="CHECKIN",
        entity_id="sess-1",
        action="CHECKED_IN",
        actor_user_id="staff-1",
        actor_role="RECEPTION",
        after_state={"guardian_id": "parent-7", "child_name": "Adam"},
    ))

    assert entry["action"] == "CHECKED_IN"
    assert len(db.audit_logs.inserted) == 1
    assert len(db.notification_logs.inserted) == 1
    assert db.notification_logs.inserted[0]["template"] == "CHECKIN"
