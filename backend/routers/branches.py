from fastapi import APIRouter, HTTPException, status, Depends, Security
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.branch import Branch, BranchCreate, BranchUpdate, BranchResponse
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from datetime import datetime, timezone

router = APIRouter(prefix="/branches", tags=["Branches"])


def get_db():
    from server import db
    return db


@router.get("", response_model=List[BranchResponse])
async def list_branches(
    status_filter: Optional[str] = None,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List branches.
    ADMIN: sees all branches
    Other roles: see only assigned branch
    """
    query = {}
    
    # Filter by status if provided
    if status_filter:
        query["status"] = status_filter
    
    # Non-admin users only see their branch
    if user.get("role") != "ADMIN":
        if not user.get("branch_id"):
            return []
        query["branch_id"] = user["branch_id"]
    
    branches = await db.branches.find(query, {"_id": 0}).to_list(100)
    
    # Parse datetime strings
    for branch in branches:
        if isinstance(branch.get("created_at"), str):
            branch["created_at"] = datetime.fromisoformat(branch["created_at"])
    
    return [BranchResponse(**branch) for branch in branches]


@router.post("", response_model=BranchResponse, status_code=status.HTTP_201_CREATED)
async def create_branch(
    branch_data: BranchCreate,
    user: dict = Depends(require_role("ADMIN")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create new branch (ADMIN only)
    """
    branch = Branch(**branch_data.model_dump())
    
    branch_dict = branch.model_dump()
    branch_dict["created_at"] = branch_dict["created_at"].isoformat()
    branch_dict["updated_at"] = branch_dict["updated_at"].isoformat()
    
    await db.branches.insert_one(branch_dict)
    
    # Audit log
    await log_audit(
        db, "BRANCH", branch.branch_id, "CREATED",
        user["user_id"], user["role"],
        after_state=branch_dict,
        notes=f"Branch created: {branch.name}"
    )
    
    return BranchResponse(**branch.model_dump())


@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch(
    branch_id: str,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get branch details
    """
    # Non-admin can only view their own branch
    if user.get("role") != "ADMIN":
        if user.get("branch_id") != branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    branch = await db.branches.find_one({"branch_id": branch_id}, {"_id": 0})
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    
    if isinstance(branch.get("created_at"), str):
        branch["created_at"] = datetime.fromisoformat(branch["created_at"])
    
    return BranchResponse(**branch)


@router.patch("/{branch_id}", response_model=BranchResponse)
async def update_branch(
    branch_id: str,
    updates: BranchUpdate,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update branch (ADMIN or assigned MANAGER)
    """
    # Manager can only update their own branch
    if user.get("role") == "MANAGER":
        if user.get("branch_id") != branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only update your assigned branch"
            )
    
    # Get current state
    existing = await db.branches.find_one({"branch_id": branch_id}, {"_id": 0})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    
    # Update fields
    update_data = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.branches.update_one(
            {"branch_id": branch_id},
            {"$set": update_data}
        )
        
        # Audit log
        await log_audit(
            db, "BRANCH", branch_id, "UPDATED",
            user["user_id"], user["role"],
            before_state=existing,
            after_state=update_data,
            notes="Branch updated"
        )
    
    # Get updated branch
    updated_branch = await db.branches.find_one({"branch_id": branch_id}, {"_id": 0})
    
    if isinstance(updated_branch.get("created_at"), str):
        updated_branch["created_at"] = datetime.fromisoformat(updated_branch["created_at"])
    
    return BranchResponse(**updated_branch)