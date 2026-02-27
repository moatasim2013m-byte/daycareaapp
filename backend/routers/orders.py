from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.order import Order, OrderCreate, OrderItem, OrderResponse, PaymentCreate, Payment
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from datetime import datetime, timezone
import random

router = APIRouter(prefix="/orders", tags=["Orders"])


def get_db():
    from server import db
    return db


def generate_order_number() -> str:
    """Generate unique order number: ORD-YYYYMMDD-XXXX"""
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_part = str(random.randint(1000, 9999))
    return f"ORD-{date_part}-{random_part}"


@router.get("", response_model=List[OrderResponse])
async def list_orders(
    guardian_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 50,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List orders.
    - PARENT: Only their own orders
    - STAFF: All orders
    """
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
        
        # Get guardian and child names
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


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new order"""
    # Build order items
    order_items = []
    subtotal = 0.0
    
    for item in order_data.items:
        # Lookup product
        product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"المنتج غير موجود: {item.product_id}"
            )
        
        line_total = item.unit_price * item.quantity
        
        order_item = OrderItem(
            product_id=item.product_id,
            product_name_ar=product.get("name_ar", ""),
            product_name_en=product.get("name_en", ""),
            quantity=item.quantity,
            unit_price=item.unit_price,
            line_total=line_total,
            notes=item.notes
        )
        order_items.append(order_item)
        subtotal += line_total
    
    # Determine guardian_id
    guardian_id = order_data.guardian_id
    if not guardian_id and user.get("role") == "PARENT":
        guardian_id = user["user_id"]
    
    # Create order
    order = Order(
        order_number=generate_order_number(),
        guardian_id=guardian_id,
        child_id=order_data.child_id,
        items=order_items,
        subtotal=round(subtotal, 2),
        tax_amount=0.0,  # No tax for daycare
        total_amount=round(subtotal, 2),
        status="OPEN",
        payment_method=order_data.payment_method,
        notes=order_data.notes,
        created_by=user["user_id"]
    )
    
    # Serialize for MongoDB
    order_dict = order.model_dump()
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    order_dict["updated_at"] = order_dict["updated_at"].isoformat()
    order_dict["items"] = [dict(item) for item in order_dict["items"]]
    
    await db.orders.insert_one(order_dict)
    
    # Audit log
    await log_audit(
        db, "ORDER", order.order_id, "CREATED",
        user["user_id"], user["role"],
        after_state={"order_number": order.order_number, "total": order.total_amount}
    )
    
    return OrderResponse(**order.model_dump())


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get order details"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطلب غير موجود"
        )
    
    # Parents can only view their own orders
    if user.get("role") == "PARENT" and order.get("guardian_id") != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مصرح"
        )
    
    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order.get("paid_at"), str):
        order["paid_at"] = datetime.fromisoformat(order["paid_at"])
    
    return OrderResponse(**order)


@router.post("/{order_id}/pay", response_model=OrderResponse)
async def pay_order(
    order_id: str,
    payment: PaymentCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Pay for an order"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطلب غير موجود"
        )
    
    if order.get("status") != "OPEN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"لا يمكن الدفع للطلب بحالة: {order.get('status')}"
        )
    
    # Verify payment amount
    if payment.amount < order.get("total_amount", 0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="مبلغ الدفع أقل من الإجمالي"
        )
    
    now = datetime.now(timezone.utc)
    
    # Create payment record
    payment_record = Payment(
        order_id=order_id,
        method=payment.method,
        amount=payment.amount
    )
    payment_dict = payment_record.model_dump()
    payment_dict["created_at"] = payment_dict["created_at"].isoformat()
    await db.payments.insert_one(payment_dict)
    
    # Update order
    await db.orders.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "status": "PAID",
                "payment_method": payment.method,
                "paid_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        }
    )
    
    # Audit log
    await log_audit(
        db, "ORDER", order_id, "PAID",
        user["user_id"], user["role"],
        before_state={"status": "OPEN"},
        after_state={"status": "PAID", "method": payment.method}
    )
    
    # Get updated order
    updated = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
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
    """Cancel an order (staff only)"""
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطلب غير موجود"
        )
    
    if order.get("status") in ["CANCELLED", "REFUNDED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الطلب ملغى أو مسترجع بالفعل"
        )
    
    now = datetime.now(timezone.utc)
    
    await db.orders.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "status": "CANCELLED",
                "updated_at": now.isoformat()
            }
        }
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
