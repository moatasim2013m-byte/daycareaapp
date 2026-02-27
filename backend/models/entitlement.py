from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone, date
import uuid


class EntitlementUsageCreate(BaseModel):
    """Record Peekaboo usage for Monthly All-Access plan"""
    subscription_id: str
    child_id: str
    date: date
    minutes_used: int
    notes: Optional[str] = None


class EntitlementUsage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    usage_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    subscription_id: str
    child_id: str
    usage_date: date
    minutes_used: int  # Max 120 minutes (2 hours) per day for Peekaboo
    notes: Optional[str] = None
    recorded_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EntitlementUsageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    usage_id: str
    subscription_id: str
    child_id: str
    usage_date: date
    minutes_used: int
    notes: Optional[str] = None
    created_at: datetime
    # Computed
    remaining_minutes_today: int = 120  # 2 hours = 120 minutes max


class EntitlementCheck(BaseModel):
    """Response for checking if a child can access an area"""
    can_access: bool = False
    reason: str = ""
    entitlement_type: Optional[str] = None  # SUBSCRIPTION, VISIT_PACK, WALK_IN
    subscription_id: Optional[str] = None
    visit_pack_id: Optional[str] = None
    time_window: Optional[dict] = None
    remaining_visits: Optional[int] = None
    peekaboo_minutes_today: Optional[int] = None
    peekaboo_minutes_remaining: Optional[int] = None
