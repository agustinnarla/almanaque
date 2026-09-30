# Plan 22: Ingesta campaña 38 + fix multi-campaña

## 1. Docs
*   `spec/022-spec-campaign-38-ingestion/{spec,plan,task}.md`.

## 2. Fix `replace_day` (RF2)
*   `backend/db_manager.py` → DELETE `WHERE fecha = ? AND campaign IN (…)`:
    *   Extraer `campaigns` únicos de `metrics_df` (o `[DEFAULT_CAMPAIGN]` si falta la columna).
    *   `metrics_df.empty` → **sin DELETE**, `return 0`.
    *   Placeholders dinámicos (`IN (?,?,…)`).
*   Tests `backend/test_db.py`:
    *   Nuevo `test_replace_day_keeps_other_campaigns_same_date` (35 y 38 en misma fecha; reemplazo aislado).
    *   Regresión de los 8 tests `replace_day` existentes.

## 3. Evidencia previa (RF6)
*   `stat -c '%n %Y' data/*.xls` → snapshot `/tmp/data_mtimes_before_022.txt` (22 archivos).

## 4. Renombrado autorizado (RF1)
*   Para `d in 01 02 03 04 07 08 09 10 11 14 15`: `mv data/$d-09.xls data/38_$d-09.xls`.
*   Verificar: 11 `38_*`, 11 `35_*`, ninguno suelto; mtimes post-rename = snapshot.

## 5. Ingesta (RF3)
*   `.venv/Scripts/python backend/main.py` → espera **22/22** procesados (orden: `35_*` → `38_*`).

## 6. Verificación DB (RF4)
*   `SELECT DISTINCT campaign` → `('35','38')`.
*   Pares `(fecha, campaign)` → 22.
*   `COUNT WHERE campaign='35'` → **333** (intacta).
*   `COUNT WHERE campaign='38'` → > 0; sus 11 fechas presentes.
*   `"Sin Campaña"` = 0; `1970-01-01` = 0.

## 7. Smoke campaña 38
*   `get_summary('38', 2026-09-01, 2026-09-15)` → totales > 0, rate no nulo.
*   `get_daily_trend('38', …)` → 11 filas, rates ∈ [0,1].
*   `get_campaign_diagnostics('38', …)` y recommendations vía repo → responden sin error.

## 8. Regresión y cierre
*   `.venv/Scripts/python -m pytest -q` → 0 failed (143 + tests nuevos).
*   `stat` mtimes post-pipeline = snapshot (22 archivos).
*   `task.md` `[x]`.

## Flujo
Docs → fix `replace_day` + tests → snapshot mtimes → rename → ingesta → verificación DB → smoke 38 → pytest → mtimes finales → task [x].

## Fuera de alcance
Frontend, nuevos endpoints, esquema, contenido de `/data`, archivos de campaña 35.
