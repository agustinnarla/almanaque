import argparse
import traceback
from pathlib import Path

import pandas as pd

from data_cleaner import (
    MissingCriticalColumnsError,
    _parse_fecha,
    extract_campaign,
    load_and_clean,
    read_all_sheets,
)
from db_manager import (
    DEFAULT_DB_PATH,
    clear_ingested_files,
    forget_ingested_file,
    get_connection,
    init_db,
    load_ingested_files,
    record_ingested_file,
    replace_day,
)
from file_scanner import DATA_DIR, scan_data_dir
from metrics_engine import compute_metrics

CALL_ID_COLUMN = "Id. llamada"


def _drop_repeated_calls(day: pd.DataFrame, campaign: str, fecha: str) -> pd.DataFrame:
    if CALL_ID_COLUMN not in day.columns:
        return day
    repeated = day[CALL_ID_COLUMN].notna() & day.duplicated(subset=[CALL_ID_COLUMN])
    if repeated.any():
        print(
            f"Aviso: campaña {campaign} {fecha}: {int(repeated.sum())} llamadas repetidas "
            "entre archivos; se cuentan una sola vez."
        )
    return day[~repeated]


def _read_dates(file_path: Path | str) -> list[str]:
    try:
        frame = read_all_sheets(file_path, usecols=lambda column: str(column).upper() == "FECHA")
    except Exception:
        return []
    if frame.empty or "FECHA" not in frame.columns:
        return []
    parsed = _parse_fecha(frame["FECHA"])
    return sorted({stamp.date().isoformat() for stamp in parsed if not pd.isna(stamp)})


def _signature(file_path: Path) -> tuple[int, int]:
    stat = file_path.stat()  # read-only: /data is never written
    return stat.st_size, stat.st_mtime_ns


def _load_day(campaign: str, fecha: str, paths: list[Path], loaded: set[Path], failed: set[Path]) -> pd.DataFrame | None:
    frames = []
    for file_path in paths:
        if file_path in failed:
            continue
        try:
            cleaned = load_and_clean(file_path)
        except MissingCriticalColumnsError as error:
            print(f"Error en {file_path.name}: {error}")
            failed.add(file_path)
            continue
        except Exception as error:
            print(f"Error inesperado en {file_path.name}: {error}")
            traceback.print_exc()
            failed.add(file_path)
            continue
        frames.append(cleaned)
        if file_path not in loaded:
            loaded.add(file_path)
            print(f"Leído: {file_path.name} ({len(cleaned)} filas).")
    if not frames:
        return None
    return _drop_repeated_calls(pd.concat(frames, ignore_index=True), campaign, fecha)


def run_pipeline(
    data_dir: Path | str = DATA_DIR,
    db_path: Path | str = DEFAULT_DB_PATH,
    full: bool = False,
) -> int:
    """Load /data into the DB. Incremental by default (Spec 052): only the
    (campaign, fecha) days touched by new, modified or removed files are
    rebuilt, each from all of its files. `full=True` rebuilds everything."""
    files = scan_data_dir(data_dir)
    conn = get_connection(db_path)
    init_db(conn)
    if full:
        clear_ingested_files(conn)
    known = load_ingested_files(conn)

    current = {path.name: path for path in files}
    signatures = {path.name: _signature(path) for path in files}
    changed = [
        path for path in files
        if path.name not in known
        or (known[path.name]["size"], known[path.name]["mtime_ns"]) != signatures[path.name]
    ]
    removed = [name for name in known if name not in current]

    if not changed and not removed:
        conn.close()
        print(
            "Sin archivos nuevos ni modificados: la base está al día."
            if files else "No se encontraron archivos .xls/.xlsx para procesar."
        )
        return 0

    # Days each changed file holds now (needs a read of its FECHA column).
    file_days: dict[str, set[tuple[str, str]]] = {}
    for file_path in changed:
        dates = _read_dates(file_path)
        if not dates:
            print(f"Error en {file_path.name}: no se pudo determinar la FECHA.")
            continue
        campaign = extract_campaign(file_path)
        file_days[file_path.name] = {(campaign, fecha) for fecha in dates}

    affected: set[tuple[str, str]] = set()
    for name, days in file_days.items():
        affected |= days
    for name in [path.name for path in changed] + removed:
        affected |= known.get(name, {}).get("days", set())

    # Every present file of an affected day: changed ones by their new days,
    # unchanged ones by the days recorded for them.
    groups: dict[tuple[str, str], list[Path]] = {day: [] for day in sorted(affected)}
    for name, path in current.items():
        days = file_days.get(name) if name in file_days else (
            set() if path in changed else known.get(name, {}).get("days", set())
        )
        for day in days & affected:
            groups[day].append(path)

    print(
        f"Nuevos o modificados: {len(changed)} · eliminados: {len(removed)} · "
        f"días a recalcular: {len(affected)}."
    )

    loaded: set[Path] = set()
    failed: set[Path] = set()
    for (campaign, fecha), paths in groups.items():
        if not paths:
            print(
                f"Aviso: campaña {campaign} {fecha}: ya no hay archivos en /data; "
                "sus datos quedan en la base."
            )
            continue
        day = _load_day(campaign, fecha, paths, loaded, failed)
        if day is None:
            continue
        metrics = compute_metrics(day)
        day_rows = metrics[metrics["fecha"] == fecha]
        replace_day(conn, fecha, day_rows)
        print(f"Cargado: campaña {campaign} {fecha} ({len(day_rows)} grupos).")

    # Only files read without errors are recorded; the rest retry next run.
    for path in changed:
        if path.name in file_days and path not in failed:
            size, mtime_ns = signatures[path.name]
            record_ingested_file(conn, path.name, size, mtime_ns, file_days[path.name])
    for name in removed:
        forget_ingested_file(conn, name)

    conn.close()
    to_read = len(changed) + len({p for paths in groups.values() for p in paths} - set(changed))
    print(f"Pipeline finalizado. Archivos procesados: {len(loaded)}/{to_read}.")
    return len(loaded)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Carga /data en la base (incremental por defecto).")
    parser.add_argument("data_dir", nargs="?", default=DATA_DIR)
    parser.add_argument("db_path", nargs="?", default=DEFAULT_DB_PATH)
    parser.add_argument("--full", action="store_true", help="reprocesa todos los archivos")
    args = parser.parse_args()
    run_pipeline(args.data_dir, args.db_path, full=args.full)
