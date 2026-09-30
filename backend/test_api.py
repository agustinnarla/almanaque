import sqlite3

import pytest
from fastapi.testclient import TestClient

from db_manager import get_db_connection, get_connection, init_db
from main_api import app
from services.pattern_detector import evaluate_campaigns


@pytest.fixture
def memory_conn():
    conn = get_connection(":memory:")
    init_db(conn)
    yield conn
    conn.close()


@pytest.fixture
def client(memory_conn):
    def override_get_db_connection():
        yield memory_conn

    app.dependency_overrides[get_db_connection] = override_get_db_connection
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def seed_metrics(conn: sqlite3.Connection) -> None:
    rows = [
        ("2026-09-01", 9, "35", "34", "GW37", 100, 5, 0, 5, 3, 20.0, 30.0),
        ("2026-09-01", 9, "35", "80", "GW37", 100, 25, 10, 4, 2, 15.0, 25.0),
        ("2026-09-01", 9, "35", "99", "GW20", 50, 0, 50, 1, 0, 10.0, 5.0),
        ("2026-09-01", 10, "35", "34", "GW20", 40, 8, 0, 2, 1, 12.0, 18.0),
        ("2026-09-02", 9, "35", "34", "GW37", 100, 50, 0, 3, 2, 12.0, 18.0),
        ("2026-09-02", 9, "40", "34", "GW37", 80, 40, 0, 2, 1, 9.0, 11.0),
    ]
    conn.executemany(
        """
        INSERT INTO daily_campaign_metrics
            (fecha, hora, campaign, base, device, total_calls, agent_answers,
             machine_answers, busy_calls, congestion_calls,
             avg_wait_time_sec, avg_abandon_time_sec)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()


def test_metrics_empty_range_returns_200_and_empty_list(client):
    response = client.get(
        "/api/metrics",
        params={"start_date": "2030-01-01", "end_date": "2030-01-31"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_metrics_filters_by_date_range(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/metrics",
        params={"start_date": "2026-09-01", "end_date": "2026-09-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert all(row["fecha"] == "2026-09-01" for row in data)
    assert data[0]["base"] == "34"
    assert data[0]["campaign"] == "35"
    assert "hora" in data[0]
    assert data[0]["device"] == "GW37"
    assert set(data[0]) == {
        "fecha",
        "hora",
        "campaign",
        "base",
        "device",
        "total_calls",
        "agent_answers",
        "machine_answers",
        "busy_calls",
        "congestion_calls",
        "avg_wait_time_sec",
        "avg_abandon_time_sec",
    }


def test_metrics_invalid_date_returns_422(client):
    response = client.get(
        "/api/metrics",
        params={"start_date": "no-es-fecha", "end_date": "2026-09-01"},
    )
    assert response.status_code == 422


def test_pattern_detector_alerts_below_threshold():
    alerts = evaluate_campaigns(
        [
            {
                "fecha": "2026-09-01",
                "hora": 9,
                "campaign": "35",
                "base": "A",
                "device": "GW37",
                "total_calls": 100,
                "agent_answers": 4,
                "machine_answers": 0,
            }
        ]
    )
    assert len(alerts) == 1
    assert alerts[0]["pattern_alert"] is True
    assert alerts[0]["campaign"] == "35"
    assert alerts[0]["hora"] == 9
    assert alerts[0]["device"] == "GW37"
    assert alerts[0]["agent_answer_rate"] == pytest.approx(0.04)


def test_pattern_detector_ignores_above_threshold():
    alerts = evaluate_campaigns(
        [{"fecha": "2026-09-01", "base": "B", "total_calls": 100, "agent_answers": 20, "machine_answers": 0}]
    )
    assert alerts == []


def test_pattern_detector_excludes_zero_denominator():
    alerts = evaluate_campaigns(
        [{"fecha": "2026-09-01", "base": "C", "total_calls": 0, "agent_answers": 0, "machine_answers": 0}]
    )
    assert alerts == []


def test_patterns_endpoint_returns_hourly_alerts(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/patterns",
        params={"start_date": "2026-09-01", "end_date": "2026-09-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    alert = next(row for row in data if row["base"] == "99")
    assert alert["fecha"] == "2026-09-01"
    assert alert["campaign"] == "35"
    assert alert["hora"] == 9
    assert alert["device"] == "GW20"
    assert alert["pattern_alert"] is True
    assert isinstance(alert["agent_answer_rate"], float)
    assert alert["agent_answer_rate"] == pytest.approx(0.0)


def test_patterns_endpoint_empty_range(client):
    response = client.get(
        "/api/patterns",
        params={"start_date": "2030-01-01", "end_date": "2030-01-31"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_campaign_summary_sums_bases(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/summary",
        params={"start_date": "2026-09-01", "end_date": "2026-09-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["campaign"] == "35"
    assert data["total_calls"] == 290
    assert data["agent_answers"] == 38
    assert data["machine_answers"] == 60
    assert data["rejected_calls"] == 192
    assert data["agent_answer_rate"] == pytest.approx(38 / 290)


def test_campaign_summary_unknown_campaign_returns_zeros(client):
    response = client.get(
        "/api/campaigns/noexiste/summary",
        params={"start_date": "2026-09-01", "end_date": "2026-09-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_calls"] == 0
    assert data["agent_answer_rate"] is None


def test_campaign_compare_with_both_days(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["date_a"] is not None
    assert data["date_b"] is not None
    assert data["deltas"] is not None
    assert isinstance(data["deltas"]["total_calls"], float)


def test_campaign_compare_missing_day_returns_null(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare",
        params={"date_a": "2026-09-01", "date_b": "2030-01-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["date_a"] is not None
    assert data["date_b"] is None
    assert data["deltas"] is None


def test_campaign_ranking_excludes_zero_denominator_and_sorts(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/bases-ranking",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    bases = [row["base"] for row in data]
    rates = [row["agent_answer_rate"] for row in data]
    assert rates == sorted(rates, reverse=True)
    assert "99" in bases
    assert rates[-1] == pytest.approx(0.0)


def test_campaign_ranking_empty_campaign(client):
    response = client.get(
        "/api/campaigns/noexiste/bases-ranking",
        params={"start_date": "2026-09-01", "end_date": "2026-09-01"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_campaign_ranking_includes_total_calls(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/bases-ranking",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    by_base = {row["base"]: row for row in data}
    assert set(by_base) == {"34", "80", "99"}
    for row in data:
        assert set(row) == {"base", "agent_answer_rate", "total_calls"}
        assert isinstance(row["total_calls"], int)
    assert by_base["34"]["total_calls"] == 240
    assert by_base["80"]["total_calls"] == 100
    assert by_base["99"]["total_calls"] == 50


def test_hourly_trend_sums_counters_across_days(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/hourly-trend",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    horas = [row["hora"] for row in data]
    assert horas == sorted(horas)
    hour_nine = next(row for row in data if row["hora"] == 9)
    assert hour_nine["total_calls"] == 350
    assert hour_nine["agent_answers"] == 80
    assert hour_nine["machine_answers"] == 60
    assert hour_nine["agent_answer_rate"] == pytest.approx(80 / 350)
    assert set(hour_nine) == {
        "hora",
        "total_calls",
        "agent_answers",
        "machine_answers",
        "agent_answer_rate",
    }


def test_hourly_trend_empty_range_returns_200_and_empty_list(client):
    response = client.get(
        "/api/campaigns/35/hourly-trend",
        params={"start_date": "2030-01-01", "end_date": "2030-01-31"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_hourly_trend_unknown_campaign(client):
    response = client.get(
        "/api/campaigns/noexiste/hourly-trend",
        params={"start_date": "2026-09-01", "end_date": "2026-09-01"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_daily_trend_contract_order_and_rates(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/daily",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert [row["fecha"] for row in data] == ["2026-09-01", "2026-09-02"]
    day_one, day_two = data
    assert set(day_one) == {
        "fecha",
        "total_calls",
        "agent_answers",
        "machine_answers",
        "agent_answer_rate",
    }
    assert day_one["total_calls"] == 290
    assert day_one["agent_answers"] == 38
    assert day_one["machine_answers"] == 60
    assert day_one["agent_answer_rate"] == pytest.approx(38 / 290)
    assert day_two["total_calls"] == 100
    assert day_two["agent_answers"] == 50
    assert day_two["agent_answer_rate"] == pytest.approx(50 / 100)


def test_daily_trend_single_day_start_equals_end(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/daily",
        params={"start_date": "2026-09-01", "end_date": "2026-09-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["fecha"] == "2026-09-01"
    assert data[0]["agent_answer_rate"] == pytest.approx(38 / 290)


def test_daily_trend_empty_range_returns_200_and_empty_list(client):
    response = client.get(
        "/api/campaigns/35/daily",
        params={"start_date": "2030-01-01", "end_date": "2030-01-31"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_daily_trend_unknown_campaign(client):
    response = client.get(
        "/api/campaigns/noexiste/daily",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_daily_trend_invalid_date_returns_422(client):
    response = client.get(
        "/api/campaigns/35/daily",
        params={"start_date": "no-es-fecha", "end_date": "2026-09-01"},
    )
    assert response.status_code == 422


def test_devices_endpoint_contract_and_order(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/devices",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    totals = [row["total_calls"] for row in data]
    assert totals == sorted(totals, reverse=True)
    assert data[0]["device"] == "GW37"
    gw37 = next(row for row in data if row["device"] == "GW37")
    assert gw37["total_calls"] == 300
    assert gw37["agent_answers"] == 80
    assert gw37["machine_answers"] == 10
    assert gw37["busy_calls"] == 12
    assert gw37["congestion_calls"] == 7
    assert gw37["agent_answer_rate"] == pytest.approx(80 / 300)
    assert gw37["busy_rate"] == pytest.approx(12 / 300)
    assert gw37["congestion_rate"] == pytest.approx(7 / 300)
    assert set(gw37) == {
        "device",
        "total_calls",
        "agent_answers",
        "machine_answers",
        "busy_calls",
        "congestion_calls",
        "agent_answer_rate",
        "busy_rate",
        "congestion_rate",
    }


def test_devices_endpoint_empty_range_returns_empty_list(client):
    response = client.get(
        "/api/campaigns/35/devices",
        params={"start_date": "2030-01-01", "end_date": "2030-01-31"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_devices_endpoint_unknown_campaign(client):
    response = client.get(
        "/api/campaigns/noexiste/devices",
        params={"start_date": "2026-09-01", "end_date": "2026-09-01"},
    )
    assert response.status_code == 200
    assert response.json() == []


def seed_health_edges(conn: sqlite3.Connection) -> None:
    rows = [
        ("2026-09-01", 11, "35", "34", "GWX", 100, 10, 0, 5, 10, 20.0, 30.0),
        ("2026-09-01", 12, "35", "34", "GW37", 100, 5, 0, 40, 0, 20.0, 30.0),
    ]
    conn.executemany(
        """
        INSERT INTO daily_campaign_metrics
            (fecha, hora, campaign, base, device, total_calls, agent_answers,
             machine_answers, busy_calls, congestion_calls,
             avg_wait_time_sec, avg_abandon_time_sec)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()


def test_device_ranking_best_and_worst(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/devices/ranking",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["min_calls_applied"] == 50
    assert data["limit_applied"] == 5
    best = [row["device"] for row in data["best"]]
    worst = [row["device"] for row in data["worst"]]
    assert best == ["GW37", "GW20"]
    assert worst == ["GW20", "GW37"]
    top = data["best"][0]
    assert top["health_score"] == pytest.approx(
        round((80 / 300 - 0.04 * 0.5 - (7 / 300) * 1.5) * 100, 2)
    )
    assert set(top) == {
        "device",
        "total_calls",
        "agent_answer_rate",
        "busy_rate",
        "congestion_rate",
        "health_score",
    }


def test_device_ranking_min_calls_filters_small_segments(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/devices/ranking",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02", "min_calls": 100},
    )
    assert response.status_code == 200
    data = response.json()
    devices = [row["device"] for row in data["best"]]
    assert devices == ["GW37"]
    assert all(row["device"] == "GW37" for row in data["worst"])


def test_device_ranking_limit_truncates(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/devices/ranking",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02", "limit": 1},
    )
    data = response.json()
    assert data["limit_applied"] == 1
    assert len(data["best"]) == 1
    assert len(data["worst"]) == 1
    assert data["best"][0]["device"] == "GW37"
    assert data["worst"][0]["device"] == "GW20"


def test_device_ranking_empty_range(client):
    response = client.get(
        "/api/campaigns/35/devices/ranking",
        params={"start_date": "2030-01-01", "end_date": "2030-01-31"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["best"] == []
    assert data["worst"] == []


def test_device_ranking_invalid_min_calls_returns_422(client):
    response = client.get(
        "/api/campaigns/35/devices/ranking",
        params={
            "start_date": "2026-09-01",
            "end_date": "2026-09-01",
            "min_calls": 0,
        },
    )
    assert response.status_code == 422


def test_hours_ranking_contract_and_order(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/hours/ranking",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02", "min_calls": 1},
    )
    assert response.status_code == 200
    data = response.json()
    best_hours = [row["hora"] for row in data["best"]]
    worst_hours = [row["hora"] for row in data["worst"]]
    assert best_hours == [9, 10]
    assert worst_hours == [10, 9]
    assert "device" not in data["best"][0]
    assert data["best"][0]["hora"] == 9
    assert data["best"][0]["health_score"] is not None


def test_hours_ranking_min_calls_excludes_small_hour(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/hours/ranking",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02", "min_calls": 50},
    )
    data = response.json()
    assert [row["hora"] for row in data["best"]] == [9]
    assert data["best"][0]["total_calls"] == 350


def test_hours_ranking_empty_range(client):
    response = client.get(
        "/api/campaigns/35/hours/ranking",
        params={"start_date": "2030-01-01", "end_date": "2030-01-31"},
    )
    assert response.status_code == 200
    assert response.json()["best"] == []
    assert response.json()["worst"] == []


def test_diagnostics_detects_peak_hour(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/diagnostics",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["min_calls_applied"] == 50
    assert data["congested_gateways"] == []
    assert data["burn_hours"] == []
    peak = [row["hora"] for row in data["peak_hours"]]
    assert 9 in peak
    alert = next(row for row in data["peak_hours"] if row["hora"] == 9)
    assert alert["agent_answer_rate"] >= 0.06
    assert isinstance(alert["message"], str)
    assert alert["message"]


def test_diagnostics_detects_congestion_and_burn(client, memory_conn):
    seed_metrics(memory_conn)
    seed_health_edges(memory_conn)
    response = client.get(
        "/api/campaigns/35/diagnostics",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    data = response.json()
    congested = [row["device"] for row in data["congested_gateways"]]
    assert "GWX" in congested
    gw = next(row for row in data["congested_gateways"] if row["device"] == "GWX")
    assert gw["congestion_rate"] >= 0.05
    assert "saturación" in gw["message"]
    burn = [row["hora"] for row in data["burn_hours"]]
    assert 12 in burn
    hour12 = next(row for row in data["burn_hours"] if row["hora"] == 12)
    assert hour12["busy_rate"] >= 0.35
    assert "quema" in hour12["message"]


def test_diagnostics_min_calls_ignores_small_volume(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/35/diagnostics",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02", "min_calls": 10000},
    )
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "min_calls_applied": 10000,
        "congested_gateways": [],
        "burn_hours": [],
        "peak_hours": [],
    }


def test_diagnostics_empty_range(client):
    response = client.get(
        "/api/campaigns/35/diagnostics",
        params={"start_date": "2030-01-01", "end_date": "2030-01-31"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["congested_gateways"] == []
    assert data["burn_hours"] == []
    assert data["peak_hours"] == []


def seed_compare_days(conn: sqlite3.Connection) -> None:
    rows = [
        ("2026-09-01", 9, "35", "80", "GW37", 1000, 97, 0, 40, 130, 20.0, 30.0),
        ("2026-09-02", 9, "35", "80", "GW37", 700, 40, 0, 30, 119, 20.0, 30.0),
        ("2026-09-01", 9, "35", "90", "GW37", 400, 80, 0, 20, 20, 20.0, 30.0),
        ("2026-09-02", 9, "35", "90", "GW37", 400, 76, 0, 20, 20, 20.0, 30.0),
    ]
    conn.executemany(
        """
        INSERT INTO daily_campaign_metrics
            (fecha, hora, campaign, base, device, total_calls, agent_answers,
             machine_answers, busy_calls, congestion_calls,
             avg_wait_time_sec, avg_abandon_time_sec)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()


def test_compare_diagnostics_contract(client, memory_conn):
    seed_compare_days(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare/diagnostics",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["campaign"] == "35"
    assert data["date_a"] == "2026-09-01"
    assert data["date_b"] == "2026-09-02"
    assert data["min_calls_applied"] == 50
    summary = data["summary"]
    assert summary["total_calls_a"] == 1400
    assert summary["total_calls_b"] == 1100
    assert summary["delta_total_pct"] == pytest.approx(
        round((1100 - 1400) / 1400 * 100, 2)
    )
    assert summary["agent_answer_rate_a"] == pytest.approx(177 / 1400)
    assert summary["delta_rate"] is not None
    assert isinstance(summary["delta_percentage"], float)
    assert summary["busy_rate_a"] is not None
    assert summary["busy_rate_b"] is not None
    assert summary["congestion_rate"] == summary["congestion_rate_b"]
    assert summary["health_score"] is not None
    assert isinstance(summary["health_score"], float)
    assert isinstance(data["root_causes"], list)
    assert isinstance(data["positive_drivers"], list)
    assert isinstance(data["insights"], list)
    assert len(data["root_causes"]) <= 5
    assert len(data["positive_drivers"]) <= 5
    assert len(data["insights"]) <= 5
    assert all("polarity" in item for item in data["insights"])
    assert all(
        item["polarity"] in {"POSITIVE", "NEGATIVE"} for item in data["insights"]
    )
    assert all(
        c["severity"] in {"CRITICAL", "WARNING"} for c in data["root_causes"]
    )
    assert all(
        p["severity"] in {"SUCCESS", "INFO"} for p in data["positive_drivers"]
    )
    base80 = next(row for row in data["bases_comparison"] if row["base"] == "80")
    assert base80["total_calls_a"] == 1000
    assert base80["total_calls_b"] == 700
    assert base80["delta_rate"] == pytest.approx(40 / 700 - 97 / 1000, abs=1e-6)
    assert any(c["type"] == "BASE_DEGRADATION" for c in data["root_causes"])
    assert any(c["severity"] == "CRITICAL" for c in data["root_causes"])
    assert not any(
        c["type"] == "BASE_DEGRADATION" for c in data["positive_drivers"]
    )
    gw = next(row for row in data["gateways_comparison"] if row["device"] == "GW37")
    assert gw["delta_congestion"] is not None


def seed_compare_recovery(conn: sqlite3.Connection) -> None:
    rows = [
        ("2026-09-01", 9, "35", "80", "GW37", 500, 80, 0, 20, 90, 20.0, 30.0),
        ("2026-09-02", 9, "35", "80", "GW37", 500, 95, 0, 20, 40, 20.0, 30.0),
    ]
    conn.executemany(
        """
        INSERT INTO daily_campaign_metrics
            (fecha, hora, campaign, base, device, total_calls, agent_answers,
             machine_answers, busy_calls, congestion_calls,
             avg_wait_time_sec, avg_abandon_time_sec)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()


def test_compare_diagnostics_positive_drivers_and_insights(client, memory_conn):
    seed_compare_recovery(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare/diagnostics",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "positive_drivers" in data
    assert "insights" in data
    types_pos = {p["type"] for p in data["positive_drivers"]}
    assert "NETWORK_RECOVERY" in types_pos or "BASE_IMPROVEMENT" in types_pos
    assert any(i["polarity"] == "POSITIVE" for i in data["insights"])
    assert data["root_causes"] == []


def test_compare_diagnostics_missing_day_returns_nulls(client, memory_conn):
    seed_compare_days(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare/diagnostics",
        params={"date_a": "2026-09-01", "date_b": "2030-01-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"] is None
    assert data["root_causes"] == []
    assert data["positive_drivers"] == []
    assert data["insights"] == []
    assert data["bases_comparison"] is None
    assert data["gateways_comparison"] is None


def test_compare_diagnostics_unknown_campaign(client):
    response = client.get(
        "/api/campaigns/noexiste/compare/diagnostics",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"] is None
    assert data["root_causes"] == []
    assert data["positive_drivers"] == []
    assert data["insights"] == []


def test_compare_diagnostics_min_calls_validation(client):
    response = client.get(
        "/api/campaigns/35/compare/diagnostics",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02", "min_calls": 0},
    )
    assert response.status_code == 422


def test_compare_diagnostics_days_ok_but_no_segments(client, memory_conn):
    seed_compare_days(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare/diagnostics",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02", "min_calls": 100000},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"] is not None
    assert data["bases_comparison"] == []
    assert data["gateways_comparison"] == []
    assert data["root_causes"] == []
    assert data["positive_drivers"] == []
    assert data["insights"] == []


def seed_compare_recommendations(conn: sqlite3.Connection) -> None:
    rows = [
        ("2026-09-01", 9, "35", "80", "GW37", 500, 200, 10, 200, 20, 20.0, 30.0),
        ("2026-09-02", 9, "35", "80", "GW37", 400, 40, 10, 280, 15, 20.0, 30.0),
        ("2026-09-02", 10, "35", "80", "GW37", 300, 80, 5, 25, 10, 20.0, 30.0),
        ("2026-09-02", 11, "35", "90", "GW37", 200, 30, 5, 15, 5, 20.0, 30.0),
    ]
    conn.executemany(
        """
        INSERT INTO daily_campaign_metrics
            (fecha, hora, campaign, base, device, total_calls, agent_answers,
             machine_answers, busy_calls, congestion_calls,
             avg_wait_time_sec, avg_abandon_time_sec)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()


def test_recommendations_contract(client, memory_conn):
    seed_compare_recommendations(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare/recommendations",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["campaign"] == "35"
    assert data["date_a"] == "2026-09-01"
    assert data["date_b"] == "2026-09-02"
    assert data["min_calls_applied"] == 50
    recs = data["recommendations"]
    assert isinstance(recs, list)
    assert 1 <= len(recs) <= 5
    base_keys = {"id", "type", "category", "entity", "text"}
    for item in recs:
        assert base_keys <= set(item) <= base_keys | {"excluded_amd"}
        if "excluded_amd" in item:
            assert item["type"] == "ROUTING"
            assert isinstance(item["excluded_amd"], list)
        assert item["category"] in {"CRITICAL", "WARNING", "SUCCESS", "INFO"}
        assert item["text"]
    types = {r["type"] for r in recs}
    assert "PACING" in types
    assert "VOLUME_DELTA" in types
    assert "ROUTING" in types
    assert "SCHEDULE" in types


def test_recommendations_missing_day_returns_empty(client, memory_conn):
    seed_compare_recommendations(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare/recommendations",
        params={"date_a": "2026-09-01", "date_b": "2030-01-01"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["recommendations"] == []


def test_recommendations_unknown_campaign(client):
    response = client.get(
        "/api/campaigns/noexiste/compare/recommendations",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02"},
    )
    assert response.status_code == 200
    assert response.json()["recommendations"] == []


def test_recommendations_min_calls_validation(client):
    response = client.get(
        "/api/campaigns/35/compare/recommendations",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02", "min_calls": 0},
    )
    assert response.status_code == 422


def test_recommendations_min_calls_filters_segment_rules(client, memory_conn):
    seed_compare_recommendations(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare/recommendations",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02", "min_calls": 100000},
    )
    assert response.status_code == 200
    data = response.json()
    types = {r["type"] for r in data["recommendations"]}
    assert "ROUTING" not in types
    assert "PACING" not in types
    assert "SCHEDULE" not in types
    assert "VOLUME_DELTA" in types


def test_compare_diagnostics_contract_unchanged_by_recommendations(client, memory_conn):
    seed_compare_recommendations(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare/diagnostics",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "recommendations" not in data
    assert "root_causes" in data


def test_range_recommendations_contract(client, memory_conn):
    seed_compare_recommendations(memory_conn)
    response = client.get(
        "/api/campaigns/35/recommendations",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert set(data) == {
        "campaign",
        "start_date",
        "end_date",
        "min_calls_applied",
        "recommendations",
    }
    assert data["campaign"] == "35"
    assert data["start_date"] == "2026-09-01"
    assert data["end_date"] == "2026-09-02"
    assert data["min_calls_applied"] == 50
    recs = data["recommendations"]
    assert isinstance(recs, list)
    assert 1 <= len(recs) <= 5
    allowed = {"ROUTING", "PACING", "SCHEDULE", "AMD_DIVERGENCE"}
    base_keys = {"id", "type", "category", "entity", "text"}
    for item in recs:
        assert base_keys <= set(item) <= base_keys | {"excluded_amd"}
        if "excluded_amd" in item:
            assert item["type"] == "ROUTING"
            assert isinstance(item["excluded_amd"], list)
        assert item["type"] in allowed
        assert item["category"] in {"CRITICAL", "WARNING", "SUCCESS", "INFO"}
        assert item["text"]
    assert "VOLUME_DELTA" not in {r["type"] for r in recs}


def test_range_recommendations_empty_range(client):
    response = client.get(
        "/api/campaigns/35/recommendations",
        params={"start_date": "2030-01-01", "end_date": "2030-01-31"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["recommendations"] == []
    assert data["min_calls_applied"] == 50


def test_range_recommendations_unknown_campaign(client):
    response = client.get(
        "/api/campaigns/noexiste/recommendations",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02"},
    )
    assert response.status_code == 200
    assert response.json()["recommendations"] == []


def test_range_recommendations_min_calls_validation(client):
    response = client.get(
        "/api/campaigns/35/recommendations",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02", "min_calls": 0},
    )
    assert response.status_code == 422


def test_range_recommendations_min_calls_filters_segment_rules(client, memory_conn):
    seed_compare_recommendations(memory_conn)
    response = client.get(
        "/api/campaigns/35/recommendations",
        params={"start_date": "2026-09-01", "end_date": "2026-09-02", "min_calls": 100000},
    )
    assert response.status_code == 200
    types = {r["type"] for r in response.json()["recommendations"]}
    assert types == set()


def test_compare_recommendations_contract_intact(client, memory_conn):
    seed_compare_recommendations(memory_conn)
    response = client.get(
        "/api/campaigns/35/compare/recommendations",
        params={"date_a": "2026-09-01", "date_b": "2026-09-02"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "start_date" not in data
    assert "date_a" in data
    types = {r["type"] for r in data["recommendations"]}
    assert "VOLUME_DELTA" in types


CROSS_PARAMS = {
    "campaign_a": "35",
    "campaign_b": "40",
    "start_date": "2026-09-01",
    "end_date": "2026-09-02",
}


def test_cross_campaign_contract(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get("/api/campaigns/compare-campaigns", params=CROSS_PARAMS)
    assert response.status_code == 200
    data = response.json()
    assert set(data) == {
        "campaign_a",
        "campaign_b",
        "start_date",
        "end_date",
        "min_calls_applied",
        "summary",
        "gateways_comparison",
        "bases_comparison",
        "hourly_a",
        "hourly_b",
        "daily_a",
        "daily_b",
        "devices_a",
        "devices_b",
    }
    assert data["campaign_a"] == "35"
    assert data["campaign_b"] == "40"
    assert data["min_calls_applied"] == 50
    summary = data["summary"]
    assert summary["total_calls_a"] == 390
    assert summary["total_calls_b"] == 80
    assert isinstance(summary["agent_answer_rate_a"], float)
    assert isinstance(summary["delta_rate"], float)
    assert "root_causes" not in data
    assert "recommendations" not in data


def test_cross_campaign_missing_campaign_returns_nulls(client, memory_conn):
    seed_metrics(memory_conn)
    params = {**CROSS_PARAMS, "campaign_b": "noexiste"}
    response = client.get("/api/campaigns/compare-campaigns", params=params)
    assert response.status_code == 200
    data = response.json()
    assert data["summary"] is None
    assert data["gateways_comparison"] is None
    assert data["bases_comparison"] is None
    assert data["hourly_a"] == []
    assert data["hourly_b"] == []
    assert data["daily_a"] == []
    assert data["daily_b"] == []
    assert data["devices_a"] == []
    assert data["devices_b"] == []


def test_cross_campaign_compare_includes_device_metrics(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get("/api/campaigns/compare-campaigns", params=CROSS_PARAMS)
    assert response.status_code == 200
    data = response.json()
    devices_a = {row["device"]: row for row in data["devices_a"]}
    devices_b = {row["device"]: row for row in data["devices_b"]}
    assert set(devices_a) == {"GW37", "GW20"}
    assert set(devices_b) == {"GW37"}
    assert devices_a["GW37"]["total_calls"] == 300
    assert devices_a["GW37"]["agent_answer_rate"] == pytest.approx(80 / 300)
    assert devices_a["GW20"]["total_calls"] == 90
    assert devices_b["GW37"]["total_calls"] == 80
    assert devices_b["GW37"]["agent_answer_rate"] == pytest.approx(0.5)
    for row in data["devices_a"] + data["devices_b"]:
        assert set(row) == {
            "device",
            "total_calls",
            "agent_answers",
            "machine_answers",
            "busy_calls",
            "congestion_calls",
            "agent_answer_rate",
            "busy_rate",
            "congestion_rate",
        }


def test_cross_campaign_min_calls_filters_intersections(client, memory_conn):
    seed_metrics(memory_conn)
    params = {**CROSS_PARAMS, "min_calls": 100000}
    response = client.get("/api/campaigns/compare-campaigns", params=params)
    assert response.status_code == 200
    data = response.json()
    assert data["summary"] is not None
    assert data["gateways_comparison"] == []
    assert data["bases_comparison"] == []


def test_cross_campaign_min_calls_validation(client):
    response = client.get(
        "/api/campaigns/compare-campaigns",
        params={**CROSS_PARAMS, "min_calls": 0},
    )
    assert response.status_code == 422


def test_cross_diagnostics_contract(client, memory_conn):
    seed_metrics(memory_conn)
    response = client.get(
        "/api/campaigns/compare-campaigns/diagnostics", params=CROSS_PARAMS
    )
    assert response.status_code == 200
    data = response.json()
    assert set(data) == {
        "campaign_a",
        "campaign_b",
        "start_date",
        "end_date",
        "min_calls_applied",
        "summary",
        "root_causes",
        "positive_drivers",
        "insights",
        "bases_comparison",
        "gateways_comparison",
    }
    assert data["campaign_a"] == "35"
    assert data["campaign_b"] == "40"
    assert data["start_date"] == "2026-09-01"
    assert data["end_date"] == "2026-09-02"
    assert data["min_calls_applied"] == 50
    summary = data["summary"]
    assert summary["total_calls_a"] == 390
    assert summary["total_calls_b"] == 80
    assert isinstance(data["root_causes"], list)
    assert isinstance(data["positive_drivers"], list)
    assert isinstance(data["insights"], list)
    assert isinstance(data["bases_comparison"], list)
    assert isinstance(data["gateways_comparison"], list)
    for item in data["insights"]:
        assert item["polarity"] in {"POSITIVE", "NEGATIVE"}
    assert "recommendations" not in data


def test_cross_diagnostics_missing_campaign_returns_nulls(client, memory_conn):
    seed_metrics(memory_conn)
    params = {**CROSS_PARAMS, "campaign_b": "noexiste"}
    response = client.get(
        "/api/campaigns/compare-campaigns/diagnostics", params=params
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"] is None
    assert data["bases_comparison"] is None
    assert data["gateways_comparison"] is None
    assert data["root_causes"] == []
    assert data["positive_drivers"] == []
    assert data["insights"] == []


def test_cross_diagnostics_min_calls_filters_intersections(client, memory_conn):
    seed_metrics(memory_conn)
    params = {**CROSS_PARAMS, "min_calls": 100000}
    response = client.get(
        "/api/campaigns/compare-campaigns/diagnostics", params=params
    )
    assert response.status_code == 200
    data = response.json()
    assert data["summary"] is not None
    assert data["bases_comparison"] == []
    assert data["gateways_comparison"] == []


def test_cross_diagnostics_min_calls_validation(client):
    response = client.get(
        "/api/campaigns/compare-campaigns/diagnostics",
        params={**CROSS_PARAMS, "min_calls": 0},
    )
    assert response.status_code == 422


def test_cross_recommendations_contract(client, memory_conn):
    seed_compare_recommendations(memory_conn)
    params = {
        "campaign_a": "40",
        "campaign_b": "35",
        "start_date": "2026-09-01",
        "end_date": "2026-09-02",
    }
    response = client.get(
        "/api/campaigns/compare-campaigns/recommendations", params=params
    )
    assert response.status_code == 200
    data = response.json()
    assert set(data) == {
        "campaign_a",
        "campaign_b",
        "start_date",
        "end_date",
        "min_calls_applied",
        "recommendations",
    }
    assert data["campaign_a"] == "40"
    assert data["campaign_b"] == "35"
    assert data["min_calls_applied"] == 50
    recs = data["recommendations"]
    assert isinstance(recs, list)
    assert len(recs) <= 5
    allowed = {"ROUTING", "PACING", "SCHEDULE", "AMD_DIVERGENCE"}
    base_keys = {"id", "type", "category", "entity", "text"}
    for item in recs:
        assert base_keys <= set(item) <= base_keys | {"excluded_amd"}
        assert item["type"] in allowed
    assert "VOLUME_DELTA" not in {r["type"] for r in recs}
    assert "summary" not in data


def test_cross_recommendations_missing_campaign_returns_empty(client, memory_conn):
    seed_metrics(memory_conn)
    params = {**CROSS_PARAMS, "campaign_b": "noexiste"}
    response = client.get(
        "/api/campaigns/compare-campaigns/recommendations", params=params
    )
    assert response.status_code == 200
    data = response.json()
    assert data["recommendations"] == []
    assert data["min_calls_applied"] == 50


def test_cross_recommendations_min_calls_validation(client):
    response = client.get(
        "/api/campaigns/compare-campaigns/recommendations",
        params={**CROSS_PARAMS, "min_calls": 0},
    )
    assert response.status_code == 422


def insert_day(conn: sqlite3.Connection, fecha: str, campaign: str, total: int) -> None:
    conn.execute(
        """
        INSERT INTO daily_campaign_metrics
            (fecha, hora, campaign, base, device, total_calls, agent_answers,
             machine_answers, busy_calls, congestion_calls,
             avg_wait_time_sec, avg_abandon_time_sec)
        VALUES (?, 9, ?, '34', 'GW37', ?, 1, 0, 0, 0, NULL, NULL)
        """,
        (fecha, campaign, total),
    )
    conn.commit()


def test_campaigns_catalog_lists_campaigns_sorted_with_dates(client, memory_conn):
    seed_metrics(memory_conn)
    insert_day(memory_conn, "2026-09-03", "100", 10)
    insert_day(memory_conn, "2026-09-04", "ABC", 7)

    response = client.get("/api/campaigns")

    assert response.status_code == 200
    data = response.json()
    assert [item["campaign"] for item in data] == ["35", "40", "100", "ABC"]
    assert data[0] == {
        "campaign": "35",
        "first_day": "2026-09-01",
        "last_day": "2026-09-02",
        "days": 2,
        "total_calls": 390,
        "dates": ["2026-09-01", "2026-09-02"],
    }
    assert data[1]["dates"] == ["2026-09-02"]
    assert data[1]["total_calls"] == 80
    for item in data:
        assert item["days"] == len(item["dates"])
        assert item["dates"] == sorted(item["dates"])


def test_campaigns_catalog_excludes_sentinel_date(client, memory_conn):
    seed_metrics(memory_conn)
    insert_day(memory_conn, "1970-01-01", "35", 999)
    insert_day(memory_conn, "1970-01-01", "77", 5)

    data = client.get("/api/campaigns").json()

    assert [item["campaign"] for item in data] == ["35", "40"]
    assert data[0]["first_day"] == "2026-09-01"
    assert data[0]["total_calls"] == 390


def test_campaigns_catalog_empty_db_returns_empty_list(client):
    response = client.get("/api/campaigns")
    assert response.status_code == 200
    assert response.json() == []
