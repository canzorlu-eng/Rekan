from fastapi import APIRouter, HTTPException

from db import db, strip_id
from schemas import Business, BusinessCreate

router = APIRouter(prefix="/api/businesses", tags=["businesses"])


@router.get("")
async def list_businesses():
    docs = await db.businesses.find({}, {"_id": 0}).to_list(1000)
    return docs


@router.post("")
async def create_business(payload: BusinessCreate):
    biz = Business(**payload.model_dump())
    await db.businesses.insert_one(biz.model_dump())
    return biz.model_dump()


@router.get("/{business_id}")
async def get_business(business_id: str):
    doc = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "business not found")
    return doc
