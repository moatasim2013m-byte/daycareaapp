from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime, timezone, time
import uuid

SubscriptionType = Literal["MONTHLY_ALL_ACCESS", "HALF_DAY_MORNING", "HALF_DAY_EVENING"]
SubscriptionStatus = Literal["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"]

# Time windows for each plan type
PLAN_TIME_WINDOWS = {
    "MONTHLY_ALL_ACCESS": {"start": time(7, 0), "end": time(17, 0)},  # 7AM-5PM
    "HALF_DAY_MORNING": {"start": time(7, 0), "end": time(14, 0)},    # 7AM-2PM
    "HALF_DAY_EVENING": {"start": time(12, 0), "end": time(19, 0)}    # 12PM-7PM
}

class SubscriptionCreate(BaseModel):
    guardian_id: str
    child_id: str
    plan_type: SubscriptionType
    order_id: Optional[str] = None


class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    subscription_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    guardian_id: str
    child_id: str
    plan_type: SubscriptionType
    status: SubscriptionStatus = "PENDING"
    
    # Dates
    purchased_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    # Payment link
    order_id: Optional[str] = None
    amount_paid: float = 0.0
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    subscription_id: str
    guardian_id: str
    child_id: str
    plan_type: SubscriptionType
    status: SubscriptionStatus
    purchased_at: datetime
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    amount_paid: float = 0.0
    # Computed
    days_remaining: Optional[int] = None
    is_active: bool = False
    time_window: Optional[dict] = None
    # Populated
    child_name: Optional[str] = None


class VisitPackCreate(BaseModel):
    guardian_id: str
    child_id: str
    order_id: Optional[str] = None


class VisitPack(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    pack_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    guardian_id: str
    child_id: str
    total_visits: int = 12
    remaining_visits: int = 12
    hours_per_visit: float = 4.0
    status: str = "ACTIVE"  # ACTIVE, EXHAUSTED, EXPIRED
    
    order_id: Optional[str] = None
    amount_paid: float = 0.0
    
    purchased_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VisitPackResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    pack_id: str
    guardian_id: str
    child_id: str
    total_visits: int
    remaining_visits: int
    hours_per_visit: float
    status: str
    amount_paid: float
    purchased_at: datetime
    # Populated
    child_name: Optional[str] = None
