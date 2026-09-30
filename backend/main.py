import sys
import traceback
from pathlib import Path

import pandas as pd

from data_cleaner import (
    MissingCriticalColumnsError,
    _parse_fecha,
    extract_campaign,
    load_and_clean,
)
from db_manager import DEFAULT_DB_PATH, get_connection, init_db, replace_day
from file_scanner import DATA_DIR, scan_data_dir
from metrics_engine import compute_metrics


def _read_dates(file_path: Path | str) -> list[str]:
    try:
        frame = pd.read_excel(file_path, usecols=lambda column: str(column).upper() == "FECHA")
    except Exception:
        return []
    if frame.empty or "FECHA" not in frame.columns:
        return []
    parsed = _parse_fecha(frame["FECHA"])
    return sorted({stamp.date().isoformat() for stamp in parsed if not pd.isna(stamp)})


def run_pipeline(data_dir: Path | str = DATA_DIR, db_path: Path | str = DEFAULT_DB_PATH) -> int:
    files = scan_data_dir(data_dir)
    if not files:
        print("No se encontraron archivos .xls/.xlsx para procesar.")
        return 0

    groups: dict[tuple[str, str], list[Path]] = {}
    for file_path in files:
        dates = _read_dates(file_path)
        if not dates:
            print(f"Error en {file_path.name}: no se pudo determinar la FECHA.")
            continue
        campaign = extract_campaign(file_path)
        for fecha in dates:
            groups.setdefault((campaign, fecha), []).append(file_path)

    conn = get_connection(db_path)
    init_db(conn)

    seen: set[Path] = set()
    processed = 0
    for (campaign, fecha), paths in groups.items():
        frames = []
        for file_path in paths:
            try:
                cleaned = load_and_clean(file_path)
            except MissingCriticalColumnsError as error:
                print(f"Error en {file_path.name}: {error}")
                continue
            except Exception as error:
                print(f"Error inesperado en {file_path.name}: {error}")
                traceback.print_exc()
                continue
            frames.append(cleaned)
            if file_path not in seen:
                seen.add(file_path)
                processed += 1
                print(f"Leído: {file_path.name} ({len(cleaned)} filas).")
        if not frames:
            continue
        metrics = compute_metrics(pd.concat(frames, ignore_index=True))
        day_rows = metrics[metrics["fecha"] == fecha]
        replace_day(conn, fecha, day_rows)
        print(f"Cargado: campaña {campaign} {fecha} ({len(day_rows)} grupos).")

    conn.close()
    print(f"Pipeline finalizado. Archivos procesados: {processed}/{len(files)}.")
    return processed


if __name__ == "__main__":
    data_dir = sys.argv[1] if len(sys.argv) > 1 else DATA_DIR
    db_path = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_DB_PATH
    run_pipeline(data_dir, db_path)
