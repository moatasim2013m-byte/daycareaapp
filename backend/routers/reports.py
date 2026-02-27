from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from middleware.auth import require_role
from datetime import datetime, timezone, date, timedelta
import csv
import io

router = APIRouter(prefix="/reports", tags=["Reports"])


def get_db():
    from server import db
    return db


@router.get("/daily-summary")
async def daily_summary(
    report_date: Optional[str] = None,
    user: dict = Depends(require_role("ADMIN", "RECEPTION")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get daily summary report:
    - Total revenue
    - Sessions count
    - Overtime collected
    - Plan sales breakdown
    """
    if report_date:
        target_date = date.fromisoformat(report_date)
    else:
        target_date = date.today()
    
    # Date range for the day
    start_of_day = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_of_day = datetime.combine(target_date, datetime.max.time()).replace(tzinfo=timezone.utc)
    
    # Get all paid orders for the day
    orders = await db.orders.find({
        "status": "PAID",
        "paid_at": {
            "$gte": start_of_day.isoformat(),
            "$lte": end_of_day.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(o.get("total_amount", 0) for o in orders)
    
    # Break down by category
    walk_in_revenue = 0
    subscription_revenue = 0
    visit_pack_revenue = 0
    overtime_revenue = 0
    
    for order in orders:
        for item in order.get("items", []):
            product_name = item.get("product_name_en", "")
            line_total = item.get("line_total", 0)
            
            if "Hour" in product_name or "Walk" in product_name:
                walk_in_revenue += line_total
            elif "Monthly" in product_name or "Half-Day" in product_name:
                subscription_revenue += line_total
            elif "Visit" in product_name:
                visit_pack_revenue += line_total
            elif "Overtime" in product_name:
                overtime_revenue += line_total
    
    # Get sessions for the day
    sessions = await db.sessions.find({
        "checkin_at": {
            "$gte": start_of_day.isoformat(),
            "$lte": end_of_day.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    total_sessions = len(sessions)
    walk_in_sessions = len([s for s in sessions if s.get("session_type") == "WALK_IN"])
    subscription_sessions = len([s for s in sessions if s.get("session_type") == "SUBSCRIPTION"])
    visit_pack_sessions = len([s for s in sessions if s.get("session_type") == "VISIT_PACK"])
    
    overdue_sessions = len([s for s in sessions if s.get("overdue_minutes", 0) > 0])
    total_overdue_minutes = sum(s.get("overdue_minutes", 0) for s in sessions)
    
    # Get new subscriptions sold
    new_subscriptions = await db.subscriptions.find({
        "purchased_at": {
            "$gte": start_of_day.isoformat(),
            "$lte": end_of_day.isoformat()
        }
    }, {"_id": 0}).to_list(100)
    
    subscription_breakdown = {
        "MONTHLY_ALL_ACCESS": 0,
        "HALF_DAY_MORNING": 0,
        "HALF_DAY_EVENING": 0
    }
    for sub in new_subscriptions:
        plan_type = sub.get("plan_type")
        if plan_type in subscription_breakdown:
            subscription_breakdown[plan_type] += 1
    
    # Get new visit packs sold
    new_visit_packs = await db.visit_packs.count_documents({
        "purchased_at": {
            "$gte": start_of_day.isoformat(),
            "$lte": end_of_day.isoformat()
        }
    })
    
    return {
        "report_date": target_date.isoformat(),
        "revenue": {
            "total": round(total_revenue, 2),
            "walk_in": round(walk_in_revenue, 2),
            "subscriptions": round(subscription_revenue, 2),
            "visit_packs": round(visit_pack_revenue, 2),
            "overtime": round(overtime_revenue, 2)
        },
        "sessions": {
            "total": total_sessions,
            "walk_in": walk_in_sessions,
            "subscription": subscription_sessions,
            "visit_pack": visit_pack_sessions,
            "overdue_count": overdue_sessions,
            "total_overdue_minutes": total_overdue_minutes
        },
        "sales": {
            "subscriptions": {
                "total": len(new_subscriptions),
                "by_plan": subscription_breakdown
            },
            "visit_packs": new_visit_packs
        },
        "orders_count": len(orders)
    }


@router.get("/revenue")
async def revenue_report(
    start_date: str,
    end_date: str,
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get revenue report for a date range"""
    start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
    end = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    
    # Get all paid orders in range
    orders = await db.orders.find({
        "status": "PAID",
        "paid_at": {
            "$gte": start.isoformat(),
            "$lte": end.isoformat()
        }
    }, {"_id": 0}).to_list(10000)
    
    # Group by date
    daily_revenue = {}
    for order in orders:
        paid_at = order.get("paid_at")
        if isinstance(paid_at, str):
            paid_at = datetime.fromisoformat(paid_at)
        
        day_key = paid_at.date().isoformat()
        if day_key not in daily_revenue:
            daily_revenue[day_key] = 0
        
        daily_revenue[day_key] += order.get("total_amount", 0)
    
    total = sum(daily_revenue.values())
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_revenue": round(total, 2),
        "daily_breakdown": {k: round(v, 2) for k, v in sorted(daily_revenue.items())},
        "orders_count": len(orders)
    }


@router.get("/sessions-history")
async def sessions_history_report(
    start_date: str,
    end_date: str,
    user: dict = Depends(require_role("ADMIN", "RECEPTION")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get sessions history report"""
    start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
    end = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    
    sessions = await db.sessions.find({
        "checkin_at": {
            "$gte": start.isoformat(),
            "$lte": end.isoformat()
        }
    }, {"_id": 0}).sort("checkin_at", 1).to_list(10000)
    
    # Aggregate stats
    total_sessions = len(sessions)
    by_type = {"WALK_IN": 0, "SUBSCRIPTION": 0, "VISIT_PACK": 0}
    by_area = {"DAYCARE": 0, "SAND": 0}
    total_duration = 0
    total_overtime = 0
    overtime_revenue = 0
    
    for sess in sessions:
        session_type = sess.get("session_type", "WALK_IN")
        area = sess.get("area", "DAYCARE")
        
        if session_type in by_type:
            by_type[session_type] += 1
        if area in by_area:
            by_area[area] += 1
        
        total_duration += sess.get("actual_minutes", 0)
        total_overtime += sess.get("overdue_minutes", 0)
        overtime_revenue += sess.get("overdue_amount", 0)
    
    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_sessions": total_sessions,
        "by_type": by_type,
        "by_area": by_area,
        "avg_duration_minutes": round(total_duration / total_sessions, 1) if total_sessions > 0 else 0,
        "total_overtime_minutes": total_overtime,
        "overtime_revenue": round(overtime_revenue, 2)
    }


@router.get("/export/daily")
async def export_daily_csv(
    report_date: Optional[str] = None,
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Export daily report as CSV"""
    if report_date:
        target_date = date.fromisoformat(report_date)
    else:
        target_date = date.today()
    
    start_of_day = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_of_day = datetime.combine(target_date, datetime.max.time()).replace(tzinfo=timezone.utc)
    
    # Get sessions
    sessions = await db.sessions.find({
        "checkin_at": {
            "$gte": start_of_day.isoformat(),
            "$lte": end_of_day.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "Session ID", "Child ID", "Guardian ID", "Area", "Type",
        "Check-in Time", "Check-out Time", "Included Minutes",
        "Actual Minutes", "Overdue Minutes", "Overdue Amount (JD)", "State"
    ])
    
    for sess in sessions:
        writer.writerow([
            sess.get("session_id"),
            sess.get("child_id"),
            sess.get("guardian_id"),
            sess.get("area"),
            sess.get("session_type"),
            sess.get("checkin_at"),
            sess.get("ended_at", ""),
            sess.get("included_minutes"),
            sess.get("actual_minutes", 0),
            sess.get("overdue_minutes", 0),
            sess.get("overdue_amount", 0),
            sess.get("state")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=daily_report_{target_date.isoformat()}.csv"
        }
    )


@router.get("/export/revenue")
async def export_revenue_csv(
    start_date: str,
    end_date: str,
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Export revenue report as CSV"""
    start = datetime.fromisoformat(start_date).replace(tzinfo=timezone.utc)
    end = datetime.fromisoformat(end_date).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    
    orders = await db.orders.find({
        "status": "PAID",
        "paid_at": {
            "$gte": start.isoformat(),
            "$lte": end.isoformat()
        }
    }, {"_id": 0}).sort("paid_at", 1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "Order Number", "Guardian ID", "Child ID", "Total Amount (JD)",
        "Payment Method", "Paid At", "Items"
    ])
    
    for order in orders:
        items_str = "; ".join([
            f"{i.get('product_name_en', '')} x{i.get('quantity', 1)}"
            for i in order.get("items", [])
        ])
        
        writer.writerow([
            order.get("order_number"),
            order.get("guardian_id"),
            order.get("child_id"),
            order.get("total_amount"),
            order.get("payment_method"),
            order.get("paid_at"),
            items_str
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=revenue_{start_date}_to_{end_date}.csv"
        }
    )
