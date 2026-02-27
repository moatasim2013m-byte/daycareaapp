from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime, timezone
import uuid


SubscriptionType = Literal["MONTHLY"]
SubscriptionStatus = Literal["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"]


class SubscriptionCreate(BaseModel):
    """Create a new subscription for a customer"""
    customer_id: str
    branch_id: str
    subscription_type: SubscriptionType = "MONTHLY"
    notes: Optional[str] = None


class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    subscription_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    branch_id: str
    subscription_type: SubscriptionType = "MONTHLY"
    status: SubscriptionStatus = "PENDING"  # Pending until first activation
    
    # Dates
    purchased_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    activated_at: Optional[datetime] = None  # Set on first check-in
    expires_at: Optional[datetime] = None  # 1 month from activation
    
    # Payment info
    amount_paid: float = 0.0
    payment_method: Optional[str] = None
    order_id: Optional[str] = None  # Link to order
    
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    subscription_id: str
    customer_id: str
    branch_id: str
    subscription_type: SubscriptionType
    status: SubscriptionStatus
    purchased_at: datetime
    activated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    amount_paid: float = 0.0
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    # Computed
    days_remaining: Optional[int] = None
    is_active: bool = False
