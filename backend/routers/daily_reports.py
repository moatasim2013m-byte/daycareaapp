from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from typing import Optional, List
from middleware.auth import require_role
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/daily-reports", tags=["Daily Reports"])


def get_db():
    from server import db
    return db


# ── Models ──
class DailyReportCreate(BaseModel):
    child_id: str
    child_name: str = ""
    notes: str = Field(..., min_length=3, description="Teacher notes about the child's day")
    photo_url: Optional[str] = None


class ReplyCreate(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)


class ReplyItem(BaseModel):
    reply_id: str
    parent_id: str
    parent_name: str
    text: str
    created_at: str


class DailyReportResponse(BaseModel):
    report_id: str
    child_id: str
    child_name: str
    teacher_id: str
    teacher_name: str
    notes: str
    photo_url: Optional[str] = None
    report_ar: str
    report_en: str
    session_id: Optional[str] = None
    replies: List[ReplyItem] = []
    created_at: str


# ── Endpoints ──

@router.post("", response_model=DailyReportResponse, status_code=status.HTTP_201_CREATED)
async def create_daily_report(
    body: DailyReportCreate,
    user: dict = Depends(require_role("ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Teacher creates a daily report. Gemini generates bilingual summary. Auto-links to active session."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Resolve child name if not provided
    child_name = body.child_name
    if not child_name:
        child_doc = await db.children.find_one({"child_id": body.child_id}, {"_id": 0, "full_name": 1, "name": 1})
        child_name = (child_doc or {}).get("full_name") or (child_doc or {}).get("name") or f"Child {body.child_id}"

    # Auto-link to active session for this child
    session_id = None
    active_session = await db.sessions.find_one(
        {"child_id": body.child_id, "state": {"$in": ["CHECKED_IN", "ACTIVE", "OVERDUE"]}},
        {"_id": 0, "session_id": 1},
        sort=[("checkin_at", -1)],
    )
    if active_session:
        session_id = active_session.get("session_id")
    else:
        # Also check checkin_sessions collection
        active_checkin = await db.checkin_sessions.find_one(
            {"child_id": body.child_id, "status": {"$in": ["CHECKED_IN", "ACTIVE"]}},
            {"_id": 0, "session_id": 1},
            sort=[("check_in_time", -1)],
        )
        if active_checkin:
            session_id = active_checkin.get("session_id")

    # Generate bilingual report via Gemini
    from services.gemini_service import generate_daily_report
    generated = await generate_daily_report(
        child_name=child_name,
        teacher_notes=body.notes,
        photo_url=body.photo_url,
    )

    report_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    report_doc = {
        "report_id": report_id,
        "child_id": body.child_id,
        "child_name": child_name,
        "teacher_id": user.get("user_id", ""),
        "teacher_name": user.get("display_name") or user.get("email", "Teacher"),
        "notes": body.notes,
        "photo_url": body.photo_url,
        "report_ar": generated["report_ar"],
        "report_en": generated["report_en"],
        "session_id": session_id,
        "replies": [],
        "created_at": now,
    }

    await db.daily_reports.insert_one(report_doc)

    # Also push to parent_feed so it appears in parent's feed
    feed_item = {
        "id": f"report-{report_id}",
        "child_id": body.child_id,
        "type": "daily_report",
        "title": "تقرير يومي جديد",
        "description": generated["report_ar"][:200],
        "photo_url": body.photo_url,
        "created_at": now,
    }
    await db.parent_feed.insert_one(feed_item)

    return {
        "report_id": report_id,
        "child_id": body.child_id,
        "child_name": child_name,
        "teacher_id": report_doc["teacher_id"],
        "teacher_name": report_doc["teacher_name"],
        "notes": body.notes,
        "photo_url": body.photo_url,
        "report_ar": generated["report_ar"],
        "report_en": generated["report_en"],
        "session_id": session_id,
        "replies": [],
        "created_at": now,
    }


@router.get("/{report_id}", response_model=DailyReportResponse)
async def get_single_report(
    report_id: str,
    user: dict = Depends(require_role("PARENT", "ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get a single report with all replies."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    report = await db.daily_reports.find_one({"report_id": report_id}, {"_id": 0})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report


@router.post("/{report_id}/reply", response_model=ReplyItem, status_code=status.HTTP_201_CREATED)
async def add_reply(
    report_id: str,
    body: ReplyCreate,
    user: dict = Depends(require_role("PARENT", "ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Parent or staff adds a text reply to a daily report."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    report = await db.daily_reports.find_one({"report_id": report_id}, {"_id": 0, "report_id": 1})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    reply = {
        "reply_id": str(uuid.uuid4()),
        "parent_id": user.get("user_id", ""),
        "parent_name": user.get("display_name") or user.get("email", "User"),
        "text": body.text.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    await db.daily_reports.update_one(
        {"report_id": report_id},
        {"$push": {"replies": reply}},
    )

    return reply


@router.get("/child/{child_id}", response_model=List[DailyReportResponse])
async def get_child_reports(
    child_id: str,
    user: dict = Depends(require_role("PARENT", "ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Get all daily reports for a specific child."""
    if db is None:
        return []

    reports = await db.daily_reports.find(
        {"child_id": child_id},
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=100)

    return reports


@router.get("", response_model=List[DailyReportResponse])
async def list_reports(
    user: dict = Depends(require_role("ADMIN", "STAFF", "PARENT")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List reports. Staff/Admin see their own, Parents see their children's."""
    if db is None:
        return []

    role = user.get("role", "").upper()

    if role == "PARENT":
        children = await db.children.find(
            {"guardian_id": user.get("user_id")},
            {"_id": 0, "child_id": 1},
        ).to_list(length=20)
        child_ids = [c.get("child_id") for c in children if c.get("child_id")]
        if not child_ids:
            return []
        query = {"child_id": {"$in": child_ids}}
    else:
        query = {"teacher_id": user.get("user_id", "")}

    reports = await db.daily_reports.find(
        query,
        {"_id": 0},
    ).sort("created_at", -1).to_list(length=100)

    return reports
