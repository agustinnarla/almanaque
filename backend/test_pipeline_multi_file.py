import sqlite3

import pandas as pd

from db_manager import get_connection
from main import run_pipeline
from test_processor import make_base_frame


def write_xlsx(path, rows: pd.DataFrame) -> None:
    rows.to_excel(path, index=False)


def read_metrics(db_path: str) -> list[tuple]:
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.execute(
            "SELECT fecha, hora, campaign, base, total_calls, agent_answers "
            "FROM daily_campaign_metrics ORDER BY fecha, hora, campaign, base"
        )
        return [tuple(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def test_run_pipeline_merges_fragments_same_day(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    write_xlsx(
        data_dir / "70_01-09.xlsx",
        make_base_frame(
            rows=2,
            FECHA=[20260901, 20260901],
            INICIO=[pd.Timestamp("2026-09-01 10:00:00"), pd.Timestamp("2026-09-01 10:05:00")],
            CONEXION=[pd.Timestamp("2026-09-01 10:00:30"), pd.Timestamp("2026-09-01 10:05:30")],
            FIN=[pd.Timestamp("2026-09-01 10:01:00"), pd.Timestamp("2026-09-01 10:06:00")],
        ),
    )
    write_xlsx(
        data_dir / "70_01-09_p2.xlsx",
        make_base_frame(
            rows=4,
            FECHA=[20260901] * 4,
            INICIO=[
                pd.Timestamp("2026-09-01 10:10:00"),
                pd.Timestamp("2026-09-01 10:11:00"),
                pd.Timestamp("2026-09-01 10:12:00"),
                pd.Timestamp("2026-09-01 11:00:00"),
            ],
            CONEXION=[
                pd.Timestamp("2026-09-01 10:10:30"),
                pd.Timestamp("2026-09-01 10:11:30"),
                pd.Timestamp("2026-09-01 10:12:30"),
                pd.Timestamp("2026-09-01 11:00:30"),
            ],
            FIN=[
                pd.Timestamp("2026-09-01 10:11:00"),
                pd.Timestamp("2026-09-01 10:12:00"),
                pd.Timestamp("2026-09-01 10:13:00"),
                pd.Timestamp("2026-09-01 11:01:00"),
            ],
        ),
    )
    db_path = str(tmp_path / "pipeline.db")

    processed = run_pipeline(data_dir, db_path)

    assert processed == 2
    rows = read_metrics(db_path)
    by_hour = {(row[0], row[1]): row for row in rows}
    assert len({row[0] for row in rows}) == 1
    assert by_hour[("2026-09-01", 10)][4] == 5
    assert by_hour[("2026-09-01", 11)][4] == 1
    assert all(row[2] == "70" for row in rows)


def test_run_pipeline_is_idempotent(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    write_xlsx(
        data_dir / "70_01-09.xlsx",
        make_base_frame(
            rows=3,
            FECHA=[20260901] * 3,
            INICIO=[
                pd.Timestamp("2026-09-01 10:00:00"),
                pd.Timestamp("2026-09-01 10:05:00"),
                pd.Timestamp("2026-09-01 12:00:00"),
            ],
            CONEXION=[
                pd.Timestamp("2026-09-01 10:00:30"),
                pd.Timestamp("2026-09-01 10:05:30"),
                pd.Timestamp("2026-09-01 12:00:30"),
            ],
            FIN=[
                pd.Timestamp("2026-09-01 10:01:00"),
                pd.Timestamp("2026-09-01 10:06:00"),
                pd.Timestamp("2026-09-01 12:01:00"),
            ],
        ),
    )
    db_path = str(tmp_path / "pipeline.db")

    assert run_pipeline(data_dir, db_path) == 1
    first = read_metrics(db_path)
    assert run_pipeline(data_dir, db_path) == 1
    second = read_metrics(db_path)

    assert first == second
    assert sum(row[4] for row in second) == 3


def test_run_pipeline_keeps_different_campaigns_same_day(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    write_xlsx(
        data_dir / "70_01-09.xlsx",
        make_base_frame(
            FECHA=[20260901],
            INICIO=[pd.Timestamp("2026-09-01 10:00:00")],
            CONEXION=[pd.Timestamp("2026-09-01 10:00:30")],
            FIN=[pd.Timestamp("2026-09-01 10:01:00")],
        ),
    )
    write_xlsx(
        data_dir / "71_01-09.xlsx",
        make_base_frame(
            FECHA=[20260901],
            INICIO=[pd.Timestamp("2026-09-01 10:00:00")],
            CONEXION=[pd.Timestamp("2026-09-01 10:00:30")],
            FIN=[pd.Timestamp("2026-09-01 10:01:00")],
        ),
    )
    db_path = str(tmp_path / "pipeline.db")

    processed = run_pipeline(data_dir, db_path)

    assert processed == 2
    campaigns = {row[2] for row in read_metrics(db_path)}
    assert campaigns == {"70", "71"}


def test_run_pipeline_skips_broken_file_and_keeps_rest(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    write_xlsx(
        data_dir / "70_02-09.xlsx",
        make_base_frame(FECHA=[20260902]).drop(columns=["CONEXION"]),
    )
    write_xlsx(
        data_dir / "70_02-09_p2.xlsx",
        make_base_frame(
            rows=2,
            FECHA=[20260902, 20260902],
            INICIO=[pd.Timestamp("2026-09-02 10:00:00"), pd.Timestamp("2026-09-02 11:00:00")],
            CONEXION=[pd.Timestamp("2026-09-02 10:00:30"), pd.Timestamp("2026-09-02 11:00:30")],
            FIN=[pd.Timestamp("2026-09-02 10:01:00"), pd.Timestamp("2026-09-02 11:01:00")],
        ),
    )
    db_path = str(tmp_path / "pipeline.db")

    processed = run_pipeline(data_dir, db_path)

    assert processed == 1
    rows = read_metrics(db_path)
    assert {row[0] for row in rows} == {"2026-09-02"}
    assert sum(row[4] for row in rows) == 2


def test_run_pipeline_empty_dir_returns_zero(tmp_path):
    data_dir = tmp_path / "vacio"
    data_dir.mkdir()

    assert run_pipeline(data_dir, str(tmp_path / "pipeline.db")) == 0


def test_run_pipeline_skips_file_without_fecha(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    write_xlsx(
        data_dir / "70_03-09.xlsx",
        make_base_frame().drop(columns=["FECHA"]),
    )
    db_path = str(tmp_path / "pipeline.db")

    assert run_pipeline(data_dir, db_path) == 0
    assert read_metrics(db_path) == []


def _day_frame(rows: int, start_minute: int, ids: list[int] | None = None) -> pd.DataFrame:
    starts = [pd.Timestamp("2026-09-04 10:00:00") + pd.Timedelta(minutes=start_minute + i) for i in range(rows)]
    frame = make_base_frame(
        rows=rows,
        FECHA=[20260904] * rows,
        INICIO=starts,
        CONEXION=[s + pd.Timedelta(seconds=30) for s in starts],
        FIN=[s + pd.Timedelta(minutes=1) for s in starts],
    )
    if ids is not None:
        frame.insert(1, "Id. llamada", ids)
    return frame


def test_run_pipeline_reads_every_sheet(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    with pd.ExcelWriter(data_dir / "70_04-09.xlsx") as writer:
        _day_frame(3, 0, [1, 2, 3]).to_excel(writer, sheet_name="1", index=False)
        _day_frame(2, 10, [4, 5]).to_excel(writer, sheet_name="2", index=False)
    db_path = str(tmp_path / "pipeline.db")

    assert run_pipeline(data_dir, db_path) == 1
    assert sum(row[4] for row in read_metrics(db_path)) == 5


def test_run_pipeline_counts_split_sheet_copies_once(tmp_path, capsys):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    with pd.ExcelWriter(data_dir / "70_04-09.xlsx") as writer:
        _day_frame(3, 0, [1, 2, 3]).to_excel(writer, sheet_name="1", index=False)
        _day_frame(2, 10, [4, 5]).to_excel(writer, sheet_name="2", index=False)
    write_xlsx(data_dir / "70_04-09 Hoja 1.xlsx", _day_frame(3, 0, [1, 2, 3]))
    write_xlsx(data_dir / "70_04-09 Hoja 2.xlsx", _day_frame(2, 10, [4, 5]))
    db_path = str(tmp_path / "pipeline.db")

    assert run_pipeline(data_dir, db_path) == 3
    assert sum(row[4] for row in read_metrics(db_path)) == 5
    assert "5 llamadas repetidas" in capsys.readouterr().out


def test_run_pipeline_without_call_id_keeps_every_row(tmp_path):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    write_xlsx(data_dir / "70_04-09.xlsx", _day_frame(2, 0))
    write_xlsx(data_dir / "70_04-09_p2.xlsx", _day_frame(2, 0))
    db_path = str(tmp_path / "pipeline.db")

    assert run_pipeline(data_dir, db_path) == 2
    assert sum(row[4] for row in read_metrics(db_path)) == 4
