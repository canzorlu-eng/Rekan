import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from services.aggregation import step_medians, stuck_rates, total_time_medians


def test_stuck_rates_basic():
    runs = [{"id": "r1"}, {"id": "r2"}]
    stuck = [
        {"step_order": 1, "kind": "simpler"},
        {"step_order": 1, "kind": "picture"},
        {"step_order": 3, "kind": "ask"},
    ]
    agg = stuck_rates(3, runs, stuck)
    assert agg["counts"] == [2, 0, 1]
    assert agg["rates"] == [1.0, 0.0, 0.5]
    assert agg["kinds"][0]["simpler"] == 1
    assert agg["kinds"][0]["picture"] == 1
    assert agg["total_runs"] == 2


def test_stuck_rates_no_runs():
    agg = stuck_rates(2, [], [{"step_order": 1, "kind": "ask"}])
    assert agg["total_runs"] == 0
    assert agg["counts"] == [1, 0]


def test_stuck_ignores_out_of_range():
    agg = stuck_rates(2, [{"id": "r"}], [{"step_order": 9, "kind": "ask"}])
    assert agg["counts"] == [0, 0]


def test_step_medians():
    runs = [
        {"step_durations": [10, 20, 30]},
        {"step_durations": [20, 40, 60]},
        {"step_durations": [30, 60, 90]},
    ]
    assert step_medians(3, runs) == [20.0, 40.0, 60.0]


def test_step_medians_empty():
    assert step_medians(3, []) == [0.0, 0.0, 0.0]


def test_total_time_medians_improvement():
    runs = [
        {"started_at": "2026-01-01", "finished_at": "x", "step_durations": [50, 50]},
        {"started_at": "2026-01-05", "finished_at": "x", "step_durations": [20, 20]},
    ]
    impact = total_time_medians(runs)
    assert impact["completion_count"] == 2
    assert impact["first_run_seconds"] == 100.0
    assert impact["latest_run_seconds"] == 40.0
