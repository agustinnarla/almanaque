"""Spec 052: incremental ingestion (only new, modified or removed files)."""
import os

import pandas as pd
import pytest

import main
from db_manager import get_connection, init_db, load_ingested_files
from main import run_pipeline
from test_pipeline_multi_file import read_metrics, write_xlsx
from test_processor import make_base_frame


def day_frame(day: int, rows: int, minute: int = 0) -> pd.DataFrame:
    starts = [pd.Timestamp(f"2026-09-{day:02d} 10:00:00") + pd.Timedelta(minutes=minute + i) for i in range(rows)]
    return make_base_frame(
        rows=rows,
        FECHA=[int(f"202609{day:02d}")] * rows,
        INICIO=starts,
        CONEXION=[s + pd.Timedelta(seconds=30) for s in starts],
        FIN=[s + pd.Timedelta(minutes=1) for s in starts],
    )


def calls_by_day(db_path: str) -> dict[str, int]:
    totals: dict[str, int] = {}
    for fecha, _hora, _campaign, _base, total, _agents in read_metrics(db_path):
        totals[fecha] = totals.get(fecha, 0) + total
    return totals


@pytest.fixture
def setup(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    db_path = str(tmp_path / "pipeline.db")
    reads: list[str] = []
    real_load = main.load_and_clean

    def counting_load(path):
        reads.append(path.name)
        return real_load(path)

    monkeypatch.setattr(main, "load_and_clean", counting_load)

    def run(**kwargs):
        reads.clear()
        processed = run_pipeline(data_dir, db_path, **kwargs)
        return processed, sorted(reads)

    return data_dir, db_path, run


def test_second_run_reads_nothing(setup, capsys):
    data_dir, db_path, run = setup
    write_xlsx(data_dir / "70_01-09.xlsx", day_frame(1, 2))
    assert run() == (1, ["70_01-09.xlsx"])
    capsys.readouterr()

    assert run() == (0, [])
    assert "Sin archivos nuevos ni modificados: la base está al día." in capsys.readouterr().out
    assert calls_by_day(db_path) == {"2026-09-01": 2}


def test_new_file_of_a_new_day_reads_only_that_file(setup, capsys):
    data_dir, db_path, run = setup
    write_xlsx(data_dir / "70_01-09.xlsx", day_frame(1, 2))
    run()
    write_xlsx(data_dir / "70_02-09.xlsx", day_frame(2, 3))

    assert run() == (1, ["70_02-09.xlsx"])
    assert "Nuevos o modificados: 1 · eliminados: 0 · días a recalcular: 1." in capsys.readouterr().out
    assert calls_by_day(db_path) == {"2026-09-01": 2, "2026-09-02": 3}


def test_new_fragment_of_an_existing_day_reloads_the_whole_day(setup):
    data_dir, db_path, run = setup
    write_xlsx(data_dir / "70_01-09.xlsx", day_frame(1, 2))
    run()
    write_xlsx(data_dir / "70_01-09_h2.xlsx", day_frame(1, 1, minute=30))

    assert run() == (2, ["70_01-09.xlsx", "70_01-09_h2.xlsx"])
    assert calls_by_day(db_path) == {"2026-09-01": 3}


def test_modified_file_is_reprocessed(setup):
    data_dir, db_path, run = setup
    path = data_dir / "70_01-09.xlsx"
    write_xlsx(path, day_frame(1, 2))
    run()
    write_xlsx(path, day_frame(1, 4))
    stat = path.stat()
    os.utime(path, ns=(stat.st_atime_ns, stat.st_mtime_ns + 1_000_000_000))

    assert run() == (1, ["70_01-09.xlsx"])
    assert calls_by_day(db_path) == {"2026-09-01": 4}


def test_removed_file_recomputes_its_day_or_keeps_it(setup, capsys):
    data_dir, db_path, run = setup
    write_xlsx(data_dir / "70_01-09.xlsx", day_frame(1, 2))
    write_xlsx(data_dir / "70_01-09_h2.xlsx", day_frame(1, 1, minute=30))
    run()
    assert calls_by_day(db_path) == {"2026-09-01": 3}

    (tmp_fragment := data_dir / "70_01-09_h2.xlsx").unlink()
    assert not tmp_fragment.exists()
    assert run() == (1, ["70_01-09.xlsx"])
    assert calls_by_day(db_path) == {"2026-09-01": 2}

    (data_dir / "70_01-09.xlsx").unlink()
    capsys.readouterr()
    assert run() == (0, [])
    assert "Aviso: campaña 70 2026-09-01: ya no hay archivos en /data" in capsys.readouterr().out
    assert calls_by_day(db_path) == {"2026-09-01": 2}
    conn = get_connection(db_path)
    assert load_ingested_files(conn) == {}
    conn.close()


def test_failing_file_is_not_recorded_and_retries(setup):
    data_dir, db_path, run = setup
    write_xlsx(data_dir / "70_01-09.xlsx", day_frame(1, 2).drop(columns=["CONEXION"]))

    assert run() == (0, ["70_01-09.xlsx"])
    conn = get_connection(db_path)
    assert "70_01-09.xlsx" not in load_ingested_files(conn)
    conn.close()
    assert run() == (0, ["70_01-09.xlsx"])


def test_full_reads_everything_and_rebuilds_the_registry(setup):
    data_dir, db_path, run = setup
    write_xlsx(data_dir / "70_01-09.xlsx", day_frame(1, 2))
    write_xlsx(data_dir / "71_01-09.xlsx", day_frame(1, 1))
    run()

    assert run(full=True) == (2, ["70_01-09.xlsx", "71_01-09.xlsx"])
    conn = get_connection(db_path)
    registry = load_ingested_files(conn)
    conn.close()
    assert registry["70_01-09.xlsx"]["days"] == {("70", "2026-09-01")}
    assert set(registry) == {"70_01-09.xlsx", "71_01-09.xlsx"}


def test_registry_survives_init_db(setup):
    data_dir, db_path, run = setup
    write_xlsx(data_dir / "70_01-09.xlsx", day_frame(1, 2))
    run()
    conn = get_connection(db_path)
    init_db(conn)
    init_db(conn)
    assert set(load_ingested_files(conn)) == {"70_01-09.xlsx"}
    conn.close()
