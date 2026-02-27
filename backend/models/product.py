from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime, timezone
import uuid

ProductCategory = Literal["WALK_IN", "SUBSCRIPTION", "VISIT_PACK", "OVERTIME", "OTHER"]

class ProductCreate(BaseModel):
    name_ar: str
    name_en: str
    category: ProductCategory
    price: float
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    duration_hours: Optional[float] = None  # For walk-in products
    visits_included: Optional[int] = None   # For visit packs
    validity_days: Optional[int] = None     # For subscriptions


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    product_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_ar: str
    name_en: str
    category: ProductCategory
    price: float
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    duration_hours: Optional[float] = None
    visits_included: Optional[int] = None
    validity_days: Optional[int] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    product_id: str
    name_ar: str
    name_en: str
    category: ProductCategory
    price: float
    description_ar: Optional[str] = None
    description_en: Optional[str] = None
    duration_hours: Optional[float] = None
    visits_included: Optional[int] = None
    validity_days: Optional[int] = None
    is_active: bool


# Predefined products based on business rules
WALK_IN_1H = {
    "name_ar": "جلسة ساعة واحدة",
    "name_en": "1 Hour Session",
    "category": "WALK_IN",
    "price": 7.0,
    "duration_hours": 1.0
}

WALK_IN_2H = {
    "name_ar": "جلسة ساعتين (الأفضل قيمة)",
    "name_en": "2 Hour Session (Best Value)",
    "category": "WALK_IN",
    "price": 10.0,
    "duration_hours": 2.0
}

MONTHLY_ALL_ACCESS = {
    "name_ar": "اشتراك شهري شامل",
    "name_en": "Monthly All-Access",
    "category": "SUBSCRIPTION",
    "price": 200.0,
    "validity_days": 30,
    "description_ar": "دخول الحضانة + الرمل + 2 ساعة يومياً في بيكابو (7ص-5م)",
    "description_en": "Daycare + Sand + 2h/day Peekaboo benefit (7AM-5PM)"
}

HALF_DAY_MORNING = {
    "name_ar": "اشتراك نصف يوم صباحي",
    "name_en": "Half-Day Morning",
    "category": "SUBSCRIPTION",
    "price": 149.0,
    "validity_days": 30,
    "description_ar": "دخول الحضانة + الرمل (7ص-2م)",
    "description_en": "Daycare + Sand access (7AM-2PM)"
}

HALF_DAY_EVENING = {
    "name_ar": "اشتراك نصف يوم مسائي",
    "name_en": "Half-Day Evening",
    "category": "SUBSCRIPTION",
    "price": 149.0,
    "validity_days": 30,
    "description_ar": "دخول الحضانة + الرمل (12م-7م)",
    "description_en": "Daycare + Sand access (12PM-7PM)"
}

VISIT_PACK_12 = {
    "name_ar": "باقة 12 زيارة",
    "name_en": "12 Visit Pack",
    "category": "VISIT_PACK",
    "price": 99.0,
    "visits_included": 12,
    "duration_hours": 4.0,
    "description_ar": "12 زيارة، 4 ساعات لكل زيارة",
    "description_en": "12 visits, 4 hours per visit"
}

OVERTIME_FEE = {
    "name_ar": "رسوم الوقت الإضافي (بالساعة)",
    "name_en": "Overtime Fee (per hour)",
    "category": "OVERTIME",
    "price": 3.0,
    "duration_hours": 1.0,
    "description_ar": "3 دينار لكل ساعة إضافية",
    "description_en": "3 JD per additional hour"
}

DEFAULT_PRODUCTS = [
    WALK_IN_1H,
    WALK_IN_2H,
    MONTHLY_ALL_ACCESS,
    HALF_DAY_MORNING,
    HALF_DAY_EVENING,
    VISIT_PACK_12,
    OVERTIME_FEE
]
