from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.order import Order, OrderCreate, OrderItem, OrderResponse, PaymentCreate, Payment
from models.session import Session
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from services.event_logger import eventLogger
from datetime import datetime, timezone
import random

router = APIRouter(prefix="/orders", tags=["Orders"])

DEFAULT_TAX_RATE = 0.16
PLAY_SESSION_CATEGORIES = {"WALK_IN", "PLAY_PASS"}


def get_db():
    from server import db
    return db


def generate_order_number() -> str:
    """Generate unique order number: ORD-YYYYMMDD-XXXX"""
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = str(random.randint(1000, 9999))
    return f"ORD-{date_part}-{random_part}"


async def activate_play_session_for_order(order: dict, user: dict, db: AsyncIOMotorDatabase):
    """Auto-activate a play session for paid walk-in/play-pass orders."""
    if not order.get("child_id"):
        return

    already_active = await db.sessions.find_one({
        "order_id": order["order_id"],
        "state": {"$in": ["CHECKED_IN", "ACTIVE", "OVERDUE"]}
    })
    if already_active:
        return

    for item in order.get("items", []):
        product = await db.products.find_one({"product_id": item.get("product_id")}, {"_id": 0})
        if not product or product.get("category") not in PLAY_SESSION_CATEGORIES:
            continue

        included_minutes = int((product.get("duration_hours") or 2) * 60)
        now = datetime.now(timezone.utc)
        session = Session(
            child_id=order["child_id"],
            guardian_id=order.get("guardian_id") or "",
            session_type="WALK_IN",
            state="ACTIVE",
            included_minutes=included_minutes,
            order_id=order["order_id"],
            checkin_at=now,
            started_at=now,
            planned_end_at=now + timedelta(minutes=included_minutes),
            checked_in_by=user.get("user_id"),
        )
        session_dict = session.model_dump()
        for key in ["created_at", "updated_at", "checkin_at", "started_at", "planned_end_at"]:
            if session_dict.get(key):
                session_dict[key] = session_dict[key].isoformat()

        await db.sessions.insert_one(session_dict)
        await log_audit(
            db, "SESSION", session.session_id, "AUTO_ACTIVATED",
            user["user_id"], user["role"],
            after_state={"order_id": order["order_id"], "child_id": order["child_id"]},
        )
        return


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    guardian_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 50,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}

    if user.get("role") == "PARENT":
        query["guardian_id"] = user["user_id"]
    elif guardian_id:
        query["guardian_id"] = guardian_id

    if status_filter:
        query["status"] = status_filter

    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)

    result = []
    for order in orders:
        if isinstance(order.get("created_at"), str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if isinstance(order.get("paid_at"), str):
            order["paid_at"] = datetime.fromisoformat(order["paid_at"])

        if order.get("guardian_id"):
            guardian = await db.users.find_one({"user_id": order["guardian_id"]}, {"_id": 0})
            if guardian:
                order["guardian_name"] = guardian.get("display_name")

        if order.get("child_id"):
            child = await db.children.find_one({"child_id": order["child_id"]}, {"_id": 0})
            if child:
                order["child_name"] = child.get("full_name")

        result.append(OrderResponse(**order))

    return result




@router.get("/notifications/recent", response_model=List[dict])
async def list_recent_notifications(
    limit: int = 20,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    query = {}
    if user.get("role") == "PARENT":
        query["recipient_user_id"] = user.get("user_id")

    docs = await db.notification_logs.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return docs
@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    order_items = []
    subtotal = 0.0

    for item in order_data.items:
        product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"المنتج غير موجود: {item.product_id}"
            )

        unit_price = float(item.unit_price) if item.unit_price is not None else float(product.get("price", 0))
        line_total = unit_price * item.quantity

        order_item = OrderItem(
            product_id=item.product_id,
            product_name_ar=product.get("name_ar", ""),
            product_name_en=product.get("name_en", ""),
            quantity=item.quantity,
            unit_price=unit_price,
            line_total=line_total,
            notes=item.notes
        )
        order_items.append(order_item)
        subtotal += line_total

    guardian_id = order_data.guardian_id
    if not guardian_id and user.get("role") == "PARENT":
        guardian_id = user["user_id"]

    tax_amount = round(subtotal * DEFAULT_TAX_RATE, 2)
    total_amount = round(subtotal + tax_amount, 2)

    order = Order(
        order_number=generate_order_number(),
        guardian_id=guardian_id,
        child_id=order_data.child_id,
        items=order_items,
        subtotal=round(subtotal, 2),
        tax_amount=tax_amount,
        tax_rate=DEFAULT_TAX_RATE,
        total_amount=total_amount,
        status="OPEN",
        payment_method=order_data.payment_method,
        order_source=order_data.order_source,
        notes=order_data.notes,
        created_by=user["user_id"]
    )

    order_dict = order.model_dump()
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    order_dict["updated_at"] = order_dict["updated_at"].isoformat()
    order_dict["items"] = [dict(item) for item in order_dict["items"]]

    await db.orders.insert_one(order_dict)

    await log_audit(
        db, "ORDER", order.order_id, "CREATED",
        user["user_id"], user["role"],
        after_state={"order_number": order.order_number, "total": order.total_amount}
    )

    await eventLogger.log(
        db,
        "ORDER_CREATED",
        {
            "actorType": "staff" if user.get("role") != "PARENT" else "parent",
            "actorId": user.get("user_id"),
            "orderId": order.order_id,
            "metadata": {
                "order_number": order.order_number,
                "guardian_id": guardian_id,
                "child_id": order_data.child_id,
                "total_amount": order.total_amount,
                "item_count": len(order_items),
            },
        },
    )
    
    return OrderResponse(**order.model_dump())


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الطلب غير موجود")

    if user.get("role") == "PARENT" and order.get("guardian_id") != user["user_id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="غير مصرح")

    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order.get("paid_at"), str):
        order["paid_at"] = datetime.fromisoformat(order["paid_at"])

    return OrderResponse(**order)


@router.post("/pay", response_model=OrderResponse)
async def pay_order_by_body(
    payment: PaymentCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    return await _pay_order(payment.order_id, payment, user, db)


@router.post("/{order_id}/pay", response_model=OrderResponse)
async def pay_order(
    order_id: str,
    payment: Optional[PaymentCreate] = None,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    return await _pay_order(order_id, payment, user, db)


async def _pay_order(order_id: str, payment: Optional[PaymentCreate], user: dict, db: AsyncIOMotorDatabase) -> OrderResponse:
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الطلب غير موجود")

    if order.get("status") != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"لا يمكن الدفع للطلب بحالة: {order.get('status')}"
        )

    method = payment.method if payment else "CASH"
    amount = payment.amount if payment else float(order.get("total_amount", 0))

    if amount < order.get("total_amount", 0):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="مبلغ الدفع أقل من الإجمالي")

    now = datetime.now(timezone.utc)
    payment_record = Payment(order_id=order_id, method=method, amount=amount)
    payment_dict = payment_record.model_dump()
    payment_dict["created_at"] = payment_dict["created_at"].isoformat()
    await db.payments.insert_one(payment_dict)

    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "PAID", "payment_method": method, "paid_at": now.isoformat(), "updated_at": now.isoformat()}}
    )

    await log_audit(
        db, "ORDER", order_id, "PAID",
        user["user_id"], user["role"],
        before_state={"status": "OPEN"},
        after_state={"status": "PAID", "method": method}
    )

    await eventLogger.log(
        db,
        "PAYMENT_CAPTURED",
        {
            "actorType": "staff" if user.get("role") != "PARENT" else "parent",
            "actorId": user.get("user_id"),
            "orderId": order_id,
            "metadata": {
                "payment_id": payment_record.payment_id,
                "method": payment.method,
                "amount": payment.amount,
                "status": "COMPLETED",
            },
        },
    )
    
    # Get updated order
    updated = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    await activate_play_session_for_order(updated, user, db)

    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    if isinstance(updated.get("paid_at"), str):
        updated["paid_at"] = datetime.fromisoformat(updated["paid_at"])

    return OrderResponse(**updated)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    user: dict = Depends(require_role("ADMIN", "RECEPTION")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="الطلب غير موجود")

    if order.get("status") in ["CANCELLED", "REFUNDED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="الطلب ملغى أو مسترجع بالفعل")

    now = datetime.now(timezone.utc)
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": "CANCELLED", "updated_at": now.isoformat()}}
    )

    await log_audit(
        db, "ORDER", order_id, "CANCELLED",
        user["user_id"], user["role"],
        before_state={"status": order.get("status")},
        after_state={"status": "CANCELLED"}
    )

    updated = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])

    return OrderResponse(**updated)
