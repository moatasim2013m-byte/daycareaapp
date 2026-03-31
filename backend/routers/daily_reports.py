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
    created_at: str


# ── Endpoints ──

@router.post("", response_model=DailyReportResponse, status_code=status.HTTP_201_CREATED)
async def create_daily_report(
    body: DailyReportCreate,
    user: dict = Depends(require_role("ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Teacher creates a daily report. Gemini generates bilingual summary."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    # Resolve child name if not provided
    child_name = body.child_name
    if not child_name:
        child_doc = await db.children.find_one({"child_id": body.child_id}, {"_id": 0, "full_name": 1, "name": 1})
        child_name = (child_doc or {}).get("full_name") or (child_doc or {}).get("name") or f"Child {body.child_id}"

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
        "created_at": now,
    }


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
