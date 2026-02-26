from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional
from datetime import datetime, timezone
import uuid


ZoneType = Literal["SOFTPLAY", "SAND", "DAYCARE", "PARTY_ROOM", "CAFE"]


class ZoneCreate(BaseModel):
    branch_id: str
    zone_name: str
    zone_name_ar: str
    zone_type: ZoneType
    capacity_per_slot: int
    session_length_minutes: int = 60
    grace_period_minutes: int = 10
    overdue_rate_per_15min: float = 30.00


class ZoneUpdate(BaseModel):
    zone_name: Optional[str] = None
    zone_name_ar: Optional[str] = None
    capacity_per_slot: Optional[int] = None
    session_length_minutes: Optional[int] = None
    grace_period_minutes: Optional[int] = None
    overdue_rate_per_15min: Optional[float] = None
    status: Optional[str] = None


class Zone(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    zone_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    branch_id: str
    zone_name: str
    zone_name_ar: str
    zone_type: ZoneType
    capacity_per_slot: int
    session_length_minutes: int = 60
    grace_period_minutes: int = 10
    overdue_rate_per_15min: float = 30.00
    status: str = "active"  # active | maintenance | closed
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ZoneResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    zone_id: str
    branch_id: str
    zone_name: str
    zone_name_ar: str
    zone_type: ZoneType
    capacity_per_slot: int
    session_length_minutes: int
    grace_period_minutes: int
    overdue_rate_per_15min: float
    status: str
    created_at: datetime