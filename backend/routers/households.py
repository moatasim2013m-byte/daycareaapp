from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
from models.household import Household, HouseholdCreate, HouseholdUpdate, HouseholdResponse
from middleware.auth import get_current_user

router = APIRouter(prefix="/households", tags=["Households"])


def get_db():
    from server import db
    return db




def _ensure_list(value):
    return value if isinstance(value, list) else []


def _normalize_household_payload(payload: dict) -> dict:
    payload["children"] = _ensure_list(payload.get("children"))
    payload["authorized_pickups"] = _ensure_list(payload.get("authorized_pickups"))
    payload["memberships"] = _ensure_list(payload.get("memberships"))
    payload["payment_methods"] = _ensure_list(payload.get("payment_methods"))
    return payload


@router.get("", response_model=List[HouseholdResponse])
async def list_households(
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    households = await db.households.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    parsed = []
    for household in households:
        if isinstance(household.get("created_at"), str):
            household["created_at"] = datetime.fromisoformat(household["created_at"])
        if isinstance(household.get("updated_at"), str):
            household["updated_at"] = datetime.fromisoformat(household["updated_at"])
        parsed.append(HouseholdResponse(**_normalize_household_payload(household)))
    return parsed


@router.post("", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
async def create_household(
    household_data: HouseholdCreate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    household = Household(**household_data.model_dump())
    document = _normalize_household_payload(household.model_dump())
    document["created_at"] = document["created_at"].isoformat()
    document["updated_at"] = document["updated_at"].isoformat()

    await db.households.insert_one(document)
    return HouseholdResponse(**household.model_dump())


@router.get("/{household_id}", response_model=HouseholdResponse)
async def get_household(
    household_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    household = await db.households.find_one({"household_id": household_id}, {"_id": 0})
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    if isinstance(household.get("created_at"), str):
        household["created_at"] = datetime.fromisoformat(household["created_at"])
    if isinstance(household.get("updated_at"), str):
        household["updated_at"] = datetime.fromisoformat(household["updated_at"])
    return HouseholdResponse(**_normalize_household_payload(household))


@router.patch("/{household_id}", response_model=HouseholdResponse)
async def update_household(
    household_id: str,
    updates: HouseholdUpdate,
    user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    existing = await db.households.find_one({"household_id": household_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    update_data = updates.model_dump(exclude_unset=True)
    for field in ["children", "authorized_pickups", "memberships", "payment_methods"]:
        if field in update_data:
            update_data[field] = _ensure_list(update_data[field])
    if update_data:
        update_data["updated_at"] = datetime.utcnow().isoformat()
        await db.households.update_one({"household_id": household_id}, {"$set": update_data})

    updated = await db.households.find_one({"household_id": household_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    if isinstance(updated.get("updated_at"), str):
        updated["updated_at"] = datetime.fromisoformat(updated["updated_at"])
    return HouseholdResponse(**_normalize_household_payload(updated))
