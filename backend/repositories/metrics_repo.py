import sqlite3
from datetime import date

SELECT_METRICS_SQL = """
SELECT
    fecha,
    hora,
    campaign,
    base,
    device,
    total_calls,
    agent_answers,
    machine_answers,
    busy_calls,
    congestion_calls,
    avg_wait_time_sec,
    avg_abandon_time_sec
FROM daily_campaign_metrics
WHERE fecha BETWEEN ? AND ?
ORDER BY fecha, hora, campaign, base, device
"""


def fetch_metrics(conn: sqlite3.Connection, start_date: date, end_date: date) -> list[dict]:
    cursor = conn.execute(
        SELECT_METRICS_SQL,
        (start_date.isoformat(), end_date.isoformat()),
    )
    columns = [description[0] for description in cursor.description]
    rows = []
    for row in cursor.fetchall():
        record = dict(zip(columns, row))
        record["fecha"] = str(record["fecha"])
        rows.append(record)
    return rows
