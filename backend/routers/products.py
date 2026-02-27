from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.product import Product, ProductCreate, ProductResponse, DEFAULT_PRODUCTS
from middleware.auth import get_current_user, require_role
from datetime import datetime, timezone

router = APIRouter(prefix="/products", tags=["Products"])


def get_db():
    from server import db
    return db


@router.get("", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = None,
    active_only: bool = True,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List all products (public endpoint)"""
    query = {}
    if category:
        query["category"] = category
    if active_only:
        query["is_active"] = True
    
    products = await db.products.find(query, {"_id": 0}).sort("price", 1).to_list(100)
    
    return [ProductResponse(**p) for p in products]


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new product (ADMIN only)"""
    product = Product(**product_data.model_dump())
    
    product_dict = product.model_dump()
    product_dict["created_at"] = product_dict["created_at"].isoformat()
    product_dict["updated_at"] = product_dict["updated_at"].isoformat()
    
    await db.products.insert_one(product_dict)
    
    return ProductResponse(**product.model_dump())


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get product by ID"""
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المنتج غير موجود"
        )
    
    return ProductResponse(**product)


@router.post("/seed", response_model=List[ProductResponse])
async def seed_products(
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Seed default products (ADMIN only)"""
    created_products = []
    
    for product_data in DEFAULT_PRODUCTS:
        # Check if product with same name exists
        existing = await db.products.find_one({"name_en": product_data["name_en"]})
        if existing:
            continue
        
        product = Product(**product_data)
        product_dict = product.model_dump()
        product_dict["created_at"] = product_dict["created_at"].isoformat()
        product_dict["updated_at"] = product_dict["updated_at"].isoformat()
        
        await db.products.insert_one(product_dict)
        created_products.append(ProductResponse(**product.model_dump()))
    
    return created_products
