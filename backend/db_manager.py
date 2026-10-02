import json
import sqlite3
from datetime import datetime
from pathlib import Path

import pandas as pd

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "callcenter_metrics.db"
DEFAULT_CAMPAIGN = "Sin Campaña"

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS daily_campaign_metrics (
    fecha DATE NOT NULL,
    hora INTEGER NOT NULL,
    campaign TEXT NOT NULL DEFAULT 'Sin Campaña',
    base TEXT NOT NULL,
    device TEXT NOT NULL DEFAULT 'DESCONOCIDO',
    total_calls INTEGER NOT NULL,
    agent_answers INTEGER NOT NULL,
    machine_answers INTEGER NOT NULL,
    busy_calls INTEGER NOT NULL,
    congestion_calls INTEGER NOT NULL,
    avg_wait_time_sec REAL,
    avg_abandon_time_sec REAL,
    PRIMARY KEY (fecha, hora, campaign, base, device)
)
"""


# Spec 052: one row per /data file already loaded, to ingest only what changed.
CREATE_INGESTED_FILES_SQL = """
CREATE TABLE IF NOT EXISTS ingested_files (
    name TEXT PRIMARY KEY,
    size INTEGER NOT NULL,
    mtime_ns INTEGER NOT NULL,
    days TEXT NOT NULL,
    ingested_at TEXT NOT NULL
)
"""


def get_connection(db_path: Path | str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.execute(CREATE_TABLE_SQL)
    conn.execute(CREATE_INGESTED_FILES_SQL)
    conn.commit()
    migrate_add_campaign(conn)
    migrate_recreate_hourly(conn)
    migrate_recreate_device(conn)


def migrate_add_campaign(conn: sqlite3.Connection) -> None:
    columns = {row[1] for row in conn.execute("PRAGMA table_info(daily_campaign_metrics)")}
    if "campaign" not in columns:
        conn.execute(
            "ALTER TABLE daily_campaign_metrics "
            "ADD COLUMN campaign TEXT NOT NULL DEFAULT 'Sin Campaña'"
        )
        conn.commit()
        print("Migración: columna campaign agregada a daily_campaign_metrics.")


def _has_hourly_pk(conn: sqlite3.Connection) -> bool:
    columns = {row[1] for row in conn.execute("PRAGMA table_info(daily_campaign_metrics)")}
    if "hora" not in columns:
        return False
    pk_columns = [
        row[1]
        for row in conn.execute("PRAGMA table_info(daily_campaign_metrics)")
        if row[5] > 0
    ]
    return pk_columns[:4] == ["fecha", "hora", "campaign", "base"]


def migrate_recreate_hourly(conn: sqlite3.Connection) -> None:
    cursor = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_campaign_metrics'"
    )
    if cursor.fetchone() is None:
        return
    if _has_hourly_pk(conn):
        return
    with conn:
        conn.execute("DROP TABLE daily_campaign_metrics")
        conn.execute(CREATE_TABLE_SQL)
    print(
        "Migración: tabla daily_campaign_metrics recreada con PK "
        "(fecha, hora, campaign, base). Re-ingresar /data."
    )


def _has_device_pk(conn: sqlite3.Connection) -> bool:
    columns = {row[1] for row in conn.execute("PRAGMA table_info(daily_campaign_metrics)")}
    if "device" not in columns:
        return False
    pk_columns = [
        row[1]
        for row in conn.execute("PRAGMA table_info(daily_campaign_metrics)")
        if row[5] > 0
    ]
    return pk_columns == ["fecha", "hora", "campaign", "base", "device"]


def migrate_recreate_device(conn: sqlite3.Connection) -> None:
    cursor = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_campaign_metrics'"
    )
    if cursor.fetchone() is None:
        return
    if _has_device_pk(conn):
        return
    with conn:
        conn.execute("DROP TABLE daily_campaign_metrics")
        conn.execute(CREATE_TABLE_SQL)
    print(
        "Migración: tabla daily_campaign_metrics recreada con PK "
        "(fecha, hora, campaign, base, device). Re-ingresar /data."
    )


def get_db_connection():
    conn = get_connection()
    init_db(conn)
    try:
        yield conn
    finally:
        conn.close()


def replace_day(conn: sqlite3.Connection, fecha, metrics_df: pd.DataFrame) -> int:
    fecha_str = pd.Timestamp(fecha).date().isoformat()
    if metrics_df.empty:
        return 0
    if "campaign" in metrics_df.columns:
        campaigns = [str(c) for c in metrics_df["campaign"].dropna().unique()]
    else:
        campaigns = [DEFAULT_CAMPAIGN]
    if not campaigns:
        campaigns = [DEFAULT_CAMPAIGN]
    placeholders = ",".join("?" * len(campaigns))
    with conn:
        conn.execute(
            f"DELETE FROM daily_campaign_metrics "
            f"WHERE fecha = ? AND campaign IN ({placeholders})",
            [fecha_str, *campaigns],
        )
        rows = [
            (
                pd.Timestamp(row["fecha"]).date().isoformat(),
                int(row["hora"]),
                str(row.get("campaign", DEFAULT_CAMPAIGN)),
                str(row["base"]),
                str(row.get("device", "DESCONOCIDO")),
                int(row["total_calls"]),
                int(row["agent_answers"]),
                int(row["machine_answers"]),
                int(row.get("busy_calls", 0)),
                int(row.get("congestion_calls", 0)),
                None if pd.isna(row["avg_wait_time_sec"]) else float(row["avg_wait_time_sec"]),
                None if pd.isna(row["avg_abandon_time_sec"]) else float(row["avg_abandon_time_sec"]),
            )
            for _, row in metrics_df.iterrows()
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
    return len(rows)


def load_ingested_files(conn: sqlite3.Connection) -> dict[str, dict]:
    """name -> {size, mtime_ns, days: set[(campaign, fecha)]}."""
    files = {}
    for row in conn.execute("SELECT name, size, mtime_ns, days FROM ingested_files"):
        files[row["name"]] = {
            "size": int(row["size"]),
            "mtime_ns": int(row["mtime_ns"]),
            "days": {tuple(day) for day in json.loads(row["days"])},
        }
    return files


def record_ingested_file(
    conn: sqlite3.Connection, name: str, size: int, mtime_ns: int, days: set[tuple[str, str]]
) -> None:
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO ingested_files (name, size, mtime_ns, days, ingested_at) "
            "VALUES (?, ?, ?, ?, ?)",
            (name, size, mtime_ns, json.dumps(sorted(days)), datetime.now().isoformat(timespec="seconds")),
        )


def forget_ingested_file(conn: sqlite3.Connection, name: str) -> None:
    with conn:
        conn.execute("DELETE FROM ingested_files WHERE name = ?", (name,))


def clear_ingested_files(conn: sqlite3.Connection) -> None:
    with conn:
        conn.execute("DELETE FROM ingested_files")
