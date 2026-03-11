from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict
import uuid


class PricingRule(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    branchId: str
    baseDurationMinutes: int = 120
    basePrice: float = 10.0
    extraMinutePrice: float = 0.05
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

