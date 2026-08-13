from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from db import db
from schemas import Run, RunCreate, RunFinish, StuckCreate, StuckEvent

router = APIRouter(prefix="/api", tags=["runs"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/runs")
async def create_run(payload: RunCreate):
    run = Run(**payload.model_dump())
    await db.runs.insert_one(run.model_dump())
    return run.model_dump()


@router.post("/runs/{run_id}/finish")
async def finish_run(run_id: str, payload: RunFinish):
    doc = await db.runs.find_one({"id": run_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "run not found")
    await db.runs.update_one(
        {"id": run_id},
        {"$set": {"finished_at": _now(), "step_durations": payload.step_durations}},
    )
    return await db.runs.find_one({"id": run_id}, {"_id": 0})


@router.post("/stuck")
async def create_stuck(payload: StuckCreate):
    ev = StuckEvent(**payload.model_dump())
    await db.stuck_events.insert_one(ev.model_dump())
    return ev.model_dump()
