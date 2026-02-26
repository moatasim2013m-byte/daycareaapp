from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import UserCreate, UserLogin, User, UserResponse, TokenResponse
from utils.auth import hash_password, verify_password, create_access_token
from utils.audit import log_audit
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_db():
    from server import db
    return db


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Register new user (Parent role only via public endpoint)
    Staff users created via admin endpoint
    """
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Only allow PARENT role via public registration
    if user_data.role != "PARENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration only allowed for PARENT role"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        phone=user_data.phone,
        role=user_data.role,
        branch_id=user_data.branch_id,
        preferred_language=user_data.preferred_language
    )
    
    user_dict = user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Audit log
    await log_audit(
        db, "USER", user.user_id, "CREATED",
        user.user_id, user.role, notes="User registered"
    )
    
    # Generate token
    token_data = {
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role,
        "branch_id": user.branch_id
    }
    access_token, expires_at = create_access_token(token_data)
    
    user_response = UserResponse(**user.model_dump())
    
    return TokenResponse(
        access_token=access_token,
        user=user_response,
        expires_at=expires_at
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Login for all user roles
    """
    # Find user
    user_dict = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user_dict["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if user_dict.get("status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Update last login
    await db.users.update_one(
        {"user_id": user_dict["user_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Generate token
    token_data = {
        "user_id": user_dict["user_id"],
        "email": user_dict["email"],
        "role": user_dict["role"],
        "branch_id": user_dict.get("branch_id")
    }
    access_token, expires_at = create_access_token(token_data)
    
    # Parse datetime strings back to datetime objects for response
    if isinstance(user_dict.get("created_at"), str):
        user_dict["created_at"] = datetime.fromisoformat(user_dict["created_at"])
    
    user_response = UserResponse(**user_dict)
    
    return TokenResponse(
        access_token=access_token,
        user=user_response,
        expires_at=expires_at
    )