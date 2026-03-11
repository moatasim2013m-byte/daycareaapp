from pydantic import BaseModel, Field, ConfigDict
from typing import Literal, Optional
from datetime import date, datetime, timezone
import uuid

EventType = Literal["birthday", "school_trip", "private_event", "workshop"]
EventStatus = Literal["scheduled", "full", "cancelled"]
BookingStatus = Literal["booked", "cancelled"]


class EventBookingCreate(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    type: EventType
    branch_id: str = Field(alias="branchId")
    date: date
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")
    capacity: int = Field(ge=1, le=500)
    price: float = Field(ge=0)


class EventBooking(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    type: EventType
    branch_id: str = Field(alias="branchId")
    date: date
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")
    capacity: int
    price: float
    customer_id: Optional[str] = Field(default=None, alias="customerId")
    status: EventStatus = "scheduled"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EventBookRequest(BaseModel):
    event_id: str = Field(alias="eventId")
    customer_id: str = Field(alias="customerId")


class EventCancelRequest(BaseModel):
    event_id: str = Field(alias="eventId")
    customer_id: Optional[str] = Field(default=None, alias="customerId")


class EventBookingRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str = Field(alias="eventId")
    customer_id: str = Field(alias="customerId")
    status: BookingStatus = "booked"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EventResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    type: EventType
    branch_id: str = Field(alias="branchId")
    date: date
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")
    capacity: int
    price: float
    customer_id: Optional[str] = Field(default=None, alias="customerId")
    status: EventStatus
    booked_count: int = Field(alias="bookedCount")
    remaining_capacity: int = Field(alias="remainingCapacity")
