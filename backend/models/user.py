from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime, timezone
import uuid


UserRole = Literal["ADMIN", "MANAGER", "CASHIER", "RECEPTION", "STAFF", "PARENT"]


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: UserRole
    branch_id: Optional[str] = None  # Required for non-ADMIN roles
    preferred_language: str = "ar"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    name: str
    phone: str
    role: UserRole
    branch_id: Optional[str] = None
    preferred_language: str = "ar"
    status: str = "active"  # active | inactive | suspended
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    email: str
    name: str
    phone: str
    role: UserRole
    branch_id: Optional[str]
    preferred_language: str
    status: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    expires_at: datetime