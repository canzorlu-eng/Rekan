import os
import random
import string
from datetime import datetime, timezone

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from db import db
from schemas import (
    GenerateFromTextRequest,
    SimplifyRequest,
    TaskCard,
    TranslateRequest,
)
from services import gemini_service as ai

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _join_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _persist_draft(business_id: str, data: dict) -> dict:
    card = TaskCard(
        business_id=business_id,
        title=data.get("title", {"id": "", "en": ""}),
        category=data.get("category", ""),
        estimated_minutes=data.get("estimated_minutes", len(data.get("steps", []))),
        steps=data.get("steps", []),
        status="draft",
        join_code=_join_code(),
    )
    doc = card.model_dump()
    doc["ai_fallback"] = bool(data.get("_fallback"))
    await db.task_cards.insert_one(doc)
    return await db.task_cards.find_one({"id": card.id}, {"_id": 0})


@router.post("/generate")
async def generate_from_text(payload: GenerateFromTextRequest):
    data = await ai.sop_to_taskcard(source_text=payload.text)
    return await _persist_draft(payload.business_id, data)


@router.post("/generate_upload")
async def generate_from_upload(
    business_id: str = Form(...),
    text: str = Form(""),
    file: UploadFile = File(None),
):
    file_path = None
    mime = None
    if file is not None:
        content = await file.read()
        mime = file.content_type or "application/octet-stream"
        suffix = os.path.splitext(file.filename or "")[1] or ".bin"
        file_path = ai.save_upload_tmp(content, suffix)
    try:
        data = await ai.sop_to_taskcard(
            source_text=text, file_path=file_path, mime_type=mime
        )
    finally:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    return await _persist_draft(business_id, data)


@router.post("/simplify")
async def simplify(payload: SimplifyRequest):
    text = await ai.simplify_step(payload.text, payload.lang)
    return {"text": text}


@router.post("/translate")
async def translate(payload: TranslateRequest):
    text = await ai.translate_text(payload.text, payload.target)
    return {"text": text}


@router.post("/task_cards/{card_id}/steps/{order}/simplify")
async def simplify_step_cached(card_id: str, order: int, lang: str = "id"):
    card = await db.task_cards.find_one({"id": card_id}, {"_id": 0})
    if not card:
        raise HTTPException(404, "task card not found")
    steps = card.get("steps", [])
    step = next((s for s in steps if s.get("order") == order), None)
    if step is None:
        raise HTTPException(404, "step not found")

    simplified = step.get("simplified") or {}
    if simplified.get(lang):
        return {"text": simplified[lang], "cached": True}

    source = (step.get("instruction") or {}).get(lang, "")
    text = await ai.simplify_step(source, lang)
    simplified = {**simplified, lang: text}
    for i, s in enumerate(steps):
        if s.get("order") == order:
            steps[i]["simplified"] = simplified
    await db.task_cards.update_one(
        {"id": card_id}, {"$set": {"steps": steps, "updated_at": _now()}}
    )
    return {"text": text, "cached": False}


@router.post("/task_cards/{card_id}/steps/{order}/suggest")
async def suggest_for_step(card_id: str, order: int):
    card = await db.task_cards.find_one({"id": card_id}, {"_id": 0})
    if not card:
        raise HTTPException(404, "task card not found")
    step = next((s for s in card.get("steps", []) if s.get("order") == order), None)
    if step is None:
        raise HTTPException(404, "step not found")
    stuck_count = await db.stuck_events.count_documents(
        {"task_card_id": card_id, "step_order": order}
    )
    instruction = (step.get("instruction") or {}).get("id", "")
    text = await ai.suggest_accommodation(instruction, stuck_count)
    from schemas import Suggestion

    sug = Suggestion(task_card_id=card_id, step_order=order, text=text)
    await db.suggestions.insert_one(sug.model_dump())
    return sug.model_dump()
