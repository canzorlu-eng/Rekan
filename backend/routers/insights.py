from fastapi import APIRouter, HTTPException

from db import db
from services.aggregation import step_medians, stuck_rates, total_time_medians

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/{task_card_id}")
async def get_insights(task_card_id: str):
    card = await db.task_cards.find_one({"id": task_card_id}, {"_id": 0})
    if not card:
        raise HTTPException(404, "task card not found")

    steps = card.get("steps", [])
    n_steps = len(steps)
    runs = await db.runs.find({"task_card_id": task_card_id}, {"_id": 0}).to_list(5000)
    stuck = await db.stuck_events.find(
        {"task_card_id": task_card_id}, {"_id": 0}
    ).to_list(5000)
    suggestions = await db.suggestions.find(
        {"task_card_id": task_card_id}, {"_id": 0}
    ).to_list(1000)

    agg = stuck_rates(n_steps, runs, stuck)
    medians = step_medians(n_steps, runs)
    impact = total_time_medians(runs)

    step_summaries = []
    for i, st in enumerate(steps):
        step_summaries.append({
            "order": st.get("order", i + 1),
            "title": st.get("title", {}),
            "safety": st.get("safety", False),
            "stuck_count": agg["counts"][i],
            "stuck_rate": agg["rates"][i],
            "stuck_kinds": agg["kinds"][i],
            "median_seconds": medians[i],
        })

    return {
        "task_card_id": task_card_id,
        "title": card.get("title", {}),
        "total_runs": agg["total_runs"],
        "impact": impact,
        "steps": step_summaries,
        "suggestions": suggestions,
    }
