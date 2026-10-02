"""Spec 058: calls per (device, hour) for the heatmap."""
from test_api import client, memory_conn  # noqa: F401  (fixtures)


def test_heatmap_groups_by_device_and_hour(client, memory_conn):  # noqa: F811
    # fecha, hora, campaign, base, device, total, agents, machines
    rows = [
        ("2026-09-01", 9, "35", "80", "IPLAN", 100, 15, 50),
        ("2026-09-02", 9, "35", "81", "IPLAN", 200, 25, 90),
        ("2026-09-01", 15, "35", "80", "IPLAN", 300, 15, 150),
        ("2026-09-01", 9, "35", "80", "GW37", 120, 9, 20),
        ("2026-09-01", 9, "38", "80", "IPLAN", 999, 99, 0),  # other campaign
        ("2026-10-01", 9, "35", "80", "IPLAN", 999, 99, 0),  # out of range
    ]
    for fecha, hora, campaign, base, device, total, agents, machines in rows:
        memory_conn.execute(
            "INSERT INTO daily_campaign_metrics VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, NULL)",
            (fecha, hora, campaign, base, device, total, agents, machines),
        )
    memory_conn.commit()

    data = client.get(
        "/api/campaigns/35/heatmap", params={"start_date": "2026-09-01", "end_date": "2026-09-30"}
    ).json()

    assert data == [
        {"device": "GW37", "hora": 9, "total_calls": 120, "agent_answers": 9, "machine_answers": 20},
        {"device": "IPLAN", "hora": 9, "total_calls": 300, "agent_answers": 40, "machine_answers": 140},
        {"device": "IPLAN", "hora": 15, "total_calls": 300, "agent_answers": 15, "machine_answers": 150},
    ]


def test_heatmap_empty_range(client):  # noqa: F811
    response = client.get(
        "/api/campaigns/35/heatmap", params={"start_date": "2026-09-01", "end_date": "2026-09-30"}
    )
    assert response.status_code == 200
    assert response.json() == []
