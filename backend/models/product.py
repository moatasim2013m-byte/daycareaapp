from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional
from datetime import datetime, timezone
import uuid


ProductCategory = Literal["ADMISSION", "ADDON", "FOOD", "BEVERAGE", "RETAIL", "MEMBERSHIP", "PARTY_PACKAGE"]
ProductType = Literal["HOURLY_PASS", "VISIT_PACK", "MONTHLY_SUBSCRIPTION", "DAYCARE", "CONSUMABLE", "EQUIPMENT", "OTHER"]


class ProductCreate(BaseModel):
    branch_id: str
    sku: str
    name_ar: str
    name_en: str
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    category: ProductCategory
    product_type: ProductType
    zone_id: Optional[str] = None  # For admission products
    price: float
    tax_rate: float = 0.16  # Jordan 16% sales tax
    inventory_tracked: bool = False
    inventory_item_id: Optional[str] = None


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    name_ar: Optional[str] = None
    name_en: Optional[str] = None
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    price: Optional[float] = None
    tax_rate: Optional[float] = None
    inventory_tracked: Optional[bool] = None
    active: Optional[bool] = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    product_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    branch_id: str
    sku: str
    name_ar: str
    name_en: str
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    category: ProductCategory
    product_type: ProductType
    zone_id: Optional[str] = None
    price: float
    tax_rate: float = 0.15
    inventory_tracked: bool = False
    inventory_item_id: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    product_id: str
    branch_id: str
    sku: str
    name_ar: str
    name_en: str
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    category: ProductCategory
    product_type: ProductType
    zone_id: Optional[str] = None
    price: float
    tax_rate: float = 0.15
    inventory_tracked: bool = False
    active: bool = True
    created_at: datetime