from datetime import datetime, timezone
from typing import Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, ConfigDict, Field


WristbandStatus = Literal["issued", "active", "expired"]


class WristbandAssignRequest(BaseModel):
    code: Optional[str] = None
    child_id: Optional[str] = None
    session_id: str
    branch_id: str
    guest_name: Optional[str] = None


class WristbandScanRequest(BaseModel):
    wristband_id: Optional[str] = None
    code: Optional[str] = None
    scanned_by: Optional[str] = None


class Wristband(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid4()))
    code: str
    child_id: Optional[str] = None
    session_id: str
    branch_id: str
    status: WristbandStatus = "issued"
    issued_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    activated_at: Optional[datetime] = None
    guest_name: Optional[str] = None
    qr_value: str
    qr_code_url: str


class WristbandResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    code: str
    child_id: Optional[str] = None
    session_id: str
    branch_id: str
    status: WristbandStatus
    issued_at: datetime
    activated_at: Optional[datetime] = None
    guest_name: Optional[str] = None
    qr_value: str
    qr_code_url: str
