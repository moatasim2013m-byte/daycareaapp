from pydantic import BaseModel, ConfigDict, Field
from typing import Literal, Optional, Dict, Any
from datetime import datetime, timezone


DeviceType = Literal["scanner", "kiosk", "rfid_reader", "gate"]
DeviceStatus = Literal["online", "offline", "maintenance"]
DeviceEventType = Literal["DEVICE_SCAN", "DEVICE_HEARTBEAT"]


class Device(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    deviceType: DeviceType
    branchId: str
    status: DeviceStatus = "online"
    lastSeen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DeviceRegisterRequest(BaseModel):
    id: str
    deviceType: DeviceType
    branchId: str
    status: DeviceStatus = "online"


class DevicePingRequest(BaseModel):
    id: str


class DeviceEventRequest(BaseModel):
    id: str
    eventType: DeviceEventType
    payload: Optional[Dict[str, Any]] = None


class DeviceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    deviceType: DeviceType
    branchId: str
    status: DeviceStatus
    lastSeen: datetime
