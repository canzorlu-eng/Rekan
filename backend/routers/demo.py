"""Offline demo replay (SPEC §14 / DoD). Returns the café card plus pre-baked
'explain simpler' variants so a full worker run replays with zero Gemini calls."""
from fastapi import APIRouter

from db import db
from services.seed_data import CARDS

# Pre-written simpler restatements, keyed by step order. No AI at demo runtime.
DEMO_SIMPLER = {
    4: {"id": "Tekan tombol satu shot espresso.", "en": "Press the one-shot espresso button."},
    5: {"id": "Panaskan susu sampai hangat saja.", "en": "Heat the milk until just warm."},
    7: {"id": "Aduk 3 kali dengan sendok.", "en": "Stir 3 times with the spoon."},
}

router = APIRouter(prefix="/api/demo", tags=["demo"])


def _kopi_card() -> dict:
    return next(c for c in CARDS if c["id"] == "card-kopi")


@router.get("")
async def demo_payload():
    card = await db.task_cards.find_one({"id": "card-kopi"}, {"_id": 0})
    if not card:
        card = dict(_kopi_card())  # offline insurance if DB not seeded
    return {
        "card": card,
        "simpler": DEMO_SIMPLER,
        "script": [
            {"step": 1, "action": "done"},
            {"step": 2, "action": "done"},
            {"step": 3, "action": "done"},
            {"step": 4, "action": "stuck_simpler"},
            {"step": 4, "action": "done"},
            {"step": 5, "action": "done"},
            {"step": 6, "action": "done"},
            {"step": 7, "action": "stuck_simpler"},
            {"step": 7, "action": "done"},
            {"step": 8, "action": "done"},
            {"step": 9, "action": "done"},
        ],
    }
