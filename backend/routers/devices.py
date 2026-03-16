from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.device import (
    Device,
    DeviceEventRequest,
    DevicePingRequest,
    DeviceRegisterRequest,
    DeviceResponse,
    DeviceStatusResponse,
)
from utils.audit import log_audit

router = APIRouter(prefix="/devices", tags=["Devices"])

OFFLINE_AFTER_MINUTES = 5


def get_db():
    from server import db
    return db


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _utc_now_iso() -> str:
    return _utc_now().isoformat()


def _to_datetime(value):
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            return None
    return None


def _effective_status(device: dict) -> str:
    if device.get("status") == "maintenance":
        return "maintenance"

    last_seen = _to_datetime(device.get("lastSeen"))
    if not last_seen:
        return "offline"

    if _utc_now() - last_seen > timedelta(minutes=OFFLINE_AFTER_MINUTES):
        return "offline"

    return "online"


async def _write_device_audit(db: AsyncIOMotorDatabase, device_id: str, action: str, notes: str, after_state: dict):
    await log_audit(
        db=db,
        entity_type="device",
        entity_id=device_id,
        action=action,
        actor_user_id=device_id,
        actor_role="device",
        before_state=None,
        after_state=after_state,
        notes=notes,
    )


@router.post("/register", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
async def register_device(
    register_data: DeviceRegisterRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    now = _utc_now_iso()
    device_doc = Device(**register_data.model_dump(), lastSeen=_to_datetime(now)).model_dump()

    await db.devices.update_one(
        {"id": register_data.id},
        {"$set": {**device_doc, "lastSeen": now}},
        upsert=True,
    )

    stored = await db.devices.find_one({"id": register_data.id}, {"_id": 0})
    if not stored:
        raise HTTPException(status_code=500, detail="Failed to register device")

    if isinstance(stored.get("lastSeen"), str):
        stored["lastSeen"] = _to_datetime(stored["lastSeen"])

    await _write_device_audit(
        db,
        register_data.id,
        action="device_registered",
        notes=f"Device {register_data.deviceType} registered",
        after_state={
            "deviceType": stored.get("deviceType"),
            "status": stored.get("status"),
            "branchId": stored.get("branchId"),
            "lastSeen": now,
        },
    )

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

    await _write_device_audit(
        db,
        ping_data.id,
        action="device_ping",
        notes="Device heartbeat ping received",
        after_state={"lastSeen": now, "status": "online"},
    )

    return {"success": True, "id": ping_data.id, "lastSeen": now, "status": "online"}


@router.post("/event")
async def device_event(
    event_data: DeviceEventRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    device = await db.devices.find_one({"id": event_data.id}, {"_id": 0})
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    now = _utc_now_iso()
    safe_payload = event_data.payload if isinstance(event_data.payload, dict) else {}

    event_doc = {
        "id": event_data.id,
        "deviceType": device.get("deviceType"),
        "branchId": device.get("branchId"),
        "eventType": event_data.eventType,
        "payload": safe_payload,
        "createdAt": now,
    }

    await db.device_events.insert_one(event_doc)

    if event_data.eventType in {"DEVICE_HEARTBEAT", "DEVICE_SCAN", "DEVICE_KIOSK_ACTION", "DEVICE_ACTIVATION"}:
        await db.devices.update_one(
            {"id": event_data.id},
            {"$set": {"lastSeen": now, "status": "online"}},
        )

    await _write_device_audit(
        db,
        event_data.id,
        action="device_event",
        notes=f"{event_data.eventType} received",
        after_state={
            "eventType": event_data.eventType,
            "lastSeen": now,
            "status": "online",
            "payloadKeys": sorted(list(safe_payload.keys())),
        },
    )

    return {"success": True, "event": event_doc}


@router.get("/status", response_model=list[DeviceStatusResponse])
async def get_device_statuses(
    branchId: str | None = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {"branchId": branchId} if branchId else {}
    docs = await db.devices.find(query, {"_id": 0}).sort("lastSeen", -1).to_list(length=100)

    results: list[DeviceStatusResponse] = []
    for doc in docs:
        last_seen = _to_datetime(doc.get("lastSeen"))
        results.append(
            DeviceStatusResponse(
                id=doc.get("id", ""),
                deviceType=doc.get("deviceType", "scanner"),
                branchId=doc.get("branchId", ""),
                status=doc.get("status", "offline"),
                effectiveStatus=_effective_status(doc),
                lastSeen=last_seen,
            )
        )

    return results
