from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from middleware.auth import get_current_user
from models.event_booking import (
    EventBooking,
    EventBookingCreate,
    EventBookRequest,
    EventBookingRecord,
    EventCancelRequest,
    EventResponse,
)
from services.notification_service import maybe_send_whatsapp_notification

router = APIRouter(prefix="/events", tags=["Events"])


def get_db():
    from server import db

    return db


async def build_event_response(db: AsyncIOMotorDatabase, event_doc: dict) -> EventResponse:
    bookings = await db.event_registrations.find(
        {"event_id": event_doc["id"], "status": "booked"},
        {"_id": 0, "customer_id": 1},
    ).to_list(500)
    booked_customers = [booking.get("customer_id") for booking in bookings if booking.get("customer_id")]
    booked_count = len(booked_customers)
    remaining_capacity = max(event_doc["capacity"] - booked_count, 0)
    return EventResponse(
        **event_doc,
        bookedCount=booked_count,
        usedCapacity=booked_count,
        remainingCapacity=remaining_capacity,
        bookedCustomers=booked_customers,
    )


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventBookingCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    event = EventBooking(**payload.model_dump(by_alias=True), customerId=payload.customer_id or user.get("user_id"))
    event_doc = event.model_dump(by_alias=False)
    event_doc["date"] = event_doc["date"].isoformat()
    event_doc["created_at"] = event_doc["created_at"].isoformat()
    event_doc["updated_at"] = event_doc["updated_at"].isoformat()

    await db.events.insert_one(event_doc)

    return await build_event_response(db, event.model_dump(by_alias=False))


@router.get("", response_model=List[EventResponse])
async def list_events(
    branch_id: Optional[str] = Query(default=None, alias="branchId"),
    event_date: Optional[date] = Query(default=None, alias="date"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    query = {}
    if user.get("role") == "PARENT":
        query["customer_id"] = user.get("user_id")
    elif branch_id:
        query["branch_id"] = branch_id
    elif user.get("role") != "ADMIN" and user.get("branch_id"):
        query["branch_id"] = user["branch_id"]

    if event_date:
        query["date"] = event_date.isoformat()

    events = await db.events.find(query, {"_id": 0}).sort("date", 1).to_list(200)

    responses = []
    for event in events:
        if isinstance(event.get("date"), str):
            event["date"] = date.fromisoformat(event["date"])
        responses.append(await build_event_response(db, event))

    return responses


@router.post("/book")
async def book_event(
    payload: EventBookRequest,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    event = await db.events.find_one({"id": payload.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="Event is cancelled")

    active_bookings = await db.event_registrations.count_documents(
        {"event_id": payload.event_id, "status": "booked"}
    )
    if active_bookings >= event["capacity"]:
        await db.events.update_one({"id": payload.event_id}, {"$set": {"status": "full", "updated_at": datetime.utcnow().isoformat()}})
        raise HTTPException(status_code=400, detail="Event has reached capacity")

    if event.get("status") == "full":
        await db.events.update_one({"id": payload.event_id}, {"$set": {"status": "scheduled", "updated_at": datetime.utcnow().isoformat()}})

    existing = await db.event_registrations.find_one(
        {"event_id": payload.event_id, "customer_id": payload.customer_id, "status": "booked"}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Customer already booked")

    booking = EventBookingRecord(eventId=payload.event_id, customerId=payload.customer_id)
    booking_doc = booking.model_dump(by_alias=False)
    booking_doc["created_at"] = booking_doc["created_at"].isoformat()
    booking_doc["updated_at"] = booking_doc["updated_at"].isoformat()
    booking_doc["created_by"] = user.get("user_id")

    await db.event_registrations.insert_one(booking_doc)

    latest_count = await db.event_registrations.count_documents(
        {"event_id": payload.event_id, "status": "booked"}
    )
    if latest_count >= event["capacity"]:
        await db.events.update_one({"id": payload.event_id}, {"$set": {"status": "full", "updated_at": datetime.utcnow().isoformat()}})

    await maybe_send_whatsapp_notification(
        db,
        entity_type="EVENT",
        entity_id=payload.event_id,
        action="BOOKING_CONFIRMED",
        after_state={"guardian_id": payload.customer_id},
        notes=f"{event.get('title', 'Event')} on {event.get('date')}",
    )

    return {"success": True, "message": "Booking confirmed", "bookingId": booking.id}


@router.post("/cancel")
async def cancel_event_booking(
    payload: EventCancelRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    event = await db.events.find_one({"id": payload.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    now = datetime.utcnow().isoformat()
    if payload.customer_id:
        result = await db.event_registrations.update_one(
            {"event_id": payload.event_id, "customer_id": payload.customer_id, "status": "booked"},
            {"$set": {"status": "cancelled", "updated_at": now, "cancelled_by": user.get("user_id")}},
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Booking not found")

        await db.events.update_one({"id": payload.event_id}, {"$set": {"status": "scheduled", "updated_at": now}})
        return {"success": True, "message": "Booking cancelled"}

    await db.events.update_one({"id": payload.event_id}, {"$set": {"status": "cancelled", "updated_at": now}})
    await db.event_registrations.update_many(
        {"event_id": payload.event_id, "status": "booked"},
        {"$set": {"status": "cancelled", "updated_at": now, "cancelled_by": user.get("user_id")}},
    )
    return {"success": True, "message": "Event cancelled"}
