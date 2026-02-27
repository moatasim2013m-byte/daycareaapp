from fastapi import APIRouter, HTTPException, status, Depends, Security
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from models.zone import Zone, ZoneCreate, ZoneUpdate, ZoneResponse
from middleware.auth import get_current_user, require_role
from utils.audit import log_audit
from datetime import datetime, timezone

router = APIRouter(prefix="/zones", tags=["Zones"])


def get_db():
    from server import db
    return db


@router.get("", response_model=List[ZoneResponse])
async def list_zones(
    branch_id: Optional[str] = None,
    zone_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    List zones filtered by branch
    """
    query = {}
    
    # Branch filter
    if branch_id:
        query["branch_id"] = branch_id
    elif user.get("role") != "ADMIN":
        # Non-admin must filter by their branch
        if user.get("branch_id"):
            query["branch_id"] = user["branch_id"]
        else:
            return []
    
    # Zone type filter
    if zone_type:
        query["zone_type"] = zone_type
    
    # Status filter
    if status_filter:
        query["status"] = status_filter
    
    zones = await db.zones.find(query, {"_id": 0}).to_list(100)
    
    # Parse datetime strings
    for zone in zones:
        if isinstance(zone.get("created_at"), str):
            zone["created_at"] = datetime.fromisoformat(zone["created_at"])
    
    return [ZoneResponse(**zone) for zone in zones]


@router.post("", response_model=ZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_zone(
    zone_data: ZoneCreate,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Create new zone (ADMIN or MANAGER)
    """
    # Manager can only create zones in their branch
    if user.get("role") == "MANAGER":
        if user.get("branch_id") != zone_data.branch_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only create zones in your assigned branch"
            )
    
    # Verify branch exists
    branch = await db.branches.find_one({"branch_id": zone_data.branch_id})
    if not branch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Branch not found"
        )
    
    zone = Zone(**zone_data.model_dump())
    
    zone_dict = zone.model_dump()
    zone_dict["created_at"] = zone_dict["created_at"].isoformat()
    zone_dict["updated_at"] = zone_dict["updated_at"].isoformat()
    
    await db.zones.insert_one(zone_dict)
    
    # Audit log
    await log_audit(
        db, "ZONE", zone.zone_id, "CREATED",
        user["user_id"], user["role"],
        after_state=zone_dict,
        notes=f"Zone created: {zone.zone_name}"
    )
    
    return ZoneResponse(**zone.model_dump())


@router.get("/{zone_id}", response_model=ZoneResponse)
async def get_zone(
    zone_id: str,
    user: dict = Security(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get zone details
    """
    zone = await db.zones.find_one({"zone_id": zone_id}, {"_id": 0})
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone not found"
        )
    
    # Non-admin can only view zones in their branch
    if user.get("role") != "ADMIN":
        if user.get("branch_id") != zone.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    if isinstance(zone.get("created_at"), str):
        zone["created_at"] = datetime.fromisoformat(zone["created_at"])
    
    return ZoneResponse(**zone)


@router.patch("/{zone_id}", response_model=ZoneResponse)
async def update_zone(
    zone_id: str,
    updates: ZoneUpdate,
    user: dict = Depends(require_role("ADMIN", "MANAGER")),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Update zone (ADMIN or assigned MANAGER)
    """
    # Get current state
    existing = await db.zones.find_one({"zone_id": zone_id}, {"_id": 0})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Zone not found"
        )
    
    # Manager can only update zones in their branch
    if user.get("role") == "MANAGER":
        if user.get("branch_id") != existing.get("branch_id"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only update zones in your assigned branch"
            )
    
    # Update fields
    update_data = {k: v for k, v in updates.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.zones.update_one(
            {"zone_id": zone_id},
            {"$set": update_data}
        )
        
        # Audit log
        await log_audit(
            db, "ZONE", zone_id, "UPDATED",
            user["user_id"], user["role"],
            before_state=existing,
            after_state=update_data,
            notes="Zone updated"
        )
    
    # Get updated zone
    updated_zone = await db.zones.find_one({"zone_id": zone_id}, {"_id": 0})
    
    if isinstance(updated_zone.get("created_at"), str):
        updated_zone["created_at"] = datetime.fromisoformat(updated_zone["created_at"])
    
    return ZoneResponse(**updated_zone)