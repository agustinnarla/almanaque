"""Spec 057: compare-campaigns with an optional range for side B (week vs week)."""
import pytest

from test_api import client, memory_conn  # noqa: F401  (fixtures)

WEEK_A = {"start_date": "2026-09-14", "end_date": "2026-09-20"}
WEEK_B = {"start_date_b": "2026-09-21", "end_date_b": "2026-09-27"}


def seed(conn):
    # fecha, hora, campaign, base, device, total, agents, machines, busy, congestion
    rows = [
        ("2026-09-14", 10, "35", "80", "IPLAN", 400, 20, 100, 10, 4),
        ("2026-09-15", 11, "35", "80", "IPLAN", 600, 30, 150, 12, 6),
        ("2026-09-21", 10, "35", "80", "IPLAN", 500, 40, 100, 5, 5),
        ("2026-09-22", 11, "35", "80", "GW37", 300, 30, 60, 3, 3),
    ]
    for row in rows:
        conn.execute(
            "INSERT INTO daily_campaign_metrics VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)", row
        )
    conn.commit()


def test_same_campaign_two_weeks_uses_each_range(client, memory_conn):  # noqa: F811
    seed(memory_conn)
    params = {"campaign_a": "35", "campaign_b": "35", "min_calls": 1, **WEEK_A, **WEEK_B}

    data = client.get("/api/campaigns/compare-campaigns", params=params).json()

    assert (data["start_date"], data["end_date"]) == ("2026-09-14", "2026-09-20")
    assert (data["start_date_b"], data["end_date_b"]) == ("2026-09-21", "2026-09-27")
    summary = data["summary"]
    assert (summary["total_calls_a"], summary["total_calls_b"]) == (1000, 800)
    assert summary["agent_answer_rate_a"] == pytest.approx(50 / 1000)
    assert summary["agent_answer_rate_b"] == pytest.approx(70 / 800)
    assert [d["fecha"] for d in data["daily_a"]] == ["2026-09-14", "2026-09-15"]
    assert [d["fecha"] for d in data["daily_b"]] == ["2026-09-21", "2026-09-22"]
    assert {d["device"] for d in data["devices_b"]} == {"IPLAN", "GW37"}
    assert [g["device"] for g in data["gateways_comparison"]] == ["IPLAN"]
    assert data["bases_comparison"][0]["total_calls_a"] == 1000
    assert data["bases_comparison"][0]["total_calls_b"] == 800


def test_without_range_b_side_b_uses_range_a(client, memory_conn):  # noqa: F811
    seed(memory_conn)
    params = {"campaign_a": "35", "campaign_b": "35", "min_calls": 1, **WEEK_A}

    data = client.get("/api/campaigns/compare-campaigns", params=params).json()

    assert (data["start_date_b"], data["end_date_b"]) == ("2026-09-14", "2026-09-20")
    assert data["summary"]["total_calls_a"] == data["summary"]["total_calls_b"] == 1000


def test_diagnostics_and_recommendations_use_range_b(client, memory_conn):  # noqa: F811
    seed(memory_conn)
    params = {"campaign_a": "35", "campaign_b": "35", "min_calls": 1, **WEEK_A, **WEEK_B}

    diagnostics = client.get("/api/campaigns/compare-campaigns/diagnostics", params=params).json()
    assert diagnostics["summary"]["total_calls_b"] == 800
    assert diagnostics["start_date_b"] == "2026-09-21"
    # AA 5% → 8.75%: the base improves by 3.75 pp, above the success threshold.
    assert any(event["type"] == "BASE_IMPROVEMENT" for event in diagnostics["positive_drivers"])

    recommendations = client.get(
        "/api/campaigns/compare-campaigns/recommendations", params=params
    ).json()
    assert recommendations["end_date_b"] == "2026-09-27"
    routing = [r for r in recommendations["recommendations"] if r["type"] == "ROUTING"]
    # Only week B has GW37: a recommendation built on range A could not name it.
    assert routing and routing[0]["entity"] == "GW37"
