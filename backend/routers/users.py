from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.user import User, UserCreate, UserResponse
from middleware.auth import require_role
from utils.auth import hash_password
from utils.audit import log_audit
from datetime import datetime

router = APIRouter(prefix="/users", tags=["Users"])


def get_db():
    from server import db
    return db


@router.get("", response_model=List[UserResponse])
async def list_users(
    role: Optional[str] = None,
    branch_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List users (ADMIN sees all, MANAGER sees branch staff)
    """
    query = {}
    
    # Role filter
    if role:
        query["role"] = role
    
    # Branch filter
    if branch_id:
        query["branch_id"] = branch_id
    elif user.get("role") == "MANAGER":
        # Managers only see users in their branch
        query["branch_id"] = user.get("branch_id")
    
    # Status filter
    if status_filter:
        query["status"] = status_filter
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(100)
    
    # Parse datetime strings
    for u in users:
        if isinstance(u.get("created_at"), str):
            u["created_at"] = datetime.fromisoformat(u["created_at"])
    
    return [UserResponse(**u) for u in users]


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_staff_user(
    user_data: UserCreate,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create staff user (ADMIN can create any, MANAGER creates for their branch)
    """
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate role permissions
    if user.get("role") == "MANAGER":
        # Managers cannot create ADMIN or other MANAGER users
        if user_data.role in ["ADMIN", "MANAGER"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Managers cannot create ADMIN or MANAGER users"
            )
        # Manager can only create users for their branch
        if user_data.branch_id != user.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only create users for your assigned branch"
            )
    
    # Validate branch_id requirement
    if user_data.role != "ADMIN" and not user_data.branch_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="branch_id required for non-ADMIN users"
        )
    
    # Create user
    new_user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        phone=user_data.phone,
        role=user_data.role,
        branch_id=user_data.branch_id,
        preferred_language=user_data.preferred_language
    )
    
    user_dict = new_user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Audit log
    await log_audit(
        db, "USER", new_user.user_id, "CREATED",
        user["user_id"], user["role"],
        after_state={"email": new_user.email, "role": new_user.role},
        notes=f"Staff user created: {new_user.email}"
    )
    
    return UserResponse(**new_user.model_dump())


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    user: dict = Depends(require_role("ADMIN", "MANAGER", "CASHIER", "RECEPTION", "STAFF", "PARENT")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get own user profile
    """
    user_data = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if isinstance(user_data.get("created_at"), str):
        user_data["created_at"] = datetime.fromisoformat(user_data["created_at"])
    
    return UserResponse(**user_data)