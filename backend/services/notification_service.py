from datetime import datetime, timezone
from typing import Optional


TEMPLATES = {
    "CHECKIN": "✅ Check-in: {child_name} has checked in at {time}.",
    "CHECKOUT": "👋 Check-out: {child_name} has checked out at {time}.",
    "PAYMENT": "💳 Payment received: {amount} JOD for order {order_ref}.",
    "REMINDER": "⏰ Reminder: {message}",
    "BOOKING_CONFIRMATION": "📌 Booking confirmed: {message}",
}


TRIGGER_TO_TEMPLATE = {
    ("CHECKIN", "CHECKED_IN"): "CHECKIN",
    ("SESSION", "CHECKED_IN"): "CHECKIN",
    ("CHECKIN", "CHECKED_OUT"): "CHECKOUT",
    ("SESSION", "CHECKED_OUT"): "CHECKOUT",
    ("ORDER", "PAID"): "PAYMENT",
    ("EVENT", "REMINDER"): "REMINDER",
    ("EVENT", "BOOKING_CONFIRMED"): "BOOKING_CONFIRMATION",
    ("SUBSCRIPTION", "RENEWAL_REMINDER"): "REMINDER",
}


async def sendWhatsAppMessage(userId: str, message: str) -> None:
    """Dispatch WhatsApp message (stubbed with persistence for operational traceability)."""
    # Integrations can replace this function with an external provider call.
    _ = (userId, message)


async def _resolve_recipient_user_id(db, entity_type: str, entity_id: str, after_state: Optional[dict]) -> Optional[str]:
    after_state = after_state or {}

    direct_user_id = after_state.get("guardian_id") or after_state.get("user_id")
    if direct_user_id:
        return direct_user_id

    if entity_type == "CHECKIN":
        session = await db.checkin_sessions.find_one({"session_id": entity_id}, {"_id": 0})
        if session:
            customer = await db.customers.find_one({"customer_id": session.get("customer_id")}, {"_id": 0})
            if customer:
                guardian = customer.get("guardian") or {}
                guardian_email = guardian.get("email")
                guardian_phone = guardian.get("whatsapp") or guardian.get("phone")
                if guardian_email:
                    user = await db.users.find_one({"email": guardian_email}, {"_id": 0, "user_id": 1})
                    if user:
                        return user.get("user_id")
                if guardian_phone:
                    user = await db.users.find_one({"phone": guardian_phone}, {"_id": 0, "user_id": 1})
                    if user:
                        return user.get("user_id")

    if entity_type == "SESSION":
        session = await db.sessions.find_one({"session_id": entity_id}, {"_id": 0, "guardian_id": 1})
        if session:
            return session.get("guardian_id")

    if entity_type == "ORDER":
        order = await db.orders.find_one({"order_id": entity_id}, {"_id": 0, "guardian_id": 1})
        if order:
            return order.get("guardian_id")

    if entity_type == "SUBSCRIPTION":
        sub = await db.subscriptions.find_one({"subscription_id": entity_id}, {"_id": 0, "guardian_id": 1})
        if sub:
            return sub.get("guardian_id")

    return None


def _format_message(template_key: str, entity_type: str, entity_id: str, action: str, after_state: Optional[dict], notes: Optional[str]) -> str:
    after_state = after_state or {}
    now_local = datetime.now(timezone.utc).strftime("%H:%M")

    if template_key == "CHECKIN":
        child_name = after_state.get("child_name") or after_state.get("customer_id") or "Your child"
        return TEMPLATES["CHECKIN"].format(child_name=child_name, time=now_local)

    if template_key == "CHECKOUT":
        child_name = after_state.get("child_name") or after_state.get("customer_id") or "Your child"
        return TEMPLATES["CHECKOUT"].format(child_name=child_name, time=now_local)

    if template_key == "PAYMENT":
        amount = after_state.get("amount") or after_state.get("total") or ""
        order_ref = after_state.get("order_number") or entity_id
        return TEMPLATES["PAYMENT"].format(amount=amount, order_ref=order_ref)

    detail = notes or f"{entity_type} event: {action}"
    return TEMPLATES[template_key].format(message=detail)


async def maybe_send_whatsapp_notification(
    db,
    entity_type: str,
    entity_id: str,
    action: str,
    after_state: Optional[dict] = None,
    notes: Optional[str] = None,
) -> Optional[dict]:
    """Event-ledger integration hook: dispatch WhatsApp notifications for supported triggers."""
    template_key = TRIGGER_TO_TEMPLATE.get((entity_type, action))
    if not template_key:
        return None

    recipient_user_id = await _resolve_recipient_user_id(db, entity_type, entity_id, after_state)
    if not recipient_user_id:
        return None

    message = _format_message(template_key, entity_type, entity_id, action, after_state, notes)
    await sendWhatsAppMessage(recipient_user_id, message)

    notification_event = {
        "event_type": entity_type,
        "event_id": entity_id,
        "action": action,
        "template": template_key,
        "recipient_user_id": recipient_user_id,
        "message": message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notification_logs.insert_one(notification_event)
    return notification_event
