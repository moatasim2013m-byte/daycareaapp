from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime, timezone
import uuid
import math

SessionState = Literal["CREATED", "CHECKED_IN", "ACTIVE", "ENDED", "OVERDUE", "CLOSED"]
SessionType = Literal["WALK_IN", "SUBSCRIPTION", "VISIT_PACK"]
AreaType = Literal["DAYCARE", "SAND"]

# Pricing constants
OVERTIME_RATE_PER_HOUR = 3.0  # 3 JD per additional hour after included time


def calculate_overtime_fee(extra_minutes: int) -> float:
    """
    Calculate overtime fee based on business rule:
    extra_hours = ceil(extra_minutes / 60)
    overdue_fee = extra_hours * 3 JD
    """
    if extra_minutes <= 0:
        return 0.0
    extra_hours = math.ceil(extra_minutes / 60)
    return extra_hours * OVERTIME_RATE_PER_HOUR


class SessionCreate(BaseModel):
    child_id: str
    guardian_id: str
    area: AreaType = "DAYCARE"
    session_type: SessionType = "WALK_IN"
    included_minutes: int = 120  # Default 2 hours
    subscription_id: Optional[str] = None
    visit_pack_id: Optional[str] = None
    order_id: Optional[str] = None


class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    guardian_id: str
    area: AreaType = "DAYCARE"
    session_type: SessionType = "WALK_IN"
    
    # State machine
    state: SessionState = "CREATED"
    
    # Time tracking
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    checkin_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    planned_end_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    
    # Duration tracking
    included_minutes: int = 120  # Paid/entitled minutes
    actual_minutes: int = 0
    overdue_minutes: int = 0
    
    # Billing
    overdue_amount: float = 0.0
    overtime_order_id: Optional[str] = None  # Order for overtime fees
    
    # Entitlement links
    subscription_id: Optional[str] = None
    visit_pack_id: Optional[str] = None
    order_id: Optional[str] = None  # Original purchase order
    
    # Staff
    checked_in_by: Optional[str] = None
    checked_out_by: Optional[str] = None
    
    notes: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SessionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    session_id: str
    child_id: str
    guardian_id: str
    area: AreaType
    session_type: SessionType
    state: SessionState
    
    created_at: datetime
    checkin_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    planned_end_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    
    included_minutes: int
    actual_minutes: int = 0
    overdue_minutes: int = 0
    overdue_amount: float = 0.0
    
    # Computed
    time_remaining_minutes: Optional[int] = None
    is_overdue: bool = False
    
    # Populated
    child_name: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None


class CheckInRequest(BaseModel):
    child_id: str
    guardian_id: str
    area: AreaType = "DAYCARE"
    # For walk-in
    walk_in_hours: Optional[int] = None  # 1 or 2
    payment_method: Optional[str] = None
    # For subscription/visit pack
    use_subscription: bool = False
    use_visit_pack: bool = False


class CheckOutRequest(BaseModel):
    session_id: str
    payment_method: Optional[str] = "CASH"  # For overtime payment
