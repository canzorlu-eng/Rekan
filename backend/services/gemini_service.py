"""Gemini integration (server-side only). Every call validates into Pydantic and
has a deterministic fallback so a Gemini outage never produces a blank screen."""
import json
import logging
import os
import re
import tempfile
import uuid

from emergentintegrations.llm.chat import (
    FileContentWithMimeType,
    LlmChat,
    UserMessage,
)

from pictograms import PICTOGRAMS
from services.validation import count_words, validate_steps

logger = logging.getLogger(__name__)

# SPEC §7 wants gemini-3.6-flash / gemini-3.5-flash-lite. Those IDs are not
# available via the Emergent universal key, so per CLAUDE.md's fallback rule we
# map to the closest available IDs (logged in DECISIONS.md).
MODEL_FLASH = "gemini-3.5-flash"
MODEL_LITE = "gemini-2.5-flash-lite"

_KEY = os.environ.get("EMERGENT_LLM_KEY", "")


def _chat(system: str, model: str) -> LlmChat:
    return LlmChat(
        api_key=_KEY, session_id=str(uuid.uuid4()), system_message=system
    ).with_model("gemini", model)


def _extract_json(text: str):
    if not text:
        raise ValueError("empty response")
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]
    return json.loads(text)


def _split_sentences(text: str):
    parts = re.split(r"(?<=[.!?])\s+|\n+|;\s*", text or "")
    return [p.strip(" -•\t") for p in parts if p.strip(" -•\t")]


def _clamp_words(text: str, limit: int = 12) -> str:
    words = (text or "").strip().split()
    return " ".join(words[:limit])


# ---------------------------------------------------------------- SOP -> card
_SOP_SYSTEM = (
    "You are Rekan, a job coach that turns messy workplace procedures into an "
    "accessible step-by-step task card for frontline workers, including workers "
    "with disabilities. Rules you MUST follow strictly:\n"
    "- Break the procedure into 3 to 12 steps, ONE action per step.\n"
    "- Each instruction is ONE sentence, maximum 12 words, plain Indonesian at "
    "roughly A1 level, present tense, no jargon, no idioms.\n"
    "- Add a short 'check yourself' line to every step (how the worker knows it "
    "is done right).\n"
    "- Mark any dangerous step with safety=true (hot surfaces, blades, "
    "electricity, chemicals).\n"
    "- Give every step a pictogram key from this list ONLY: "
    + ", ".join(PICTOGRAMS)
    + ".\n"
    "- Provide BOTH Indonesian ('id') and English ('en') for every text field.\n"
    "Return ONLY valid JSON, no markdown, matching exactly:\n"
    '{"title":{"id":"","en":""},"category":"","estimated_minutes":0,'
    '"steps":[{"order":1,"title":{"id":"","en":""},'
    '"instruction":{"id":"","en":""},"check":{"id":"","en":""},'
    '"pictogram":"cup","safety":false}]}'
)


def _fallback_card(source_text: str) -> dict:
    sentences = _split_sentences(source_text)
    if len(sentences) < 3:
        sentences = (sentences + [
            "Mulai tugas", "Lakukan langkah", "Selesaikan tugas",
        ])[:3]
    sentences = sentences[:12]
    steps = []
    for i, s in enumerate(sentences):
        instr = _clamp_words(s)
        steps.append({
            "order": i + 1,
            "title": {"id": _clamp_words(s, 4), "en": _clamp_words(s, 4)},
            "instruction": {"id": instr, "en": instr},
            "check": {"id": "Periksa hasilnya.", "en": "Check the result."},
            "pictogram": "check",
            "safety": False,
        })
    return {
        "title": {"id": "Kartu Tugas Baru", "en": "New Task Card"},
        "category": "umum",
        "estimated_minutes": len(steps),
        "steps": steps,
        "_fallback": True,
    }


def _normalize_card(data: dict) -> dict:
    steps = data.get("steps") or []
    norm = []
    for i, st in enumerate(steps):
        instr = st.get("instruction") or {}
        pg = (st.get("pictogram") or "check").strip()
        if pg not in PICTOGRAMS:
            pg = "check"
        norm.append({
            "order": i + 1,
            "title": st.get("title") or {"id": "", "en": ""},
            "instruction": {
                "id": _clamp_words(instr.get("id", "")),
                "en": _clamp_words(instr.get("en", "")),
            },
            "check": st.get("check") or {"id": "", "en": ""},
            "pictogram": pg,
            "safety": bool(st.get("safety", False)),
        })
    data["steps"] = norm
    if not data.get("estimated_minutes"):
        data["estimated_minutes"] = max(len(norm), 1)
    return data


async def sop_to_taskcard(
    source_text: str = "", file_path: str = None, mime_type: str = None
) -> dict:
    """Multimodal SOP -> structured card dict. Never raises; always returns a card."""
    if not _KEY:
        return _fallback_card(source_text)

    user_text = (
        "Convert this workplace procedure into a Rekan task card. "
        "Source procedure:\n" + (source_text or "(see attached file)")
    )
    file_contents = None
    if file_path and mime_type:
        file_contents = [FileContentWithMimeType(mime_type=mime_type, file_path=file_path)]

    for attempt in range(2):
        try:
            chat = _chat(_SOP_SYSTEM, MODEL_FLASH)
            msg = UserMessage(text=user_text, file_contents=file_contents)
            raw = await chat.send_message(msg)
            data = _normalize_card(_extract_json(raw))
            errors = validate_steps(data["steps"])
            if errors:
                if attempt == 0:
                    user_text += "\n\nFix these problems and return JSON again: " + "; ".join(errors)
                    continue
                logger.warning("SOP card still invalid after retry: %s", errors)
                return _fallback_card(source_text)
            return data
        except Exception as exc:  # noqa: BLE001
            logger.warning("sop_to_taskcard attempt %s failed: %s", attempt, exc)
    return _fallback_card(source_text)


# ---------------------------------------------------------------- simplify
async def simplify_step(text: str, lang: str = "id") -> str:
    lang_name = "Indonesian" if lang == "id" else "English"
    if not _KEY or not text.strip():
        return _clamp_words(text, 10)
    system = (
        f"Rewrite the worker instruction in simpler {lang_name}. One short sentence, "
        "maximum 10 words, present tense, no jargon. Return only the sentence."
    )
    try:
        chat = _chat(system, MODEL_LITE)
        out = await chat.send_message(UserMessage(text=text))
        out = (out or "").strip().strip('"')
        return _clamp_words(out, 12) if out else _clamp_words(text, 10)
    except Exception as exc:  # noqa: BLE001
        logger.warning("simplify_step failed: %s", exc)
        return _clamp_words(text, 10)


# ---------------------------------------------------------------- translate
async def translate_text(text: str, target: str) -> str:
    target_name = "Indonesian" if target == "id" else "English"
    if not _KEY or not text.strip():
        return text
    system = (
        f"Translate the text to {target_name}. Keep it short and plain. "
        "Return only the translation, no quotes."
    )
    try:
        chat = _chat(system, MODEL_LITE)
        out = await chat.send_message(UserMessage(text=text))
        return (out or "").strip().strip('"') or text
    except Exception as exc:  # noqa: BLE001
        logger.warning("translate_text failed: %s", exc)
        return text


# ---------------------------------------------------------------- suggestions
_SUGGEST_SYSTEM = (
    "You suggest concrete, workplace-realistic changes to a job INSTRUCTION or the "
    "JOB itself so it is easier to follow. You are given a step and how often "
    "workers got stuck on it. Output 1 short suggestion, max 20 words, phrased as a "
    "change to the instruction or the workplace. "
    "NEVER diagnose, NEVER make medical claims, NEVER imply the worker is "
    "deficient or slow. Rate the instruction, never the worker. "
    'Return ONLY JSON: {"id":"","en":""}'
)


async def suggest_accommodation(step_text: str, stuck_count: int, lang: str = "id") -> dict:
    fallback = {
        "id": "Tambahkan foto dan pecah langkah ini menjadi dua bagian lebih kecil.",
        "en": "Add a photo and split this step into two smaller parts.",
    }
    if not _KEY:
        return fallback
    user = (
        f"Step instruction: {step_text}\n"
        f"Workers got stuck here {stuck_count} times. Suggest an improvement."
    )
    try:
        chat = _chat(_SUGGEST_SYSTEM, MODEL_FLASH)
        raw = await chat.send_message(UserMessage(text=user))
        data = _extract_json(raw)
        if isinstance(data.get("id"), str) and isinstance(data.get("en"), str):
            return {"id": data["id"], "en": data["en"]}
    except Exception as exc:  # noqa: BLE001
        logger.warning("suggest_accommodation failed: %s", exc)
    return fallback


def save_upload_tmp(data: bytes, suffix: str) -> str:
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    return path
