from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid

UserRole = Literal["ADMIN", "RECEPTION", "STAFF", "PARENT"]

class UserCreate(BaseModel):
    email: str
    password: str
    display_name: str
    phone: Optional[str] = None
    role: UserRole = "PARENT"

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    display_name: str
    phone: Optional[str] = None
    role: UserRole = "PARENT"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login_at: Optional[datetime] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    email: str
    display_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
