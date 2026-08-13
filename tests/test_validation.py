import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from services.validation import count_words, is_valid, validate_steps


def _step(order, instr_id="Ambil gelas bersih.", instr_en="Take a clean glass.", pg="cup"):
    return {
        "order": order,
        "title": {"id": "t", "en": "t"},
        "instruction": {"id": instr_id, "en": instr_en},
        "check": {"id": "c", "en": "c"},
        "pictogram": pg,
        "safety": False,
    }


def test_count_words():
    assert count_words("satu dua tiga") == 3
    assert count_words("") == 0
    assert count_words("   ") == 0


def test_valid_card():
    steps = [_step(i) for i in range(1, 6)]
    assert is_valid(steps)
    assert validate_steps(steps) == []


def test_too_few_steps():
    steps = [_step(1), _step(2)]
    errors = validate_steps(steps)
    assert any("3-12 steps" in e for e in errors)


def test_too_many_steps():
    steps = [_step(i) for i in range(1, 14)]
    errors = validate_steps(steps)
    assert any("3-12 steps" in e for e in errors)


def test_instruction_too_long():
    long = "satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas duabelas tigabelas"
    steps = [_step(1, instr_id=long), _step(2), _step(3)]
    errors = validate_steps(steps)
    assert any("13 words" in e for e in errors)


def test_missing_pictogram():
    steps = [_step(1, pg=""), _step(2), _step(3)]
    errors = validate_steps(steps)
    assert any("missing a pictogram" in e for e in errors)
