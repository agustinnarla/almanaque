import sqlite3

import pandas as pd
import pytest

import db_manager
from db_manager import (
    get_connection,
    init_db,
    migrate_add_campaign,
    migrate_recreate_device,
    migrate_recreate_hourly,
    replace_day,
)

DEVICE_PK = ["fecha", "hora", "campaign", "base", "device"]


@pytest.fixture
def conn():
    connection = get_connection(":memory:")
    init_db(connection)
    yield connection
    connection.close()


def make_metrics(
    fecha: str,
    bases: list[str],
    campaign: str = "35",
    hora: int = 10,
    device: str = "GW37",
) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "fecha": [fecha] * len(bases),
            "hora": [hora] * len(bases),
            "campaign": [campaign] * len(bases),
            "base": bases,
            "device": [device] * len(bases),
            "total_calls": [10] * len(bases),
            "agent_answers": [5] * len(bases),
            "machine_answers": [2] * len(bases),
            "busy_calls": [1] * len(bases),
            "congestion_calls": [1] * len(bases),
            "avg_wait_time_sec": [30.0] * len(bases),
            "avg_abandon_time_sec": [15.0] * len(bases),
        }
    )


def get_pk_columns(conn: sqlite3.Connection) -> list[str]:
    return [
        info[1]
        for info in conn.execute("PRAGMA table_info(daily_campaign_metrics)")
        if info[5] > 0
    ]


def fetch_all(conn: sqlite3.Connection) -> list[tuple]:
    cursor = conn.execute(
        "SELECT fecha, hora, campaign, base, device, total_calls FROM daily_campaign_metrics "
        "ORDER BY fecha, hora, campaign, base, device"
    )
    return [tuple(row) for row in cursor.fetchall()]


def test_init_db_creates_table_with_device_pk(conn):
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_campaign_metrics'"
    ).fetchone()
    assert row is not None
    assert get_pk_columns(conn) == DEVICE_PK


def test_migrate_recreate_device_is_idempotent(conn):
    migrate_recreate_device(conn)
    migrate_recreate_device(conn)
    assert get_pk_columns(conn) == DEVICE_PK


def test_migrate_recreate_hourly_keeps_device_pk(conn):
    migrate_recreate_hourly(conn)
    assert get_pk_columns(conn) == DEVICE_PK


def test_migrate_recreate_replaces_old_schema():
    conn = get_connection(":memory:")
    conn.execute(
        """
        CREATE TABLE daily_campaign_metrics (
            fecha DATE NOT NULL,
            campaign TEXT NOT NULL DEFAULT 'Sin Campaña',
            base TEXT NOT NULL,
            total_calls INTEGER NOT NULL,
            agent_answers INTEGER NOT NULL,
            machine_answers INTEGER NOT NULL,
            avg_wait_time_sec REAL,
            avg_abandon_time_sec REAL,
            PRIMARY KEY (fecha, campaign, base)
        )
        """
    )
    conn.execute(
        "INSERT INTO daily_campaign_metrics VALUES "
        "('2026-09-01','35','A',10,5,2,30.0,15.0)"
    )
    migrate_recreate_hourly(conn)
    migrate_recreate_device(conn)
    columns = {info[1] for info in conn.execute("PRAGMA table_info(daily_campaign_metrics)")}
    assert "hora" in columns
    assert "device" in columns
    assert conn.execute("SELECT COUNT(*) FROM daily_campaign_metrics").fetchone()[0] == 0
    conn.close()


def test_replace_day_inserts_rows(conn):
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["A", "B"], hora=9))
    assert fetch_all(conn) == [
        ("2026-09-01", 9, "35", "A", "GW37", 10),
        ("2026-09-01", 9, "35", "B", "GW37", 10),
    ]


def test_replace_day_clears_all_hours_and_devices_of_the_date(conn):
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["A"], hora=9, device="GW37"))
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["A"], hora=10, device="GW20"))
    assert fetch_all(conn) == [("2026-09-01", 10, "35", "A", "GW20", 10)]


def test_replace_day_updates_without_duplicates_and_drops_stale(conn):
    replace_day(
        conn,
        "2026-09-01",
        pd.concat(
            [
                make_metrics("2026-09-01", ["A"], hora=9),
                make_metrics("2026-09-01", ["B"], hora=10),
            ],
            ignore_index=True,
        ),
    )
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["A"], hora=9))
    assert fetch_all(conn) == [("2026-09-01", 9, "35", "A", "GW37", 10)]


def test_replace_day_does_not_touch_other_dates(conn):
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["A"]))
    replace_day(conn, "2026-09-02", make_metrics("2026-09-02", ["B"]))
    assert fetch_all(conn) == [
        ("2026-09-01", 10, "35", "A", "GW37", 10),
        ("2026-09-02", 10, "35", "B", "GW37", 10),
    ]


def test_replace_day_accepts_timestamp_fecha(conn):
    replace_day(conn, pd.Timestamp("2026-09-01"), make_metrics("2026-09-01", ["A"]))
    assert fetch_all(conn) == [("2026-09-01", 10, "35", "A", "GW37", 10)]


def test_same_base_two_campaigns_same_hour(conn):
    replace_day(
        conn,
        "2026-09-01",
        pd.concat(
            [
                make_metrics("2026-09-01", ["A"], campaign="35", hora=9),
                make_metrics("2026-09-01", ["A"], campaign="40", hora=9),
            ],
            ignore_index=True,
        ),
    )
    assert len(fetch_all(conn)) == 2


def test_replace_day_keeps_other_campaigns_same_date(conn):
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["A"], campaign="35", hora=9))
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["B"], campaign="38", hora=9))
    assert fetch_all(conn) == [
        ("2026-09-01", 9, "35", "A", "GW37", 10),
        ("2026-09-01", 9, "38", "B", "GW37", 10),
    ]

    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["C"], campaign="38", hora=10))
    assert fetch_all(conn) == [
        ("2026-09-01", 9, "35", "A", "GW37", 10),
        ("2026-09-01", 10, "38", "C", "GW37", 10),
    ]

    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["D"], campaign="35", hora=11))
    assert fetch_all(conn) == [
        ("2026-09-01", 10, "38", "C", "GW37", 10),
        ("2026-09-01", 11, "35", "D", "GW37", 10),
    ]


def test_replace_day_empty_dataframe_is_noop(conn):
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["A"], campaign="35"))
    result = replace_day(conn, "2026-09-01", pd.DataFrame())
    assert result == 0
    assert len(fetch_all(conn)) == 1


def test_same_group_two_devices_same_hour(conn):
    replace_day(
        conn,
        "2026-09-01",
        pd.concat(
            [
                make_metrics("2026-09-01", ["A"], hora=9, device="GW37"),
                make_metrics("2026-09-01", ["A"], hora=9, device="GW20"),
            ],
            ignore_index=True,
        ),
    )
    assert len(fetch_all(conn)) == 2


def test_replace_day_persists_busy_and_congestion(conn):
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["A"]))
    row = conn.execute(
        "SELECT busy_calls, congestion_calls FROM daily_campaign_metrics"
    ).fetchone()
    assert row["busy_calls"] == 1
    assert row["congestion_calls"] == 1


def test_migrate_add_campaign_adds_missing_column(capsys):
    conn = get_connection(":memory:")
    conn.execute("CREATE TABLE daily_campaign_metrics (fecha DATE, base TEXT, total_calls INTEGER)")
    migrate_add_campaign(conn)
    columns = {info[1] for info in conn.execute("PRAGMA table_info(daily_campaign_metrics)")}
    assert "campaign" in columns
    assert "columna campaign agregada" in capsys.readouterr().out
    conn.close()


def test_migrations_do_nothing_without_table():
    conn = get_connection(":memory:")
    migrate_recreate_hourly(conn)
    migrate_recreate_device(conn)
    assert conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall() == []
    conn.close()


def test_get_db_connection_initializes_and_closes(monkeypatch):
    opened = get_connection(":memory:")
    monkeypatch.setattr(db_manager, "get_connection", lambda: opened)

    dependency = db_manager.get_db_connection()
    conn = next(dependency)
    assert get_pk_columns(conn) == DEVICE_PK
    with pytest.raises(StopIteration):
        next(dependency)
    with pytest.raises(sqlite3.ProgrammingError):
        conn.execute("SELECT 1")


def test_replace_day_without_campaign_column_uses_default(conn):
    metrics = make_metrics("2026-09-01", ["A"]).drop(columns=["campaign"])
    replace_day(conn, "2026-09-01", metrics)
    assert fetch_all(conn) == [("2026-09-01", 10, "Sin Campaña", "A", "GW37", 10)]


def test_replace_day_with_empty_campaigns_clears_default_campaign(conn):
    replace_day(conn, "2026-09-01", make_metrics("2026-09-01", ["A"], campaign="Sin Campaña"))
    metrics = make_metrics("2026-09-01", ["B"])
    metrics["campaign"] = None

    replace_day(conn, "2026-09-01", metrics)

    assert [row[3] for row in fetch_all(conn)] == ["B"]


def test_get_db_connection_initializes_each_file_once(monkeypatch, tmp_path):
    db_file = tmp_path / "metrics.db"
    monkeypatch.setattr(db_manager, "get_connection", lambda: get_connection(db_file))
    monkeypatch.setattr(db_manager, "_initialized_files", set())
    calls = []
    real_init = db_manager.init_db
    monkeypatch.setattr(db_manager, "init_db", lambda conn: (calls.append(1), real_init(conn)))

    for _ in range(3):
        dependency = db_manager.get_db_connection()
        conn = next(dependency)
        assert get_pk_columns(conn) == DEVICE_PK
        with pytest.raises(StopIteration):
            next(dependency)

    assert len(calls) == 1
    assert str(db_file) in db_manager._initialized_files


def test_get_db_connection_always_initializes_in_memory_databases(monkeypatch):
    monkeypatch.setattr(db_manager, "get_connection", lambda: get_connection(":memory:"))
    calls = []
    real_init = db_manager.init_db
    monkeypatch.setattr(db_manager, "init_db", lambda conn: (calls.append(1), real_init(conn)))

    for _ in range(2):
        dependency = db_manager.get_db_connection()
        next(dependency)
        with pytest.raises(StopIteration):
            next(dependency)

    assert len(calls) == 2
