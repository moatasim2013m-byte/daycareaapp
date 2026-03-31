from fastapi import APIRouter, HTTPException, status as http_status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from middleware.auth import require_role
from datetime import datetime, timezone, date
from models.session import OVERTIME_RATE_PER_HOUR
import uuid
import math

router = APIRouter(prefix="/billing", tags=["Billing & Accounting"])


def get_db():
    from server import db
    return db


# ── Models ──

class FeePlanCreate(BaseModel):
    child_id: str
    plan_name: str = Field(..., min_length=1)
    monthly_fee: float = Field(..., ge=0)
    description: str = ""


class FeePlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    monthly_fee: Optional[float] = None
    description: Optional[str] = None
    active: Optional[bool] = None


class FeePlanResponse(BaseModel):
    plan_id: str
    child_id: str
    child_name: str = ""
    plan_name: str
    monthly_fee: float
    description: str = ""
    active: bool = True
    created_at: str


class InvoiceGenerateRequest(BaseModel):
    child_id: str
    period_start: str = Field(..., description="YYYY-MM-DD")
    period_end: str = Field(..., description="YYYY-MM-DD")


class InvoiceLineItem(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float = 0
    total: float = 0


class InvoiceResponse(BaseModel):
    invoice_id: str
    child_id: str
    child_name: str = ""
    guardian_id: str = ""
    period_start: str
    period_end: str
    monthly_fee: float = 0
    sessions_count: int = 0
    total_session_fees: float = 0
    overtime_minutes: int = 0
    overtime_charges: float = 0
    line_items: List[InvoiceLineItem] = []
    total_due: float = 0
    status: str = "PENDING"
    created_at: str
    paid_at: Optional[str] = None


class BalanceResponse(BaseModel):
    child_id: str
    child_name: str = ""
    total_invoiced: float = 0
    total_paid: float = 0
    outstanding: float = 0
    pending_invoices: int = 0


# ── Fee Plan Endpoints ──

@router.post("/fee-plans", response_model=FeePlanResponse, status_code=201)
async def create_fee_plan(
    body: FeePlanCreate,
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    child = await db.children.find_one({"child_id": body.child_id}, {"_id": 0, "full_name": 1, "name": 1})
    child_name = (child or {}).get("full_name") or (child or {}).get("name") or ""

    plan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "plan_id": plan_id,
        "child_id": body.child_id,
        "child_name": child_name,
        "plan_name": body.plan_name,
        "monthly_fee": body.monthly_fee,
        "description": body.description,
        "active": True,
        "created_at": now,
    }
    await db.fee_plans.insert_one(doc)
    return doc


@router.get("/fee-plans", response_model=List[FeePlanResponse])
async def list_fee_plans(
    user: dict = Depends(require_role("ADMIN", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return []
    plans = await db.fee_plans.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return plans


@router.put("/fee-plans/{plan_id}", response_model=FeePlanResponse)
async def update_fee_plan(
    plan_id: str,
    body: FeePlanUpdate,
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    updates = {k: v for k, v in body.dict(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.fee_plans.update_one({"plan_id": plan_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Fee plan not found")

    updated = await db.fee_plans.find_one({"plan_id": plan_id}, {"_id": 0})
    return updated


# ── Invoice Endpoints ──

@router.post("/invoices/generate", response_model=InvoiceResponse, status_code=201)
async def generate_invoice(
    body: InvoiceGenerateRequest,
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Generate an invoice for a child covering a date range."""
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    try:
        start = date.fromisoformat(body.period_start)
        end = date.fromisoformat(body.period_end)
    except ValueError:
        raise HTTPException(status_code=400, detail="Dates must be YYYY-MM-DD")

    if end < start:
        raise HTTPException(status_code=400, detail="period_end must be after period_start")

    child = await db.children.find_one({"child_id": body.child_id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    child_name = child.get("full_name") or child.get("name") or ""
    guardian_id = child.get("guardian_id") or ""

    # Get fee plan
    fee_plan = await db.fee_plans.find_one(
        {"child_id": body.child_id, "active": True},
        {"_id": 0},
        sort=[("created_at", -1)],
    )
    monthly_fee = fee_plan["monthly_fee"] if fee_plan else 0

    # Get completed sessions in the period
    start_iso = datetime.combine(start, datetime.min.time()).replace(tzinfo=timezone.utc).isoformat()
    end_iso = datetime.combine(end, datetime.max.time()).replace(tzinfo=timezone.utc).isoformat()

    sessions = await db.sessions.find({
        "child_id": body.child_id,
        "checkin_at": {"$gte": start_iso, "$lte": end_iso},
    }, {"_id": 0}).to_list(500)

    # Also check checkin_sessions
    checkin_sessions = await db.checkin_sessions.find({
        "child_id": body.child_id,
        "check_in_time": {"$gte": start_iso, "$lte": end_iso},
    }, {"_id": 0}).to_list(500)

    # Calculate session fees & overtime
    total_session_fees = 0
    total_overtime_minutes = 0
    total_overtime_charges = 0
    line_items = []

    if monthly_fee > 0:
        line_items.append({
            "description": f"رسوم شهرية — {fee_plan['plan_name']}" if fee_plan else "رسوم شهرية",
            "quantity": 1,
            "unit_price": monthly_fee,
            "total": monthly_fee,
        })

    for sess in sessions:
        session_fee = sess.get("price", 0) or sess.get("amount", 0)
        overdue_mins = sess.get("overdue_minutes", 0)
        overdue_amt = sess.get("overdue_amount", 0)

        if session_fee > 0 or overdue_amt > 0:
            total_session_fees += session_fee
            total_overtime_minutes += overdue_mins
            total_overtime_charges += overdue_amt

    for sess in checkin_sessions:
        overdue_mins = sess.get("overdue_minutes", 0)
        overdue_amt = sess.get("overdue_amount", 0)
        total_overtime_minutes += overdue_mins
        total_overtime_charges += overdue_amt

    sessions_count = len(sessions) + len(checkin_sessions)

    if sessions_count > 0:
        line_items.append({
            "description": f"رسوم جلسات ({sessions_count} جلسة)",
            "quantity": sessions_count,
            "unit_price": round(total_session_fees / sessions_count, 2) if sessions_count > 0 else 0,
            "total": round(total_session_fees, 2),
        })

    if total_overtime_charges > 0:
        overtime_hours = math.ceil(total_overtime_minutes / 60) if total_overtime_minutes > 0 else 0
        line_items.append({
            "description": f"رسوم وقت إضافي ({overtime_hours} ساعة × {OVERTIME_RATE_PER_HOUR} د.أ)",
            "quantity": overtime_hours,
            "unit_price": OVERTIME_RATE_PER_HOUR,
            "total": round(total_overtime_charges, 2),
        })

    total_due = round(monthly_fee + total_session_fees + total_overtime_charges, 2)

    invoice_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    invoice_doc = {
        "invoice_id": invoice_id,
        "child_id": body.child_id,
        "child_name": child_name,
        "guardian_id": guardian_id,
        "period_start": body.period_start,
        "period_end": body.period_end,
        "monthly_fee": monthly_fee,
        "sessions_count": sessions_count,
        "total_session_fees": round(total_session_fees, 2),
        "overtime_minutes": total_overtime_minutes,
        "overtime_charges": round(total_overtime_charges, 2),
        "line_items": line_items,
        "total_due": total_due,
        "status": "PENDING",
        "created_at": now,
        "paid_at": None,
    }

    await db.invoices.insert_one(invoice_doc)
    return invoice_doc


@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    user: dict = Depends(require_role("ADMIN", "PARENT")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return []

    role = user.get("role", "").upper()
    if role == "PARENT":
        children = await db.children.find(
            {"guardian_id": user.get("user_id")}, {"_id": 0, "child_id": 1}
        ).to_list(20)
        child_ids = [c["child_id"] for c in children if c.get("child_id")]
        if not child_ids:
            return []
        query = {"child_id": {"$in": child_ids}}
    else:
        query = {}

    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return invoices


@router.post("/invoices/{invoice_id}/pay")
async def mark_invoice_paid(
    invoice_id: str,
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available")

    now = datetime.now(timezone.utc).isoformat()
    result = await db.invoices.update_one(
        {"invoice_id": invoice_id, "status": "PENDING"},
        {"$set": {"status": "PAID", "paid_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found or already paid")

    return {"message": "تم تسجيل الدفع بنجاح", "invoice_id": invoice_id, "status": "PAID", "paid_at": now}


@router.get("/balance/{child_id}", response_model=BalanceResponse)
async def get_child_balance(
    child_id: str,
    user: dict = Depends(require_role("ADMIN", "PARENT")),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if db is None:
        return {"child_id": child_id, "child_name": "", "total_invoiced": 0, "total_paid": 0, "outstanding": 0, "pending_invoices": 0}

    child = await db.children.find_one({"child_id": child_id}, {"_id": 0, "full_name": 1, "name": 1})
    child_name = (child or {}).get("full_name") or (child or {}).get("name") or ""

    invoices = await db.invoices.find({"child_id": child_id}, {"_id": 0, "total_due": 1, "status": 1}).to_list(500)

    total_invoiced = sum(inv.get("total_due", 0) for inv in invoices)
    total_paid = sum(inv.get("total_due", 0) for inv in invoices if inv.get("status") == "PAID")
    pending_count = sum(1 for inv in invoices if inv.get("status") == "PENDING")

    return {
        "child_id": child_id,
        "child_name": child_name,
        "total_invoiced": round(total_invoiced, 2),
        "total_paid": round(total_paid, 2),
        "outstanding": round(total_invoiced - total_paid, 2),
        "pending_invoices": pending_count,
    }
