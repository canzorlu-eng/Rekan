import random
import string
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from db import db
from schemas import TaskCard, TaskCardCreate, TaskCardUpdate
from services.validation import validate_steps

router = APIRouter(prefix="/api/task_cards", tags=["task_cards"])


def _join_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.get("")
async def list_cards(business_id: str = None, status: str = None):
    query = {}
    if business_id:
        query["business_id"] = business_id
    if status:
        query["status"] = status
    return await db.task_cards.find(query, {"_id": 0}).to_list(1000)


@router.get("/{card_id}")
async def get_card(card_id: str):
    doc = await db.task_cards.find_one({"id": card_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "task card not found")
    return doc


@router.post("")
async def create_card(payload: TaskCardCreate):
    card = TaskCard(**payload.model_dump(), status="draft", join_code=_join_code())
    await db.task_cards.insert_one(card.model_dump())
    return card.model_dump()


@router.put("/{card_id}")
async def update_card(card_id: str, payload: TaskCardUpdate):
    doc = await db.task_cards.find_one({"id": card_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "task card not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = _now()
    await db.task_cards.update_one({"id": card_id}, {"$set": updates})
    return await db.task_cards.find_one({"id": card_id}, {"_id": 0})


@router.post("/{card_id}/publish")
async def publish_card(card_id: str):
    doc = await db.task_cards.find_one({"id": card_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "task card not found")
    errors = validate_steps(doc.get("steps", []))
    if errors:
        raise HTTPException(422, {"message": "card not valid", "errors": errors})
    join_code = doc.get("join_code") or _join_code()
    await db.task_cards.update_one(
        {"id": card_id},
        {"$set": {"status": "published", "join_code": join_code, "updated_at": _now()}},
    )
    return await db.task_cards.find_one({"id": card_id}, {"_id": 0})


@router.delete("/{card_id}")
async def delete_card(card_id: str):
    await db.task_cards.delete_one({"id": card_id})
    return {"ok": True}
