from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Literal
from datetime import datetime, timezone
import uuid

OrderStatus = Literal["OPEN", "PAID", "CANCELLED", "REFUNDED"]
PaymentMethod = Literal["CASH", "CARD"]

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = 1
    unit_price: float
    notes: Optional[str] = None


class OrderItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    item_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name_ar: str = ""
    product_name_en: str = ""
    quantity: int = 1
    unit_price: float
    line_total: float = 0.0
    notes: Optional[str] = None


class OrderCreate(BaseModel):
    guardian_id: Optional[str] = None  # Parent user_id
    child_id: Optional[str] = None
    items: List[OrderItemCreate]
    payment_method: PaymentMethod = "CASH"
    notes: Optional[str] = None


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    order_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = ""  # Generated: ORD-YYYYMMDD-XXXX
    guardian_id: Optional[str] = None
    child_id: Optional[str] = None
    items: List[OrderItem] = []
    subtotal: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    status: OrderStatus = "OPEN"
    payment_method: Optional[PaymentMethod] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None  # Staff user_id
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    order_id: str
    order_number: str
    guardian_id: Optional[str] = None
    child_id: Optional[str] = None
    items: List[OrderItem]
    subtotal: float
    tax_amount: float
    total_amount: float
    status: OrderStatus
    payment_method: Optional[PaymentMethod] = None
    paid_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    # Populated
    guardian_name: Optional[str] = None
    child_name: Optional[str] = None


class PaymentCreate(BaseModel):
    order_id: str
    method: PaymentMethod
    amount: float


class Payment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    payment_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    method: PaymentMethod
    amount: float
    status: str = "COMPLETED"  # COMPLETED, FAILED, REFUNDED
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
