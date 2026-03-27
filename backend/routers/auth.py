from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.user import User, UserCreate, UserLogin, UserResponse, TokenResponse
from middleware.auth import create_token, get_current_user
from datetime import datetime, timezone
import logging
import bcrypt

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


def get_db():
    from server import db
    return db


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Register a new user (default role: PARENT)"""
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="البريد الإلكتروني مستخدم بالفعل"  # Email already in use
        )
    
    # Hash password
    password_hash = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    
    # Create user
    user = User(
        email=user_data.email.lower(),
        password_hash=password_hash,
        display_name=user_data.display_name,
        phone=user_data.phone,
        role=user_data.role if user_data.role in ["PARENT"] else "PARENT"  # Only allow PARENT for self-registration
    )
    
    # Save to DB
    user_dict = user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_token(user.user_id, user.email, user.role)
    
    user_response = UserResponse(
        user_id=user.user_id,
        email=user.email,
        display_name=user.display_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )
    
    return TokenResponse(access_token=token, user=user_response)


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Login and get access token"""
    if not credentials.email or not credentials.password:
        logger.warning("Login rejected due to malformed credentials payload")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="البيانات المدخلة غير صالحة"
        )

    normalized_email = credentials.email.strip().lower()

    # Find user
    user_doc = await db.users.find_one({"email": normalized_email}, {"_id": 0})
    if not user_doc:
        logger.warning("Login failed: user not found", extra={"email": normalized_email})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="بيانات الدخول غير صحيحة"  # Invalid credentials
        )

    password_hash = user_doc.get("password_hash")
    if not password_hash:
        logger.warning("Login failed: account missing password hash", extra={"email": normalized_email})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="بيانات الدخول غير صحيحة"
        )

    # Check password
    if not bcrypt.checkpw(credentials.password.encode(), str(password_hash).encode()):
        logger.warning("Login failed: invalid password", extra={"email": normalized_email})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="بيانات الدخول غير صحيحة"
        )

    # Check if active
    if not user_doc.get("is_active", True):
        logger.warning("Login failed: account disabled", extra={"email": normalized_email})
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="الحساب معطل"  # Account disabled
        )

    user_id = user_doc.get("user_id")
    if not user_id:
        logger.warning("Login failed: account missing user_id", extra={"email": normalized_email})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="بيانات الدخول غير صحيحة"
        )

    # Update last login
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"last_login_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Create token
    token = create_token(user_id, user_doc.get("email", normalized_email), user_doc.get("role", "PARENT"))

    # Parse created_at
    created_at = user_doc.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at)
        except ValueError:
            created_at = datetime.now(timezone.utc)
    if not isinstance(created_at, datetime):
        created_at = datetime.now(timezone.utc)

    user_response = UserResponse(
        user_id=user_id,
        email=user_doc.get("email", normalized_email),
        display_name=user_doc.get("display_name", normalized_email),
        phone=user_doc.get("phone"),
        role=user_doc.get("role", "PARENT"),
        is_active=user_doc.get("is_active", True),
        created_at=created_at
    )

    return TokenResponse(access_token=token, user=user_response)


@router.get("/me", response_model=UserResponse)
async def get_me(
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get current user profile"""
    user_doc = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="المستخدم غير موجود"
        )
    
    created_at = user_doc.get("created_at")
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at)
        except ValueError:
            created_at = datetime.now(timezone.utc)
    if not isinstance(created_at, datetime):
        created_at = datetime.now(timezone.utc)

    return UserResponse(
        user_id=user_doc["user_id"],
        email=user_doc["email"],
        display_name=user_doc["display_name"],
        phone=user_doc.get("phone"),
        role=user_doc["role"],
        is_active=user_doc.get("is_active", True),
        created_at=created_at
    )


@router.post("/staff", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_staff(
    user_data: UserCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create staff user (ADMIN only)"""
    if current_user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="ليس لديك صلاحية لإضافة موظفين"
        )
    
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="البريد الإلكتروني مستخدم بالفعل"
        )
    
    # Hash password
    password_hash = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    
    # Create user with specified role
    user = User(
        email=user_data.email.lower(),
        password_hash=password_hash,
        display_name=user_data.display_name,
        phone=user_data.phone,
        role=user_data.role  # Allow any role
    )
    
    user_dict = user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    return UserResponse(
        user_id=user.user_id,
        email=user.email,
        display_name=user.display_name,
        phone=user.phone,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )
