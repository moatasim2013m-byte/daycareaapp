from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, Dict, Any
from datetime import datetime, timezone
import uuid


ActorType = Literal["parent", "child", "guest", "staff", "system"]
EventType = Literal[
    "CHECK_IN",
    "CHECK_OUT",
    "SESSION_START",
    "SESSION_END",
    "WRISTBAND_ASSIGNED",
    "WRISTBAND_SCAN",
    "ORDER_CREATED",
    "ORDER_COMPLETED",
    "PAYMENT_CAPTURED",
    "MESSAGE_SENT",
]


class EventLedger(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    eventType: EventType
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    actorType: ActorType = "system"
    actorId: Optional[str] = None
    sessionId: Optional[str] = None
    orderId: Optional[str] = None
    deviceId: Optional[str] = None
    branchId: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
