from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional
from datetime import datetime, timezone
import uuid


PaymentMethod = Literal["CASH", "CARD", "WALLET", "BANK_TRANSFER", "ACCOUNT_CREDIT"]
PaymentStatus = Literal["PENDING", "COMPLETED", "FAILED", "REFUNDED"]
RefundMethod = Literal["ORIGINAL_METHOD", "ACCOUNT_CREDIT", "CASH"]


class PaymentCreate(BaseModel):
    order_id: str
    payment_method: PaymentMethod
    amount: float
    payment_gateway_id: Optional[str] = None  # From Stripe/etc if online
    notes: Optional[str] = None


class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    payment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    payment_method: PaymentMethod
    amount: float
    payment_gateway_id: Optional[str] = None
    status: PaymentStatus = "PENDING"
    processed_at: Optional[datetime] = None
    processed_by: Optional[str] = None  # User ID
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PaymentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    payment_id: str
    order_id: str
    payment_method: PaymentMethod
    amount: float
    status: PaymentStatus
    processed_at: Optional[datetime]
    created_at: datetime


class RefundCreate(BaseModel):
    payment_id: str
    order_id: str
    amount: float
    reason: str
    refund_method: RefundMethod = "ORIGINAL_METHOD"
    notes: Optional[str] = None


class Refund(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    refund_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_id: str
    order_id: str
    amount: float
    reason: str
    refund_method: RefundMethod
    approved_by: str  # User ID (manager)
    processed_at: Optional[datetime] = None
    status: PaymentStatus = "PENDING"
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RefundResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    refund_id: str
    payment_id: str
    order_id: str
    amount: float
    reason: str
    refund_method: RefundMethod
    approved_by: str
    status: PaymentStatus
    processed_at: Optional[datetime]
    created_at: datetime