from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime, timezone
import uuid


CheckInStatus = Literal["CHECKED_IN", "CHECKED_OUT"]


class CheckInCreate(BaseModel):
    """Check in a customer by card scan"""
    card_number: str
    branch_id: str


class CheckOutCreate(BaseModel):
    """Check out a customer"""
    session_id: str


class CheckInSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    card_number: str
    branch_id: str
    
    # Session times
    check_in_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    check_out_time: Optional[datetime] = None
    
    # Duration tracking
    duration_minutes: Optional[int] = None
    
    # Payment info
    payment_type: str = "HOURLY"  # HOURLY | SUBSCRIPTION
    subscription_id: Optional[str] = None  # If using subscription
    order_id: Optional[str] = None  # If paid hourly
    amount_charged: float = 0.0
    
    status: CheckInStatus = "CHECKED_IN"
    notes: Optional[str] = None
    
    created_by: Optional[str] = None  # Staff user ID
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CheckInSessionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    session_id: str
    customer_id: str
    card_number: str
    branch_id: str
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    payment_type: str
    subscription_id: Optional[str] = None
    order_id: Optional[str] = None
    amount_charged: float = 0.0
    status: CheckInStatus
    notes: Optional[str] = None
    # Customer info (populated on response)
    child_name: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
