from datetime import datetime, timezone
from typing import Optional


TEMPLATES = {
    "CHECKIN": "✅ {child_name} checked in at {time}{branch_suffix}.",
    "CHECKOUT": "👋 {child_name} checked out at {time}{branch_suffix}.",
    "PAYMENT": "💳 Payment received: {amount_text} for order {order_ref}.",
    "REMINDER": "⏰ Reminder: {message}",
    "EVENT_REMINDER": "⏰ Reminder: {event_title} on {event_date}.",
    "EVENT_STATUS": "📣 Event update: {event_title} is now {event_status} ({event_date}).",
    "BOOKING_CONFIRMATION": "📌 Booking confirmed: {event_title} on {event_date}.",
    "SUBSCRIPTION_ACTIVATED": "🎟️ Subscription activated for {child_name}. Valid until {expires_at}.",
    "VISIT_PACK_UPDATE": "🧾 Visit pack update for {child_name}: {remaining_visits} visits remaining.",
}


TRIGGER_TO_TEMPLATE = {
    ("CHECKIN", "CHECKED_IN"): "CHECKIN",
    ("SESSION", "CHECKED_IN"): "CHECKIN",
    ("CHECKIN", "CHECKED_OUT"): "CHECKOUT",
    ("SESSION", "CHECKED_OUT"): "CHECKOUT",
    ("ORDER", "PAID"): "PAYMENT",
    ("EVENT", "REMINDER"): "EVENT_REMINDER",
    ("EVENT", "STATUS_UPDATED"): "EVENT_STATUS",
    ("EVENT", "BOOKING_CONFIRMED"): "BOOKING_CONFIRMATION",
    ("SUBSCRIPTION", "RENEWAL_REMINDER"): "REMINDER",
    ("SUBSCRIPTION", "ACTIVATED"): "SUBSCRIPTION_ACTIVATED",
    ("SUBSCRIPTION", "AUTO_ACTIVATED"): "SUBSCRIPTION_ACTIVATED",
    ("VISIT_PACK", "VISIT_CONSUMED"): "VISIT_PACK_UPDATE",
}


async def sendWhatsAppMessage(userId: str, message: str) -> None:
    """Dispatch WhatsApp message (stubbed with persistence for operational traceability)."""
    # Integrations can replace this function with an external provider call.
    _ = (userId, message)


def _format_display_time(value: Optional[str]) -> str:
    if isinstance(value, str) and value:
        try:
            dt = datetime.fromisoformat(value)
            return dt.astimezone(timezone.utc).strftime("%H:%M")
        except ValueError:
            return value
    return datetime.now(timezone.utc).strftime("%H:%M")


def _format_display_date(value: Optional[str]) -> str:
    if isinstance(value, str) and value:
        try:
            dt = datetime.fromisoformat(value)
            return dt.date().isoformat()
        except ValueError:
            return value
    return datetime.now(timezone.utc).date().isoformat()


async def _safe_insert_notification_log(db, payload: dict) -> None:
    try:
        await db.notification_logs.insert_one(payload)
    except Exception:
        return


async def _safe_find_one(db, collection_name: str, query: dict, projection: Optional[dict] = None) -> Optional[dict]:
    collection = getattr(db, collection_name, None)
    if collection is None:
        return None
    try:
        return await collection.find_one(query, projection or {"_id": 0})
    except Exception:
        return None


async def _build_notification_context(db, entity_type: str, entity_id: str, after_state: Optional[dict]) -> dict:
    after_state = after_state or {}
    context = dict(after_state)

    if entity_type == "CHECKIN":
        session = await _safe_find_one(db, "checkin_sessions", {"session_id": entity_id}, {"_id": 0})
        if session:
            context.setdefault("customer_id", session.get("customer_id"))
            context.setdefault("branch_id", session.get("branch_id"))
            context.setdefault("check_in_time", session.get("check_in_time"))
            context.setdefault("check_out_time", session.get("check_out_time"))

    if entity_type == "ORDER":
        order = await _safe_find_one(db, "orders", {"order_id": entity_id}, {"_id": 0})
        if order:
            context.setdefault("total_amount", order.get("total_amount"))
            context.setdefault("order_number", order.get("order_number"))
            context.setdefault("guardian_id", order.get("guardian_id"))

    if entity_type == "SUBSCRIPTION":
        sub = await _safe_find_one(db, "subscriptions", {"subscription_id": entity_id}, {"_id": 0})
        if sub:
            context.setdefault("guardian_id", sub.get("guardian_id"))
            context.setdefault("child_id", sub.get("child_id"))
            context.setdefault("expires_at", sub.get("expires_at"))

    if entity_type == "VISIT_PACK":
        pack = await _safe_find_one(db, "visit_packs", {"pack_id": entity_id}, {"_id": 0})
        if pack:
            context.setdefault("guardian_id", pack.get("guardian_id"))
            context.setdefault("child_id", pack.get("child_id"))
            context.setdefault("remaining_visits", pack.get("remaining_visits"))

    if entity_type == "EVENT":
        event = await _safe_find_one(db, "events", {"id": entity_id}, {"_id": 0})
        if event:
            context.setdefault("event_title", event.get("title"))
            context.setdefault("event_date", event.get("date"))
            context.setdefault("event_status", event.get("status"))

    customer_id = context.get("customer_id")
    if customer_id:
        customer = await _safe_find_one(db, "customers", {"customer_id": customer_id}, {"_id": 0})
        if customer:
            context.setdefault("child_name", customer.get("child_name"))

    child_id = context.get("child_id")
    if child_id:
        child = await _safe_find_one(db, "children", {"child_id": child_id}, {"_id": 0})
        if child:
            context.setdefault("child_name", child.get("full_name"))

    branch_id = context.get("branch_id")
    if branch_id:
        branch = await _safe_find_one(db, "branches", {"branch_id": branch_id}, {"_id": 0})
        if branch:
            context.setdefault("branch_name", branch.get("name") or branch.get("name_ar") or branch_id)

    return context


async def _resolve_recipient_user_id(db, entity_type: str, entity_id: str, after_state: Optional[dict]) -> Optional[str]:
    after_state = after_state or {}

    direct_user_id = after_state.get("guardian_id") or after_state.get("user_id")
    if direct_user_id:
        return direct_user_id

    if entity_type == "CHECKIN":
        session = await _safe_find_one(db, "checkin_sessions", {"session_id": entity_id}, {"_id": 0})
        if session:
            customer = await _safe_find_one(db, "customers", {"customer_id": session.get("customer_id")}, {"_id": 0})
            if customer:
                guardian = customer.get("guardian") or {}
                guardian_email = guardian.get("email")
                guardian_phone = guardian.get("whatsapp") or guardian.get("phone")
                if guardian_email:
                    user = await _safe_find_one(db, "users", {"email": guardian_email}, {"_id": 0, "user_id": 1})
                    if user:
                        return user.get("user_id")
                if guardian_phone:
                    user = await _safe_find_one(db, "users", {"phone": guardian_phone}, {"_id": 0, "user_id": 1})
                    if user:
                        return user.get("user_id")

    if entity_type == "SESSION":
        session = await _safe_find_one(db, "sessions", {"session_id": entity_id}, {"_id": 0, "guardian_id": 1})
        if session:
            return session.get("guardian_id")

    if entity_type == "ORDER":
        order = await _safe_find_one(db, "orders", {"order_id": entity_id}, {"_id": 0, "guardian_id": 1})
        if order:
            return order.get("guardian_id")

    if entity_type == "SUBSCRIPTION":
        sub = await _safe_find_one(db, "subscriptions", {"subscription_id": entity_id}, {"_id": 0, "guardian_id": 1})
        if sub:
            return sub.get("guardian_id")

    if entity_type == "VISIT_PACK":
        pack = await _safe_find_one(db, "visit_packs", {"pack_id": entity_id}, {"_id": 0, "guardian_id": 1})
        if pack:
            return pack.get("guardian_id")

    if entity_type == "EVENT":
        return after_state.get("user_id") or after_state.get("guardian_id")

    return None


def _format_message(template_key: str, entity_type: str, entity_id: str, action: str, after_state: Optional[dict], notes: Optional[str]) -> str:
    after_state = after_state or {}

    if template_key == "CHECKIN":
        child_name = after_state.get("child_name") or after_state.get("customer_id") or "Your child"
        branch = after_state.get("branch_name") or after_state.get("branch_id")
        branch_suffix = f" at {branch}" if branch else ""
        return TEMPLATES["CHECKIN"].format(
            child_name=child_name,
            time=_format_display_time(after_state.get("check_in_time")),
            branch_suffix=branch_suffix,
        )

    if template_key == "CHECKOUT":
        child_name = after_state.get("child_name") or after_state.get("customer_id") or "Your child"
        branch = after_state.get("branch_name") or after_state.get("branch_id")
        branch_suffix = f" at {branch}" if branch else ""
        return TEMPLATES["CHECKOUT"].format(
            child_name=child_name,
            time=_format_display_time(after_state.get("check_out_time")),
            branch_suffix=branch_suffix,
        )

    if template_key == "PAYMENT":
        amount = after_state.get("amount") or after_state.get("total") or after_state.get("total_amount")
        order_ref = after_state.get("order_number") or entity_id
        amount_text = f"{amount} JOD" if amount is not None and amount != "" else "Amount confirmed"
        return TEMPLATES["PAYMENT"].format(amount_text=amount_text, order_ref=order_ref)

    if template_key == "REMINDER":
        detail = notes or f"{entity_type} reminder"
        return TEMPLATES["REMINDER"].format(message=detail)

    if template_key == "EVENT_REMINDER":
        title = after_state.get("event_title") or "Your event"
        event_date = _format_display_date(after_state.get("event_date"))
        return TEMPLATES["EVENT_REMINDER"].format(event_title=title, event_date=event_date)

    if template_key == "EVENT_STATUS":
        title = after_state.get("event_title") or "Your event"
        event_date = _format_display_date(after_state.get("event_date"))
        event_status = str(after_state.get("event_status") or action).lower()
        return TEMPLATES["EVENT_STATUS"].format(event_title=title, event_status=event_status, event_date=event_date)

    if template_key == "BOOKING_CONFIRMATION":
        title = after_state.get("event_title") or "Your event"
        event_date = _format_display_date(after_state.get("event_date"))
        return TEMPLATES["BOOKING_CONFIRMATION"].format(event_title=title, event_date=event_date)

    if template_key == "SUBSCRIPTION_ACTIVATED":
        child_name = after_state.get("child_name") or "your child"
        expires_at = _format_display_date(after_state.get("expires_at"))
        return TEMPLATES["SUBSCRIPTION_ACTIVATED"].format(child_name=child_name, expires_at=expires_at)

    if template_key == "VISIT_PACK_UPDATE":
        child_name = after_state.get("child_name") or "your child"
        remaining_visits = after_state.get("remaining_visits")
        if remaining_visits is None:
            remaining_visits = after_state.get("remaining")
        if remaining_visits is None:
            remaining_visits = "updated"
        return TEMPLATES["VISIT_PACK_UPDATE"].format(child_name=child_name, remaining_visits=remaining_visits)

    detail = notes or f"{entity_type} event: {action}"
    return detail


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
        await _safe_insert_notification_log(
            db,
            {
                "event_type": entity_type,
                "event_id": entity_id,
                "action": action,
                "status": "SKIPPED",
                "reason": "UNSUPPORTED_TRIGGER",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        return None

    notification_context = await _build_notification_context(db, entity_type, entity_id, after_state)
    recipient_user_id = await _resolve_recipient_user_id(db, entity_type, entity_id, notification_context)
    if not recipient_user_id:
        await _safe_insert_notification_log(
            db,
            {
                "event_type": entity_type,
                "event_id": entity_id,
                "action": action,
                "template": template_key,
                "status": "SKIPPED",
                "reason": "RECIPIENT_NOT_FOUND",
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        return None

    message = _format_message(template_key, entity_type, entity_id, action, notification_context, notes)
    await sendWhatsAppMessage(recipient_user_id, message)

    notification_event = {
        "event_type": entity_type,
        "event_id": entity_id,
        "action": action,
        "template": template_key,
        "recipient_user_id": recipient_user_id,
        "message": message,
        "status": "SENT",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await _safe_insert_notification_log(db, notification_event)
    return notification_event
