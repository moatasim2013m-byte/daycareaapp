from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from services.dev_seed_service import DevSeedService

router = APIRouter(prefix="/dev", tags=["Development"])


def get_db():
    from server import db
    return db


@router.post("/seed")
async def seed_dev_data(db: AsyncIOMotorDatabase = Depends(get_db)):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not available",
        )

    result = await DevSeedService(db).seed()
    if not result["allowed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=result["message"],
        )

    return {
        "success": True,
        "message": "Development seed completed",
        "created": result["created"],
    }
