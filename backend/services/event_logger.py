from datetime import datetime, timezone
from typing import Any, Dict

from models.event_ledger import EventLedger


class EventLoggerService:
    async def log(self, db, event_type: str, data: Dict[str, Any]):
        event = EventLedger(
            eventType=event_type,
            actorType=data.get("actorType", "system"),
            actorId=data.get("actorId"),
            sessionId=data.get("sessionId"),
            orderId=data.get("orderId"),
            deviceId=data.get("deviceId"),
            branchId=data.get("branchId"),
            metadata=data.get("metadata", {}),
            timestamp=data.get("timestamp") or datetime.now(timezone.utc),
        )

        event_doc = event.model_dump()
        event_doc["timestamp"] = event_doc["timestamp"].isoformat()

        await db.event_ledger.insert_one(event_doc)
        return event_doc


eventLogger = EventLoggerService()
