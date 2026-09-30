# Plan de implementación — Spec 029

## 1. Diseño del cambio en `backend/main.py::run_pipeline`

**Actual (líneas 11–38):** por cada archivo → `load_and_clean` → `compute_metrics` → `replace_day` por fecha → imprime `Procesado:`. El DELETE por fecha+campaña del segundo fragmento borra al primero.

**Nuevo flujo:**

```python
def run_pipeline(data_dir=DATA_DIR, db_path=DEFAULT_DB_PATH) -> int:
    files = scan_data_dir(data_dir)
    if not files:
        print("No se encontraron archivos .xls/.xlsx para procesar.")
        return 0

    pending: dict[str, list[pd.DataFrame]] = {}   # campaña -> [cleaned, ...]
    processed = 0
    for file_path in files:
        try:
            cleaned = load_and_clean(file_path)
            pending.setdefault(extract_campaign(file_path), []).append(cleaned)
            processed += 1
            print(f"Leído: {file_path.name} ({len(cleaned)} filas).")
        except MissingCriticalColumnsError as error:
            print(f"Error en {file_path.name}: {error}")
        except Exception as error:
            print(f"Error inesperado en {file_path.name}: {error}")
            traceback.print_exc()

    conn = get_connection(db_path)
    init_db(conn)
    for campaign, frames in pending.items():
        metrics = compute_metrics(pd.concat(frames, ignore_index=True))
        for fecha in metrics["fecha"].unique():
            day_rows = metrics[metrics["fecha"] == fecha]
            replace_day(conn, fecha, day_rows)
        print(f"Cargado: campaña {campaign} ({len(metrics)} grupos).")

    conn.close()
    print(f"Pipeline finalizado. Archivos procesados: {processed}/{len(files)}.")
    return processed
```

**Notas de diseño:**

*   Import nuevo: `extract_campaign` desde `data_cleaner` (misma fuente que usa `load_and_clean` → coherencia garantizada).
*   `pd.concat` de crudos **antes** de `compute_metrics`: los fragmentos comparten la hora de corte → unir métricas agregadas chocaría con la PK y promediaría mal los `avg_*`.
*   `init_db`/conexión se abren **después** de la lectura (sin lock de escritura durante el escaneo) y antes del flush; si `pending` queda vacío, la DB igual se inicializa (comportamiento actual preservado).
*   Orden de iteración de `pending`: orden de inserción de campañas (35 → 38 → 91 con el orden actual de archivos) — sin dependencia funcional.
*   Archivos sin prefijo → campaña `Sin Campaña` (no aplica tras la migración, pero el comportamiento queda).

## 2. Tests — `backend/test_pipeline_multi_file.py` (5)

Helpers locales: escribir `.xlsx` con `DataFrame.to_excel` (openpyxl 3.1.5, sin writer para `.xls`), columnas mínimas `REQUIRED_COLUMNS` (`FECHA` numérico `YYYYMMDD`, `BASE`, `INICIO`, `CONEXION`, `FIN`, `ESTADO`, `SUB_ESTADO`); DB en `tmp_path` vía `run_pipeline(dir, db)`.

| # | Test | Verificación |
|---|------|--------------|
| 1 | `test_run_pipeline_merges_fragments_same_day` | 2 archivos `70_01-09.xlsx` (hora 10) y `70_01-09_p2.xlsx` (horas 10 y 11) → `processed == 2`, la hora 10 tiene `total_calls` = suma de ambos fragmentos, hora 11 presente, una sola fecha en DB |
| 2 | `test_run_pipeline_is_idempotent` | correr 2 veces → mismo número de filas y mismos `total_calls` |
| 3 | `test_run_pipeline_keeps_different_campaigns_same_day` | `70_01-09.xlsx` + `71_01-09.xlsx` → ambas campañas presentes en la fecha |
| 4 | `test_run_pipeline_skips_broken_file_and_keeps_rest` | archivo con columna crítica faltante (`70_02-09.xlsx`) + fragmento OK (`70_02-09_p2.xlsx`) → `processed == 1`, el día 02 cargado, no lanza excepción |
| 5 | `test_run_pipeline_empty_dir_returns_zero` | dir sin `.xls/.xlsx` → 0 y sin excepción |

## 3. Migración de datos (operación one-off, post-fix)

1. `data/_sin_procesar/{07,08,09,11,14}-09.xls` → `data/91_DD-09.xls` (renombrado, mtime preservado; verificación de integridad contra el baseline de mtimes).
2. Correr `cd backend && ../.venv/Scripts/python main.py` → **38/38 archivos** (22 de 35/38 + 11 de 91 + 5 de 91 restaurados = 38; los 6+5=11 originales de 91 ya están en `data/`).
3. Verificación DB:
    *   `SUM(total_calls)` por día de `07,08,09,11,14` > valor pre-fix (652834 total → esperado ≈734K).
    *   `35 = 333`, `38 = 441` intactas (mismos `agent_answers`).
    *   `91` sigue en 11 fechas y horas 9–19.
4. Retirar `data/_sin_procesar/` (queda vacía).
5. Actualizar baseline de mtimes: 38 archivos en `data/`.

## 4. Verificación final

*   `pytest -q` = 161 · `npx vitest run` = 152 · `npx tsc -b` · `npm run lint` (0 errores) · `npm run build`.
*   Smoke HTTP: `91` summary/bases/devices/hours/patterns/compare-campaigns; regresión `35`/`38` (mismos números que el baseline de esta sesión); vite `:5173` + proxy `/api` → 200.
*   `task.md` con todos los ítems en `[x]`.

---

# Revisión (campaña 92 + RF7 memoria)

## 5. Motivo

La campaña 92 suma **22 archivos / ~1.000.787 filas crudas** (08-09 con 3 fragmentos). Con el diseño "agrupar todos los `cleaned` por campaña antes de flush", el pico sería **~2.1M filas** (35+38+91+92) en RAM ≈ >4 GB, contra **2.4 GB libres** de la máquina (7.8 GB totales) → riesgo de `MemoryError`. Refactor a **doble pasada con flush por día** (pico = un día, máx. 142615 filas).

## 6. Nuevo diseño de `backend/main.py::run_pipeline`

```python
def _read_dates(file_path) -> list[str]:
    """Fechas ISO presentes en la columna FECHA; [] si no hay ninguna legible."""
    try:
        frame = pd.read_excel(file_path, usecols=lambda c: str(c).upper() == "FECHA")
    except Exception:
        return []
    if frame.empty or "FECHA" not in frame.columns:
        return []
    parsed = _parse_fecha(frame["FECHA"])          # misma lógica que data_cleaner
    return sorted({stamp.date().isoformat() for stamp in parsed if not pd.isna(stamp)})


def run_pipeline(data_dir=DATA_DIR, db_path=DEFAULT_DB_PATH) -> int:
    files = scan_data_dir(data_dir)
    if not files: ... return 0

    # Pasada 1 (barata): grupos (campaña, fecha) -> paths
    groups: dict[tuple[str, str], list[Path]] = {}
    for file_path in files:
        dates = _read_dates(file_path)
        if not dates:
            print(f"Error en {file_path.name}: no se pudo determinar la FECHA.")
            continue
        campaign = extract_campaign(file_path)
        for fecha in dates:
            groups.setdefault((campaign, fecha), []).append(file_path)

    conn = get_connection(db_path); init_db(conn)

    # Pasada 2: flush por día, memoria liberada tras cada grupo
    seen: set[Path] = set(); processed = 0
    for (campaign, fecha), paths in groups.items():
        frames = []
        for file_path in paths:
            try:
                cleaned = load_and_clean(file_path)
            except MissingCriticalColumnsError as error:
                print(f"Error en {file_path.name}: {error}"); continue
            except Exception as error:
                print(f"Error inesperado en {file_path.name}: {error}")
                traceback.print_exc(); continue
            frames.append(cleaned)
            if file_path not in seen:
                seen.add(file_path); processed += 1
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
```

**Notas de diseño de la revisión:**

*   Import adicional: `_parse_fecha` desde `data_cleaner` (misma fuente del parseo de FECHA → sin duplicar lógica; `data_cleaner` no se modifica).
*   Archivo **multi-fecha**: pertenece a varios grupos, se lee una sola vez por grupo (efecto "Leído"/`processed` deduplicado con `seen`; en la práctica los exports son de 1 fecha).
*   Archivo **sin FECHA legible**: excluido en la pasada 1 (equivale a archivo roto; si no existe la columna, `load_and_clean` lanzaría `MissingCriticalColumnsError` igualmente).
*   `day_rows` filtra por la fecha del grupo → un archivo con filas de otra fecha no contamina el flush de este día; el DELETE de `replace_day` solo alcanza la campaña del grupo.
*   `processed` = `len(seen)` (paths únicos que pasaron `load_and_clean`).

## 7. Tests (6)

| # | Test | Verificación |
|---|------|--------------|
| 1–5 | los existentes | intactos (los grupos resultantes son los mismos) |
| 6 | `test_run_pipeline_skips_file_without_fecha` | `.xlsx` sin columna `FECHA` → `processed == 0`, sin excepción, mensaje de error |

## 8. Migración de datos (92)

1. Snapshot previo de mtimes (60 archivos) en `data_baseline_pre92.json`.
2. Renombres: 11 `.xls` → `92_DD-MM.xls` · 10 `*Hoja 1.xlsx` → `92_DD-MM.xlsx` · `08-09 Hoja 2.xlsx` → `92_08-09_h2.xlsx` (22 archivos; verificación de mtime+size post-rename).
3. Pipeline → **60/60**.
4. Verificación DB: `92` = 11 fechas, `SUM(total_calls)` ≈ 1000787 (menos INICIO ≥ 20:00), horas 9–19, bases `0,4,7,10,11,12,14`; `35=333/35413`, `38=441/263198`, `91=1772/734207` intactos.
5. Smoke `92` + regresión 35/38/91; suites; baseline `/data` = 60 archivos.
