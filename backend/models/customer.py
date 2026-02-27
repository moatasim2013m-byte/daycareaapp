from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone, date
import uuid


class GuardianInfo(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    national_id: Optional[str] = None


class CustomerCreate(BaseModel):
    """Register a new child with their card"""
    card_number: str  # Physical card number/barcode
    child_name: str
    child_dob: date  # Date of birth (must be 4 years or below)
    guardian: GuardianInfo
    branch_id: str
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    child_name: Optional[str] = None
    child_dob: Optional[date] = None
    guardian: Optional[GuardianInfo] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    customer_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    card_number: str  # Physical card - unique identifier
    child_name: str
    child_dob: date
    guardian: GuardianInfo
    branch_id: str
    waiver_accepted: bool = False
    waiver_accepted_at: Optional[datetime] = None
    notes: Optional[str] = None
    status: str = "active"  # active | inactive | blocked
    total_visits: int = 0
    last_visit: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CustomerResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    customer_id: str
    card_number: str
    child_name: str
    child_dob: date
    guardian: GuardianInfo
    branch_id: str
    waiver_accepted: bool
    waiver_accepted_at: Optional[datetime] = None
    notes: Optional[str] = None
    status: str
    total_visits: int = 0
    last_visit: Optional[datetime] = None
    created_at: datetime
    # Computed fields
    child_age_months: Optional[int] = None
    has_active_subscription: bool = False
    subscription_expires_at: Optional[datetime] = None


class WaiverAcceptance(BaseModel):
    """Accept waiver for a customer"""
    customer_id: str
    guardian_signature: Optional[str] = None  # Base64 signature image (optional)
    accepted_terms: bool = True
