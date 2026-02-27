from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.child import Child, ChildCreate, ChildUpdate, ChildResponse
from middleware.auth import get_current_user, require_role
from datetime import datetime, timezone, date

router = APIRouter(prefix="/children", tags=["Children"])


def get_db():
    from server import db
    return db


def calculate_age(birth_date: date) -> int:
    """Calculate age in years from birth date"""
    today = date.today()
    return today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))


@router.get("", response_model=List[ChildResponse])
async def list_children(
    guardian_id: Optional[str] = None,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List children.
    - PARENT: Only their own children
    - STAFF/ADMIN: All children or filter by guardian_id
    """
    query = {}
    
    if user.get("role") == "PARENT":
        query["guardian_id"] = user["user_id"]
    elif guardian_id:
        query["guardian_id"] = guardian_id
    
    children = await db.children.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for child in children:
        if isinstance(child.get("created_at"), str):
            child["created_at"] = datetime.fromisoformat(child["created_at"])
        if isinstance(child.get("birth_date"), str):
            child["birth_date"] = date.fromisoformat(child["birth_date"])
        
        child["age_years"] = calculate_age(child["birth_date"])
        result.append(ChildResponse(**child))
    
    return result


@router.post("", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def create_child(
    child_data: ChildCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a child profile (for current parent user)"""
    # For parents, always use their own user_id as guardian_id
    guardian_id = user["user_id"]
    
    child = Child(
        guardian_id=guardian_id,
        full_name=child_data.full_name,
        birth_date=child_data.birth_date,
        medical_notes=child_data.medical_notes
    )
    
    child_dict = child.model_dump()
    child_dict["created_at"] = child_dict["created_at"].isoformat()
    child_dict["updated_at"] = child_dict["updated_at"].isoformat()
    child_dict["birth_date"] = child_dict["birth_date"].isoformat()
    
    await db.children.insert_one(child_dict)
    
    response = ChildResponse(**child.model_dump())
    response.age_years = calculate_age(child.birth_date)
    return response


@router.get("/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get child details"""
    child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطفل غير موجود"
        )
    
    # Parents can only view their own children
    if user.get("role") == "PARENT" and child.get("guardian_id") != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مصرح"
        )
    
    if isinstance(child.get("created_at"), str):
        child["created_at"] = datetime.fromisoformat(child["created_at"])
    if isinstance(child.get("birth_date"), str):
        child["birth_date"] = date.fromisoformat(child["birth_date"])
    
    child["age_years"] = calculate_age(child["birth_date"])
    return ChildResponse(**child)


@router.patch("/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: str,
    updates: ChildUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update child profile"""
    child = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الطفل غير موجود"
        )
    
    # Parents can only update their own children
    if user.get("role") == "PARENT" and child.get("guardian_id") != user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="غير مصرح"
        )
    
    update_data = {}
    if updates.full_name:
        update_data["full_name"] = updates.full_name
    if updates.birth_date:
        update_data["birth_date"] = updates.birth_date.isoformat()
    if updates.medical_notes is not None:
        update_data["medical_notes"] = updates.medical_notes
    if updates.is_active is not None:
        update_data["is_active"] = updates.is_active
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.children.update_one(
            {"child_id": child_id},
            {"$set": update_data}
        )
    
    # Get updated child
    updated = await db.children.find_one({"child_id": child_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    if isinstance(updated.get("birth_date"), str):
        updated["birth_date"] = date.fromisoformat(updated["birth_date"])
    
    updated["age_years"] = calculate_age(updated["birth_date"])
    return ChildResponse(**updated)


@router.post("/staff", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def create_child_by_staff(
    child_data: ChildCreate,
    guardian_id: str,
    user: dict = Depends(require_role("ADMIN", "RECEPTION", "STAFF")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a child profile for a specific guardian (staff only)"""
    # Verify guardian exists
    guardian = await db.users.find_one({"user_id": guardian_id}, {"_id": 0})
    if not guardian:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ولي الأمر غير موجود"
        )
    
    child = Child(
        guardian_id=guardian_id,
        full_name=child_data.full_name,
        birth_date=child_data.birth_date,
        medical_notes=child_data.medical_notes
    )
    
    child_dict = child.model_dump()
    child_dict["created_at"] = child_dict["created_at"].isoformat()
    child_dict["updated_at"] = child_dict["updated_at"].isoformat()
    child_dict["birth_date"] = child_dict["birth_date"].isoformat()
    
    await db.children.insert_one(child_dict)
    
    response = ChildResponse(**child.model_dump())
    response.age_years = calculate_age(child.birth_date)
    return response
