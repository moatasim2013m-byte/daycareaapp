from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.device import (
    Device,
    DeviceEventRequest,
    DevicePingRequest,
    DeviceRegisterRequest,
    DeviceResponse,
)

router = APIRouter(prefix="/devices", tags=["Devices"])


def get_db():
    from server import db
    return db


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/register", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    register_data: DeviceRegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    now = _utc_now_iso()
    device_doc = Device(**register_data.model_dump(), lastSeen=datetime.fromisoformat(now)).model_dump()

    await db.devices.update_one(
        {"id": register_data.id},
        {"$set": {**device_doc, "lastSeen": now}},
        upsert=True,
    )

    stored = await db.devices.find_one({"id": register_data.id}, {"_id": 0})
    if not stored:
        raise HTTPException(status_code=500, detail="Failed to register device")

    if isinstance(stored.get("lastSeen"), str):
        stored["lastSeen"] = datetime.fromisoformat(stored["lastSeen"])

    return DeviceResponse(**stored)


@router.post("/ping")
async def ping_device(
    ping_data: DevicePingRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    now = _utc_now_iso()
    result = await db.devices.update_one(
        {"id": ping_data.id},
        {"$set": {"lastSeen": now, "status": "online"}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    return {"success": True, "id": ping_data.id, "lastSeen": now}


@router.post("/event")
async def device_event(
    event_data: DeviceEventRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    device = await db.devices.find_one({"id": event_data.id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    now = _utc_now_iso()
    event_doc = {
        "id": event_data.id,
        "eventType": event_data.eventType,
        "payload": event_data.payload or {},
        "createdAt": now,
    }

    await db.device_events.insert_one(event_doc)

    if event_data.eventType == "DEVICE_HEARTBEAT":
        await db.devices.update_one(
            {"id": event_data.id},
            {"$set": {"lastSeen": now, "status": "online"}},
        )

    return {"success": True, "event": event_doc}
