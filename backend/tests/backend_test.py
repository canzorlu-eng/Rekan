"""Backend API tests for Rekan."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fall back to reading frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---- Health ----
def test_health(client):
    r = client.get(f"{API}")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---- Businesses & seed ----
def test_list_businesses_seeded(client):
    r = client.get(f"{API}/businesses")
    assert r.status_code == 200
    names = {b["name"] for b in r.json()}
    assert {"Kopi Rekan", "Laundry Bersih", "Toko Ritel Maju"}.issubset(names)


def test_list_task_cards_seeded(client):
    r = client.get(f"{API}/task_cards")
    assert r.status_code == 200
    cards = r.json()
    ids = {c["id"]: c for c in cards}
    assert "card-kopi" in ids and "card-laundry" in ids and "card-ritel" in ids
    assert len(ids["card-kopi"]["steps"]) == 9
    assert len(ids["card-laundry"]["steps"]) == 7
    assert len(ids["card-ritel"]["steps"]) == 6
    # all published
    for cid in ("card-kopi", "card-laundry", "card-ritel"):
        assert ids[cid]["status"] == "published"


def test_get_card_kopi_bilingual(client):
    r = client.get(f"{API}/task_cards/card-kopi")
    assert r.status_code == 200
    card = r.json()
    assert card["title"]["id"] and card["title"]["en"]
    for s in card["steps"]:
        assert s["instruction"]["id"] and s["instruction"]["en"]


# ---- Business & taskcard CRUD ----
def test_create_business(client):
    r = client.post(f"{API}/businesses", json={"name": "TEST_Warung", "sector": "food", "city": "Jakarta"})
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "TEST_Warung"
    assert "id" in data


def test_create_and_update_task_card(client):
    r = client.post(f"{API}/task_cards", json={
        "business_id": "biz-kopi",
        "title": {"id": "TEST kartu", "en": "TEST card"},
        "steps": [],
    })
    assert r.status_code == 200
    cid = r.json()["id"]
    # update steps
    steps = [
        {"order": i + 1, "title": {"id": f"j{i}", "en": f"e{i}"},
         "instruction": {"id": "cuci tangan bersih", "en": "wash hands clean"},
         "check": {"id": "ok", "en": "ok"}, "pictogram": "check", "safety": False}
        for i in range(3)
    ]
    r2 = client.put(f"{API}/task_cards/{cid}", json={"steps": steps})
    assert r2.status_code == 200
    assert len(r2.json()["steps"]) == 3
    # publish valid
    r3 = client.post(f"{API}/task_cards/{cid}/publish")
    assert r3.status_code == 200, r3.text
    assert r3.json()["status"] == "published"
    # cleanup
    client.delete(f"{API}/task_cards/{cid}")


def test_publish_invalid_returns_422(client):
    # too few steps
    r = client.post(f"{API}/task_cards", json={
        "business_id": "biz-kopi",
        "title": {"id": "X", "en": "X"},
        "steps": [{"order": 1, "title": {"id": "a", "en": "a"},
                   "instruction": {"id": "a b c d e f g h i j k l m n o", "en": "a"},
                   "check": {"id": "ok", "en": "ok"}, "pictogram": "", "safety": False}],
    })
    cid = r.json()["id"]
    r2 = client.post(f"{API}/task_cards/{cid}/publish")
    assert r2.status_code == 422
    detail = r2.json().get("detail") or r2.json()
    # errors list should be present
    if isinstance(detail, dict):
        assert "errors" in detail
        assert len(detail["errors"]) >= 1
    client.delete(f"{API}/task_cards/{cid}")


# ---- AI endpoints (deterministic fallback ensures non-500) ----
def test_ai_generate(client):
    payload = {"business_id": "biz-kopi",
               "text": "Prosedur membuat kopi: giling biji kopi, panaskan air, seduh selama 3 menit, sajikan hangat."}
    r = client.post(f"{API}/ai/generate", json=payload, timeout=120)
    assert r.status_code == 200, r.text
    card = r.json()
    assert 3 <= len(card["steps"]) <= 12
    for s in card["steps"]:
        assert s.get("pictogram")
        for lang in ("id", "en"):
            words = (s["instruction"].get(lang) or "").split()
            assert len(words) <= 12, f"instruction too long: {s['instruction']}"
    # cleanup
    client.delete(f"{API}/task_cards/{card['id']}")


def test_ai_simplify_and_translate(client):
    r = client.post(f"{API}/ai/simplify", json={"text": "Silakan mencuci tangan secara menyeluruh dengan sabun.", "lang": "id"})
    assert r.status_code == 200
    assert "text" in r.json()
    r2 = client.post(f"{API}/ai/translate", json={"text": "Cuci tangan.", "target": "en"})
    assert r2.status_code == 200
    assert "text" in r2.json()


def test_ai_step_simplify_cached(client):
    url = f"{API}/ai/task_cards/card-kopi/steps/4/simplify?lang=id"
    r1 = client.post(url)
    assert r1.status_code == 200, r1.text
    j1 = r1.json()
    assert "text" in j1 and "cached" in j1
    r2 = client.post(url)
    assert r2.status_code == 200
    j2 = r2.json()
    assert j2["cached"] is True


# ---- Runs & stuck ----
def test_run_flow(client):
    r = client.post(f"{API}/runs", json={"worker_id": "TEST_worker", "task_card_id": "card-kopi"})
    assert r.status_code == 200
    rid = r.json()["id"]
    r2 = client.post(f"{API}/runs/{rid}/finish", json={"step_durations": [5, 6, 7]})
    assert r2.status_code == 200
    assert r2.json()["finished_at"]
    r3 = client.post(f"{API}/stuck", json={"run_id": rid, "task_card_id": "card-kopi", "step_order": 4, "kind": "simpler"})
    assert r3.status_code == 200


# ---- Insights ----
def test_insights_card_kopi(client):
    r = client.get(f"{API}/insights/card-kopi")
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["total_runs"] >= 30  # ~40 seeded
    steps = data["steps"]
    counts = {s["order"]: s["stuck_count"] for s in steps}
    # step 4 should be the highest
    assert counts[4] == max(counts.values())
    # step 7 should be non-trivial (medium)
    assert counts[7] >= 1
    assert all(s["median_seconds"] >= 0 for s in steps)
    impact = data["impact"]
    assert impact["first_run_seconds"] > impact["latest_run_seconds"]
    assert len(data["suggestions"]) >= 1


# ---- Demo ----
def test_demo_endpoint(client):
    r = client.get(f"{API}/demo")
    assert r.status_code == 200
    d = r.json()
    assert d["card"]["id"] == "card-kopi"
    assert "simpler" in d and "script" in d
    assert len(d["script"]) >= 9
