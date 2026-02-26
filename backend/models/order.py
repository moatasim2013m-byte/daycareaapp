from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
from datetime import datetime, timezone
import uuid


OrderSource = Literal["POS", "ONLINE", "KIOSK"]
OrderStatus = Literal["DRAFT", "CONFIRMED", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "CANCELLED"]


class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = 1
    notes: Optional[str] = None


class OrderItem(BaseModel):
    order_item_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name_ar: str  # Snapshot at order time
    product_name_en: str
    quantity: int
    unit_price: float  # Snapshot at order time
    discount_amount: float = 0.0
    tax_amount: float
    total_amount: float
    notes: Optional[str] = None


class OrderCreate(BaseModel):
    branch_id: str
    order_source: OrderSource = "POS"
    customer_id: Optional[str] = None  # Nullable for walk-in
    items: List[OrderItemCreate]
    discount_amount: float = 0.0
    notes: Optional[str] = None


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    order_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    branch_id: str
    order_number: str  # Generated (ORD-YYYYMMDD-XXXX)
    order_source: OrderSource
    customer_id: Optional[str] = None
    created_by: str  # User ID who created order
    status: OrderStatus = "DRAFT"
    items: List[OrderItem] = []
    subtotal: float = 0.0
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    total_amount: float = 0.0
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    order_id: str
    branch_id: str
    order_number: str
    order_source: OrderSource
    customer_id: Optional[str]
    created_by: str
    status: OrderStatus
    items: List[OrderItem]
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    notes: Optional[str]
    created_at: datetime
    confirmed_at: Optional[datetime]