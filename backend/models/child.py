from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone, date
import uuid


class ChildCreate(BaseModel):
    full_name: str
    birth_date: date
    medical_notes: Optional[str] = None


class ChildUpdate(BaseModel):
    full_name: Optional[str] = None
    birth_date: Optional[date] = None
    medical_notes: Optional[str] = None
    is_active: Optional[bool] = None


class Child(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    child_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    guardian_id: str  # parent user_id
    full_name: str
    birth_date: date
    medical_notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ChildResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    child_id: str
    guardian_id: str
    full_name: str
    birth_date: date
    medical_notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    # Computed
    age_years: Optional[int] = None


class GuardianProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    guardian_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
