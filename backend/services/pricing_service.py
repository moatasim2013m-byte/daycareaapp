from datetime import datetime, timezone


def _minutes_between(start: datetime, end: datetime) -> int:
    start_time = start
    end_time = end

    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)

    return max(0, int((end_time - start_time).total_seconds() / 60))


def calculateSessionPrice(session: dict, pricing_rule: dict) -> tuple[int, float]:
    session_start = session.get("sessionStart") or session.get("started_at") or session.get("checkin_at")
    session_end = session.get("sessionEnd") or session.get("ended_at") or datetime.now(timezone.utc)

    if isinstance(session_start, str):
        session_start = datetime.fromisoformat(session_start)
    if isinstance(session_end, str):
        session_end = datetime.fromisoformat(session_end)

    if not isinstance(session_start, datetime) or not isinstance(session_end, datetime):
        return 0, 0.0

    duration = _minutes_between(session_start, session_end)

    base_duration = int(pricing_rule.get("baseDurationMinutes", 0))
    base_price = float(pricing_rule.get("basePrice", 0.0))
    extra_minute_price = float(pricing_rule.get("extraMinutePrice", 0.0))

    if duration <= base_duration:
        charge = base_price
    else:
        extra_minutes = duration - base_duration
        charge = base_price + (extra_minutes * extra_minute_price)

    return duration, round(charge, 2)

