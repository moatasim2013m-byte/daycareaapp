from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Literal, Optional, Dict, Any
from datetime import datetime, timezone


DeviceType = Literal["scanner", "kiosk", "rfid_reader", "gate"]
DeviceStatus = Literal["online", "offline", "maintenance"]
DeviceEventType = Literal[
    "DEVICE_SCAN",
    "DEVICE_HEARTBEAT",
    "DEVICE_KIOSK_ACTION",
    "DEVICE_ACTIVATION",
]


SUPPORTED_DEVICE_EVENT_TYPES = {
    "DEVICE_SCAN",
    "DEVICE_HEARTBEAT",
    "DEVICE_KIOSK_ACTION",
    "DEVICE_ACTIVATION",
}


class Device(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    deviceType: DeviceType
    branchId: str
    status: DeviceStatus = "online"
    lastSeen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DeviceRegisterRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    deviceType: DeviceType
    branchId: str
    status: DeviceStatus = "online"

    @field_validator("id", "branchId")
    @classmethod
    def validate_required_text(cls, value: str) -> str:
        normalized = (value or "").strip()
        if not normalized:
            raise ValueError("Field is required")
        return normalized


class DevicePingRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        normalized = (value or "").strip()
        if not normalized:
            raise ValueError("Field is required")
        return normalized


class DeviceEventRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    eventType: DeviceEventType | str
    payload: Optional[Dict[str, Any]] = Field(default_factory=dict)

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        normalized = (value or "").strip()
        if not normalized:
            raise ValueError("Field is required")
        return normalized

    @field_validator("eventType")
    @classmethod
    def validate_event_type(cls, value: str) -> str:
        normalized = (value or "").strip().upper()
        aliases = {
            "HEARTBEAT": "DEVICE_HEARTBEAT",
            "SCAN": "DEVICE_SCAN",
            "KIOSK_ACTION": "DEVICE_KIOSK_ACTION",
            "ACTIVATION": "DEVICE_ACTIVATION",
        }
        normalized = aliases.get(normalized, normalized)
        if normalized not in SUPPORTED_DEVICE_EVENT_TYPES:
            raise ValueError("Unsupported event type")
        return normalized

    @field_validator("payload", mode="before")
    @classmethod
    def coerce_payload_to_dict(cls, value: Any) -> Dict[str, Any]:
        if value is None:
            return {}
        if isinstance(value, dict):
            return value
        return {"raw": value}


class DeviceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    deviceType: DeviceType
    branchId: str
    status: DeviceStatus
    lastSeen: datetime


class DeviceStatusResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    deviceType: DeviceType
    branchId: str
    status: DeviceStatus
    effectiveStatus: Literal["online", "offline", "maintenance"]
    lastSeen: Optional[datetime] = None
