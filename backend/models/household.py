from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


class HouseholdCreate(BaseModel):
    primary_guardian: str
    phone: Optional[str] = None
    email: Optional[str] = None
    children: List[str] = Field(default_factory=list)
    authorized_pickups: List[str] = Field(default_factory=list)
    memberships: List[str] = Field(default_factory=list)
    payment_methods: List[str] = Field(default_factory=list)


class HouseholdUpdate(BaseModel):
    primary_guardian: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    children: Optional[List[str]] = None
    authorized_pickups: Optional[List[str]] = None
    memberships: Optional[List[str]] = None
    payment_methods: Optional[List[str]] = None


class Household(BaseModel):
    model_config = ConfigDict(extra="ignore")

    household_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    primary_guardian: str
    phone: Optional[str] = None
    email: Optional[str] = None
    children: List[str] = Field(default_factory=list)
    authorized_pickups: List[str] = Field(default_factory=list)
    memberships: List[str] = Field(default_factory=list)
    payment_methods: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HouseholdResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")

    household_id: str
    primary_guardian: str
    phone: Optional[str] = None
    email: Optional[str] = None
    children: List[str] = Field(default_factory=list)
    authorized_pickups: List[str] = Field(default_factory=list)
    memberships: List[str] = Field(default_factory=list)
    payment_methods: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
