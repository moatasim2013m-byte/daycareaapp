from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, Optional
from datetime import datetime, timezone
import uuid


class OperatingHours(BaseModel):
    open: str  # HH:MM format
    close: str
    closed: bool = False


class BranchSettings(BaseModel):
    default_grace_period_minutes: int = 10
    default_overdue_rate_per_15min: float = 5.00  # JOD
    currency: str = "JOD"
    tax_rate: float = 0.16  # Jordan 16% sales tax
    language_default: str = "ar"


class BranchCreate(BaseModel):
    name: str
    name_ar: str
    address: str
    city: str
    phone: str
    email: str
    timezone: str = "Asia/Amman"
    settings: Optional[BranchSettings] = None


class BranchUpdate(BaseModel):
    name: Optional[str] = None
    name_ar: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None
    settings: Optional[BranchSettings] = None


class Branch(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    branch_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_ar: str
    address: str
    city: str
    phone: str
    email: str
    timezone: str = "Asia/Amman"
    settings: BranchSettings = Field(default_factory=BranchSettings)
    status: str = "active"  # active | inactive
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BranchResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    branch_id: str
    name: str
    name_ar: str
    address: str
    city: str
    phone: str
    email: str
    timezone: str
    settings: BranchSettings
    status: str
    created_at: datetime