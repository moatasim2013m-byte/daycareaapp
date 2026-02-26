from fastapi import APIRouter, HTTPException, status, Depends, Security
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.product import Product, ProductCreate, ProductUpdate, ProductResponse
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from datetime import datetime, timezone

router = APIRouter(prefix="/products", tags=["Products"])


def get_db():
    from server import db
    return db


@router.get("", response_model=List[ProductResponse])
async def list_products(
    branch_id: Optional[str] = None,
    category: Optional[str] = None,
    active: Optional[bool] = None,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List products (public for customers, branch-filtered for staff)
    """
    query = {}
    
    # Branch filter
    if branch_id:
        query["branch_id"] = branch_id
    elif user.get("role") not in ["ADMIN", "PARENT"]:
        # Staff see only their branch products
        if user.get("branch_id"):
            query["branch_id"] = user["branch_id"]
    
    # Category filter
    if category:
        query["category"] = category
    
    # Active filter
    if active is not None:
        query["active"] = active
    
    products = await db.products.find(query, {"_id": 0}).to_list(200)
    
    # Parse datetime strings
    for product in products:
        if isinstance(product.get("created_at"), str):
            product["created_at"] = datetime.fromisoformat(product["created_at"])
    
    return [ProductResponse(**p) for p in products]


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create product (ADMIN or MANAGER)
    """
    # Manager can only create products for their branch
    if user.get("role") == "MANAGER":
        if user.get("branch_id") != product_data.branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only create products for your assigned branch"
            )
    
    # Check SKU uniqueness per branch
    existing = await db.products.find_one({
        "branch_id": product_data.branch_id,
        "sku": product_data.sku
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SKU already exists in this branch"
        )
    
    product = Product(**product_data.model_dump())
    
    product_dict = product.model_dump()
    product_dict["created_at"] = product_dict["created_at"].isoformat()
    product_dict["updated_at"] = product_dict["updated_at"].isoformat()
    
    await db.products.insert_one(product_dict)
    
    # Audit log
    await log_audit(
        db, "PRODUCT", product.product_id, "CREATED",
        user["user_id"], user["role"],
        after_state={"name_ar": product.name_ar, "price": product.price, "sku": product.sku},
        notes=f"Product created: {product.name_en}"
    )
    
    return ProductResponse(**product.model_dump())


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get product details
    """
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Non-admin/parent can only view products in their branch
    if user.get("role") not in ["ADMIN", "PARENT"]:
        if user.get("branch_id") != product.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    if isinstance(product.get("created_at"), str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])
    
    return ProductResponse(**product)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    updates: ProductUpdate,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update product (ADMIN or MANAGER)
    """
    # Get current state
    existing = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Manager can only update products in their branch
    if user.get("role") == "MANAGER":
        if user.get("branch_id") != existing.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only update products in your assigned branch"
            )
    
    # Update fields
    update_data = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.products.update_one(
            {"product_id": product_id},
            {"$set": update_data}
        )
        
        # Audit log
        await log_audit(
            db, "PRODUCT", product_id, "UPDATED",
            user["user_id"], user["role"],
            before_state=existing,
            after_state=update_data,
            notes="Product updated"
        )
    
    # Get updated product
    updated_product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    
    if isinstance(updated_product.get("created_at"), str):
        updated_product["created_at"] = datetime.fromisoformat(updated_product["created_at"])
    
    return ProductResponse(**updated_product)
