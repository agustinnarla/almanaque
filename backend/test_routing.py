from fastapi.testclient import TestClient

from main_api import app
from services.routing_detector import detect_routing
from test_api import client, memory_conn  # noqa: F401  (fixtures)


def day(fecha, **devices):
    return [
        {"fecha": fecha, "device": name, "total_calls": calls, "machine_answers": machines}
        for name, (calls, machines) in devices.items()
    ]


SPREAD = dict(A=(300, 0), B=(300, 0), C=(200, 0))
FOCUSED = dict(IPLAN=(900, 450), B=(50, 0))


def test_detects_move_to_a_single_trunk_with_context():
    rows = []
    for fecha in ("2026-09-01", "2026-09-02", "2026-09-03"):
        rows += day(fecha, **SPREAD)
    for fecha in ("2026-09-04", "2026-09-05"):
        rows += day(fecha, **FOCUSED)

    result = detect_routing(rows)

    assert len(result["changes"]) == 1
    change = result["changes"][0]
    assert change["date"] == "2026-09-04" and change["entity"] == "IPLAN"
    assert change["severity"] == "INFO"
    assert "95% del volumen sale por IPLAN" in change["message"]
    assert "hasta 3 troncales" in change["message"]
    assert "50% de las llamadas lo atiende un contestador" in change["message"]


def test_isolated_day_and_low_volume_days_are_not_changes():
    rows = []
    for fecha in ("2026-09-01", "2026-09-02", "2026-09-04"):
        rows += day(fecha, **SPREAD)
    rows += day("2026-09-03", **FOCUSED)  # one odd day between two spread days
    rows += day("2026-09-05", Z=(10, 0))  # below the minimum volume: ignored

    result = detect_routing(rows)

    assert result["changes"] == []
    assert [d["fecha"] for d in result["days"]] == [
        "2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04",
    ]
    assert all(not d["concentrated"] for d in result["days"])


def test_no_change_when_always_focused_and_empty_input():
    rows = day("2026-09-01", **FOCUSED) + day("2026-09-02", **FOCUSED)
    assert detect_routing(rows)["changes"] == []
    assert detect_routing([]) == {"days": [], "changes": []}


def test_routing_endpoint(client, memory_conn):  # noqa: F811
    for fecha in ("2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"):
        for device, (calls, machines) in (SPREAD if fecha < "2026-09-03" else FOCUSED).items():
            memory_conn.execute(
                "INSERT INTO daily_campaign_metrics VALUES (?, 9, '35', '80', ?, ?, 0, ?, 0, 0, NULL, NULL)",
                (fecha, device, calls, machines),
            )
    memory_conn.commit()

    data = client.get(
        "/api/campaigns/35/routing",
        params={"start_date": "2026-09-01", "end_date": "2026-09-04"},
    ).json()

    assert [c["date"] for c in data["changes"]] == ["2026-09-03"]
    assert data["days"][0]["top_share"] == 0.375 or data["days"][0]["top_share"] < 0.5
    empty = client.get(
        "/api/campaigns/nada/routing",
        params={"start_date": "2026-09-01", "end_date": "2026-09-04"},
    ).json()
    assert empty == {"days": [], "changes": [], "volume": []}


def test_routing_endpoint_returns_volume_for_every_day(client, memory_conn):  # noqa: F811
    rows = [
        ("2026-09-02", "B", 300),
        ("2026-09-01", "B", 200),
        ("2026-09-01", "A", 400),
        ("2026-09-03", "A", 10),  # below the detector's minimum, still in volume
    ]
    for fecha, device, calls in rows:
        memory_conn.execute(
            "INSERT INTO daily_campaign_metrics VALUES (?, 9, '35', '80', ?, ?, 0, 0, 0, 0, NULL, NULL)",
            (fecha, device, calls),
        )
    memory_conn.commit()

    data = client.get(
        "/api/campaigns/35/routing",
        params={"start_date": "2026-09-01", "end_date": "2026-09-03"},
    ).json()

    assert data["volume"] == [
        {"fecha": "2026-09-01", "device": "A", "total_calls": 400},
        {"fecha": "2026-09-01", "device": "B", "total_calls": 200},
        {"fecha": "2026-09-02", "device": "B", "total_calls": 300},
        {"fecha": "2026-09-03", "device": "A", "total_calls": 10},
    ]
    assert [d["fecha"] for d in data["days"]] == ["2026-09-01", "2026-09-02"]
