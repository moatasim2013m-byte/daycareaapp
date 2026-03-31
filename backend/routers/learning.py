from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from typing import Optional, List
from middleware.auth import require_role
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/learning", tags=["Learning & Assessment"])


def get_db():
    from server import db
    return db


# ── Lesson Models ──

class LessonCreate(BaseModel):
    topic: str = Field(..., min_length=2)
    age_group: str = Field(..., min_length=1, description="e.g. 2-3 years, 4-5 years")
    duration_minutes: int = Field(default=30, ge=10, le=120)
    objectives: str = ""


class LessonResponse(BaseModel):
    lesson_id: str
    teacher_id: str
    teacher_name: str
    topic: str
    age_group: str
    duration_minutes: int
    objectives: str
    plan_ar: str
    plan_en: str
    created_at: str


# ── Observation Models ──

OBSERVATION_CATEGORIES = ["social", "cognitive", "physical", "language", "emotional", "general"]


class ObservationCreate(BaseModel):
    child_id: str
    child_name: str = ""
    category: str = Field(default="general", description="social/cognitive/physical/language/emotional/general")
    notes: str = Field(..., min_length=3)
    milestone: bool = False
    session_id: Optional[str] = None
    daily_report_id: Optional[str] = None


class ObservationResponse(BaseModel):
    observation_id: str
    teacher_id: str
    teacher_name: str
    child_id: str
    child_name: str
    category: str
    notes: str
    milestone: bool
    session_id: Optional[str] = None
    daily_report_id: Optional[str] = None
    created_at: str


# ── Lesson Endpoints ──

@router.post("/lessons", response_model=LessonResponse, status_code=201)
async def create_lesson(
    body: LessonCreate,
    user: dict = Depends(require_role("ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Teacher creates a lesson plan. Gemini generates bilingual content."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    from services.gemini_service import generate_lesson_plan
    generated = await generate_lesson_plan(
        topic=body.topic,
        age_group=body.age_group,
        duration_minutes=body.duration_minutes,
        objectives=body.objectives,
    )

    lesson_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "lesson_id": lesson_id,
        "teacher_id": user.get("user_id", ""),
        "teacher_name": user.get("display_name") or user.get("email", "Teacher"),
        "topic": body.topic,
        "age_group": body.age_group,
        "duration_minutes": body.duration_minutes,
        "objectives": body.objectives,
        "plan_ar": generated["plan_ar"],
        "plan_en": generated["plan_en"],
        "created_at": now,
    }

    await db.lessons.insert_one(doc)
    return doc


@router.get("/lessons", response_model=List[LessonResponse])
async def list_lessons(
    user: dict = Depends(require_role("ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return []

    role = user.get("role", "").upper()
    query = {} if role == "ADMIN" else {"teacher_id": user.get("user_id", "")}

    lessons = await db.lessons.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return lessons


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
async def get_lesson(
    lesson_id: str,
    user: dict = Depends(require_role("ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    lesson = await db.lessons.find_one({"lesson_id": lesson_id}, {"_id": 0})
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


# ── Observation Endpoints ──

@router.post("/observations", response_model=ObservationResponse, status_code=201)
async def create_observation(
    body: ObservationCreate,
    user: dict = Depends(require_role("ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Teacher records a child observation."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    child_name = body.child_name
    if not child_name:
        child_doc = await db.children.find_one({"child_id": body.child_id}, {"_id": 0, "full_name": 1, "name": 1})
        child_name = (child_doc or {}).get("full_name") or (child_doc or {}).get("name") or f"Child {body.child_id}"

    # Auto-link to active session if not provided
    session_id = body.session_id
    if not session_id:
        active = await db.sessions.find_one(
            {"child_id": body.child_id, "state": {"$in": ["CHECKED_IN", "ACTIVE", "OVERDUE"]}},
            {"_id": 0, "session_id": 1},
            sort=[("checkin_at", -1)],
        )
        if active:
            session_id = active.get("session_id")

    observation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    category = body.category if body.category in OBSERVATION_CATEGORIES else "general"

    doc = {
        "observation_id": observation_id,
        "teacher_id": user.get("user_id", ""),
        "teacher_name": user.get("display_name") or user.get("email", "Teacher"),
        "child_id": body.child_id,
        "child_name": child_name,
        "category": category,
        "notes": body.notes,
        "milestone": body.milestone,
        "session_id": session_id,
        "daily_report_id": body.daily_report_id,
        "created_at": now,
    }

    await db.observations.insert_one(doc)
    return doc


@router.get("/observations", response_model=List[ObservationResponse])
async def list_observations(
    user: dict = Depends(require_role("ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return []

    role = user.get("role", "").upper()
    query = {} if role == "ADMIN" else {"teacher_id": user.get("user_id", "")}

    observations = await db.observations.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return observations


@router.get("/observations/child/{child_id}", response_model=List[ObservationResponse])
async def get_child_observations(
    child_id: str,
    user: dict = Depends(require_role("ADMIN", "STAFF", "PARENT")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return []

    observations = await db.observations.find(
        {"child_id": child_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return observations
