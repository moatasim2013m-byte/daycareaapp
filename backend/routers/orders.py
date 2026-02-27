from fastapi import APIRouter, HTTPException, status, Depends, Security
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.order import Order, OrderCreate, OrderItem, OrderResponse
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
    branch_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = 50,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List orders - filtered by branch for non-admin staff
    """
    query = {}
    
    # Branch filter
    if branch_id:
        query["branch_id"] = branch_id
    elif user.get("role") not in ["ADMIN"]:
        if user.get("branch_id"):
            query["branch_id"] = user["branch_id"]
    
    # Status filter
    if status_filter:
        query["status"] = status_filter
    
    # Customer filter
    if customer_id:
        query["customer_id"] = customer_id
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Parse datetime strings
    for order in orders:
        if isinstance(order.get("created_at"), str):
            order["created_at"] = datetime.fromisoformat(order["created_at"])
        if isinstance(order.get("confirmed_at"), str):
            order["confirmed_at"] = datetime.fromisoformat(order["confirmed_at"])
    
    return [OrderResponse(**o) for o in orders]


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    user: dict = Depends(require_role("ADMIN", "MANAGER", "CASHIER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create a new order (POS staff)
    """
    # Manager/Cashier can only create orders for their branch
    if user.get("role") in ["MANAGER", "CASHIER"]:
        if user.get("branch_id") != order_data.branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only create orders for your assigned branch"
            )
    
    # Build order items from product lookups
    order_items = []
    subtotal = 0.0
    total_tax = 0.0
    
    for item in order_data.items:
        # Lookup product
        product = await db.products.find_one({"product_id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product not found: {item.product_id}"
            )
        
        # Check product is active
        if not product.get("active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product is not active: {product.get('name_ar')}"
            )
        
        # Check product belongs to the same branch
        if product.get("branch_id") != order_data.branch_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product not available in this branch: {product.get('name_ar')}"
            )
        
        # Calculate item totals
        unit_price = product.get("price", 0)
        item_subtotal = unit_price * item.quantity
        tax_rate = product.get("tax_rate", 0.15)
        item_tax = item_subtotal * tax_rate
        item_total = item_subtotal + item_tax
        
        order_item = OrderItem(
            product_id=item.product_id,
            product_name_ar=product.get("name_ar", ""),
            product_name_en=product.get("name_en", ""),
            quantity=item.quantity,
            unit_price=unit_price,
            discount_amount=0.0,
            tax_amount=round(item_tax, 2),
            total_amount=round(item_total, 2),
            notes=item.notes
        )
        order_items.append(order_item)
        subtotal += item_subtotal
        total_tax += item_tax
    
    # Calculate order totals
    discount = order_data.discount_amount or 0.0
    total_amount = subtotal + total_tax - discount
    
    # Create order
    order = Order(
        branch_id=order_data.branch_id,
        order_number=generate_order_number(),
        order_source=order_data.order_source,
        customer_id=order_data.customer_id,
        created_by=user["user_id"],
        status="DRAFT",
        items=order_items,
        subtotal=round(subtotal, 2),
        discount_amount=round(discount, 2),
        tax_amount=round(total_tax, 2),
        total_amount=round(total_amount, 2),
        notes=order_data.notes
    )
    
    # Serialize for MongoDB
    order_dict = order.model_dump()
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    order_dict["updated_at"] = order_dict["updated_at"].isoformat()
    if order_dict.get("confirmed_at"):
        order_dict["confirmed_at"] = order_dict["confirmed_at"].isoformat()
    # Serialize order items
    for idx, item in enumerate(order_dict["items"]):
        order_dict["items"][idx] = dict(item)
    
    await db.orders.insert_one(order_dict)
    
    # Audit log
    await log_audit(
        db, "ORDER", order.order_id, "CREATED",
        user["user_id"], user["role"],
        after_state={"order_number": order.order_number, "total": order.total_amount},
        notes=f"Order created: {order.order_number}"
    )
    
    return OrderResponse(**order.model_dump())


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get order details
    """
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Non-admin can only view orders in their branch
    if user.get("role") not in ["ADMIN"]:
        if user.get("branch_id") != order.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    if isinstance(order.get("created_at"), str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order.get("confirmed_at"), str):
        order["confirmed_at"] = datetime.fromisoformat(order["confirmed_at"])
    
    return OrderResponse(**order)


@router.post("/{order_id}/confirm", response_model=OrderResponse)
async def confirm_order(
    order_id: str,
    user: dict = Depends(require_role("ADMIN", "MANAGER", "CASHIER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Confirm an order (move from DRAFT to CONFIRMED)
    """
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check branch access
    if user.get("role") in ["MANAGER", "CASHIER"]:
        if user.get("branch_id") != order.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only confirm orders in your assigned branch"
            )
    
    # Check current status
    if order.get("status") != "DRAFT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm order with status: {order.get('status')}"
        )
    
    # Update order
    now = datetime.now(timezone.utc)
    await db.orders.update_one(
        {"order_id": order_id},
        {
            "$set": {
                "status": "CONFIRMED",
                "confirmed_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        }
    )
    
    # Audit log
    await log_audit(
        db, "ORDER", order_id, "CONFIRMED",
        user["user_id"], user["role"],
        before_state={"status": "DRAFT"},
        after_state={"status": "CONFIRMED"},
        notes=f"Order confirmed: {order.get('order_number')}"
    )
    
    # Get updated order
    updated_order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if isinstance(updated_order.get("created_at"), str):
        updated_order["created_at"] = datetime.fromisoformat(updated_order["created_at"])
    if isinstance(updated_order.get("confirmed_at"), str):
        updated_order["confirmed_at"] = datetime.fromisoformat(updated_order["confirmed_at"])
    
    return OrderResponse(**updated_order)


@router.post("/{order_id}/pay", response_model=OrderResponse)
async def pay_order(
    order_id: str,
    user: dict = Depends(require_role("ADMIN", "MANAGER", "CASHIER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Mark order as paid
    """
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check branch access
    if user.get("role") in ["MANAGER", "CASHIER"]:
        if user.get("branch_id") != order.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only process payments for orders in your assigned branch"
            )
    
    # Check current status
    if order.get("status") not in ["DRAFT", "CONFIRMED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot pay order with status: {order.get('status')}"
        )
    
    # Update order
    now = datetime.now(timezone.utc)
    updates = {
        "status": "PAID",
        "updated_at": now.isoformat()
    }
    if not order.get("confirmed_at"):
        updates["confirmed_at"] = now.isoformat()
    
    await db.orders.update_one(
        {"order_id": order_id},
        {"$set": updates}
    )
    
    # Audit log
    await log_audit(
        db, "ORDER", order_id, "PAID",
        user["user_id"], user["role"],
        before_state={"status": order.get("status")},
        after_state={"status": "PAID"},
        notes=f"Order paid: {order.get('order_number')} - Total: {order.get('total_amount')}"
    )
    
    # Get updated order
    updated_order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if isinstance(updated_order.get("created_at"), str):
        updated_order["created_at"] = datetime.fromisoformat(updated_order["created_at"])
    if isinstance(updated_order.get("confirmed_at"), str):
        updated_order["confirmed_at"] = datetime.fromisoformat(updated_order["confirmed_at"])
    
    return OrderResponse(**updated_order)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: str,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Cancel an order (ADMIN or MANAGER only)
    """
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Check branch access
    if user.get("role") == "MANAGER":
        if user.get("branch_id") != order.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only cancel orders in your assigned branch"
            )
    
    # Check current status
    if order.get("status") in ["CANCELLED", "REFUNDED"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order with status: {order.get('status')}"
        )
    
    # Update order
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
    
    # Audit log
    await log_audit(
        db, "ORDER", order_id, "CANCELLED",
        user["user_id"], user["role"],
        before_state={"status": order.get("status")},
        after_state={"status": "CANCELLED"},
        notes=f"Order cancelled: {order.get('order_number')}"
    )
    
    # Get updated order
    updated_order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if isinstance(updated_order.get("created_at"), str):
        updated_order["created_at"] = datetime.fromisoformat(updated_order["created_at"])
    if isinstance(updated_order.get("confirmed_at"), str):
        updated_order["confirmed_at"] = datetime.fromisoformat(updated_order["confirmed_at"])
    
    return OrderResponse(**updated_order)
