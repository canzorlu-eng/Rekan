"""Pure stuck-rate + timing aggregation (SPEC §10). Tested in tests/test_aggregation.py."""
from statistics import median
from typing import List


def stuck_rates(num_steps: int, runs: List[dict], stuck_events: List[dict]) -> dict:
    """Aggregate stuck events per step. Rates are per-run (never per-worker)."""
    counts = [0] * num_steps
    kinds = [{"simpler": 0, "picture": 0, "ask": 0} for _ in range(num_steps)]
    for ev in stuck_events:
        order = ev.get("step_order", 0)
        if 1 <= order <= num_steps:
            counts[order - 1] += 1
            kind = ev.get("kind")
            if kind in kinds[order - 1]:
                kinds[order - 1][kind] += 1

    total_runs = len(runs)
    denom = total_runs if total_runs > 0 else 1
    rates = [round(c / denom, 3) for c in counts]

    return {
        "total_runs": total_runs,
        "counts": counts,
        "rates": rates,
        "kinds": kinds,
    }


def step_medians(num_steps: int, runs: List[dict]) -> List[float]:
    """Median duration (seconds) per step across finished runs."""
    per_step: List[List[float]] = [[] for _ in range(num_steps)]
    for run in runs:
        durations = run.get("step_durations") or []
        for i, d in enumerate(durations):
            if i < num_steps and d is not None:
                per_step[i].append(float(d))
    return [round(median(vals), 1) if vals else 0.0 for vals in per_step]


def total_time_medians(runs: List[dict]) -> dict:
    """First-run vs latest-run total time, for the impact strip."""
    finished = [r for r in runs if r.get("finished_at")]
    finished.sort(key=lambda r: r.get("started_at", ""))
    totals = [sum(r.get("step_durations") or []) for r in finished]

    completion_count = len(finished)
    median_total = round(median(totals), 1) if totals else 0.0
    first_total = round(totals[0], 1) if totals else 0.0
    latest_total = round(totals[-1], 1) if totals else 0.0
    return {
        "completion_count": completion_count,
        "median_total_seconds": median_total,
        "first_run_seconds": first_total,
        "latest_run_seconds": latest_total,
    }
