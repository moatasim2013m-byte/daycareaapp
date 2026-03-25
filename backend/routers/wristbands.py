from datetime import datetime, timezone
from urllib.parse import quote_plus
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from constants.roles import FRONTDESK_ROLES
from middleware.auth import require_role
from models.wristband import Wristband, WristbandAssignRequest, WristbandResponse, WristbandScanRequest
from services.event_logger import eventLogger

router = APIRouter(prefix="/wristbands", tags=["Wristbands"])


def get_db():
    from server import db
    return db


async def _emit_event(db: AsyncIOMotorDatabase, event_type: str, payload: dict):
    await db.events.insert_one(
        {
            "event_id": str(uuid4()),
            "type": event_type,
            "payload": payload,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )


def _normalize_code(code: str | None) -> str | None:
    if code is None:
        return None
    normalized = code.strip().upper()
    return normalized or None


def _build_qr(code: str, wristband_id: str) -> tuple[str, str]:
    qr_value = f"wristband:{wristband_id}:{code}"
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={quote_plus(qr_value)}"
    return qr_value, qr_code_url


@router.post("/assign", response_model=WristbandResponse, status_code=status.HTTP_201_CREATED)
async def assign_wristband(
    payload: WristbandAssignRequest,
    user: dict = Depends(require_role(*FRONTDESK_ROLES)),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    session = await db.checkin_sessions.find_one({"session_id": payload.session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    if session.get("status") != "CHECKED_IN":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session is not eligible for wristband")

    existing_active = await db.wristbands.find_one(
        {"session_id": payload.session_id, "status": {"$in": ["issued", "active"]}}, {"_id": 0}
    )
    if existing_active:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An active/issued wristband already exists")

    wristband_id = str(uuid4())
    code = _normalize_code(payload.code) or f"WB-{uuid4().hex[:8].upper()}"

    code_collision = await db.wristbands.find_one(
        {"code_normalized": code, "status": {"$ne": "expired"}},
        {"_id": 0, "id": 1},
    )
    if code_collision:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Wristband code already in use")

    qr_value, qr_code_url = _build_qr(code, wristband_id)

    wristband = Wristband(
        id=wristband_id,
        code=code,
        child_id=payload.child_id,
        session_id=payload.session_id,
        branch_id=payload.branch_id,
        guest_name=payload.guest_name,
        qr_value=qr_value,
        qr_code_url=qr_code_url,
    )

    wristband_doc = wristband.model_dump()
    wristband_doc["issued_at"] = wristband_doc["issued_at"].isoformat()
    wristband_doc["code_normalized"] = code

    await db.wristbands.insert_one(wristband_doc)
    await db.checkin_sessions.update_one(
        {"session_id": payload.session_id},
        {
            "$set": {
                "wristband_id": wristband_id,
                "wristband_status": "issued",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )

    await _emit_event(
        db,
        "WRISTBAND_ASSIGNED",
        {
            "wristband_id": wristband_id,
            "session_id": payload.session_id,
            "branch_id": payload.branch_id,
            "code": code,
            "issued_by": user.get("user_id"),
        },
    )
    await eventLogger.log(
        db,
        "WRISTBAND_ASSIGNED",
        {
            "actorType": "staff",
            "actorId": user.get("user_id"),
            "sessionId": payload.session_id,
            "branchId": payload.branch_id,
            "metadata": {
                "wristband_id": wristband_id,
                "code": code,
            },
        },
    )

    return WristbandResponse(**wristband.model_dump())


@router.post("/scan", response_model=WristbandResponse)
async def scan_wristband(
    payload: WristbandScanRequest,
    user: dict = Depends(require_role(*FRONTDESK_ROLES)),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    query = {}
    if payload.wristband_id:
        query["id"] = payload.wristband_id
    elif payload.code:
        normalized_code = _normalize_code(payload.code)
        if not normalized_code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid wristband code")
        query = {"$or": [{"code_normalized": normalized_code}, {"code": normalized_code}, {"code": payload.code.strip()}]}
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="wristband_id or code is required")

    wristband = await db.wristbands.find_one(query, {"_id": 0})
    if not wristband:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wristband not found")

    if wristband.get("status") == "expired":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Wristband is expired")

    if wristband.get("status") == "active" and wristband.get("activated_at"):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Wristband already active")

    now_iso = datetime.now(timezone.utc).isoformat()
    update = {"status": "active"}
    update["activated_at"] = now_iso

    await db.wristbands.update_one({"id": wristband["id"]}, {"$set": update})

    session = await db.checkin_sessions.find_one({"session_id": wristband["session_id"]}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found for wristband")

    session_update = {
        "wristband_status": "active",
        "session_active": True,
        "updated_at": now_iso,
    }
    if not session.get("session_started_at"):
        session_update["session_started_at"] = now_iso

    await db.checkin_sessions.update_one(
        {"session_id": wristband["session_id"]},
        {"$set": session_update},
    )

    await _emit_event(
        db,
        "WRISTBAND_SCAN",
        {
            "wristband_id": wristband["id"],
            "session_id": wristband["session_id"],
            "scanned_by": payload.scanned_by or user.get("user_id"),
        },
    )
    await eventLogger.log(
        db,
        "WRISTBAND_SCAN",
        {
            "actorType": "staff",
            "actorId": payload.scanned_by or user.get("user_id"),
            "sessionId": wristband["session_id"],
            "branchId": wristband.get("branch_id"),
            "metadata": {
                "wristband_id": wristband["id"],
                "status_before": wristband.get("status"),
                "status_after": "active",
            },
        },
    )
    if not session.get("session_active"):
        await _emit_event(
            db,
            "SESSION_START",
            {
                "session_id": wristband["session_id"],
                "wristband_id": wristband["id"],
                "started_by": payload.scanned_by or user.get("user_id"),
            },
        )
        await eventLogger.log(
            db,
            "SESSION_START",
            {
                "actorType": "staff",
                "actorId": payload.scanned_by or user.get("user_id"),
                "sessionId": wristband["session_id"],
                "branchId": wristband.get("branch_id"),
                "metadata": {
                    "wristband_id": wristband["id"],
                },
            },
        )

    updated = await db.wristbands.find_one({"id": wristband["id"]}, {"_id": 0})
    if isinstance(updated.get("issued_at"), str):
        updated["issued_at"] = datetime.fromisoformat(updated["issued_at"])
    if isinstance(updated.get("activated_at"), str):
        updated["activated_at"] = datetime.fromisoformat(updated["activated_at"])

    return WristbandResponse(**updated)


@router.get("/{wristband_id}", response_model=WristbandResponse)
async def get_wristband(
    wristband_id: str,
    user: dict = Depends(require_role(*FRONTDESK_ROLES)),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    wristband = await db.wristbands.find_one({"id": wristband_id}, {"_id": 0})
    if not wristband:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wristband not found")

    if isinstance(wristband.get("issued_at"), str):
        wristband["issued_at"] = datetime.fromisoformat(wristband["issued_at"])
    if isinstance(wristband.get("activated_at"), str):
        wristband["activated_at"] = datetime.fromisoformat(wristband["activated_at"])

    return WristbandResponse(**wristband)


@router.get("", response_model=WristbandResponse)
async def get_wristband_by_code(
    code: str,
    user: dict = Depends(require_role(*FRONTDESK_ROLES)),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    normalized_code = _normalize_code(code)
    if not normalized_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid wristband code")

    wristband = await db.wristbands.find_one(
        {"$or": [{"code_normalized": normalized_code}, {"code": normalized_code}, {"code": code.strip()}]},
        {"_id": 0},
    )
    if not wristband:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wristband not found")

    if isinstance(wristband.get("issued_at"), str):
        wristband["issued_at"] = datetime.fromisoformat(wristband["issued_at"])
    if isinstance(wristband.get("activated_at"), str):
        wristband["activated_at"] = datetime.fromisoformat(wristband["activated_at"])

    return WristbandResponse(**wristband)
