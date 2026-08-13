"""Pure task-card validation (SPEC §5 hard rules). Tested in tests/test_validation.py."""
from typing import List


def count_words(text: str) -> int:
    return len([w for w in (text or "").strip().split() if w])


def validate_steps(steps: List[dict]) -> List[str]:
    """Return a list of human-readable validation errors. Empty list == valid."""
    errors: List[str] = []

    if not (3 <= len(steps) <= 12):
        errors.append(f"card must have 3-12 steps, got {len(steps)}")

    for idx, step in enumerate(steps):
        order = step.get("order", idx + 1)
        instruction = step.get("instruction", {}) or {}
        for lang in ("id", "en"):
            words = count_words(instruction.get(lang, ""))
            if words > 12:
                errors.append(
                    f"step {order} instruction ({lang}) has {words} words (max 12)"
                )
        if not (step.get("pictogram") or "").strip():
            errors.append(f"step {order} is missing a pictogram")

    return errors


def is_valid(steps: List[dict]) -> bool:
    return len(validate_steps(steps)) == 0
