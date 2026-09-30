# Plan 15: Ingesta de campaña completa (11 archivos)

## 1. Docs
*   `spec/015-spec-full-ingestion/{spec,plan,task}.md`.

## 2. Evidencia previa (RF5)
*   `stat -c '%n %Y' data/*.xls` → snapshot en `/tmp/data_mtimes_before.txt` (ya tomado: 9 nuevos + 2 existentes).

## 3. Renombrado autorizado (RF1)
*   Para `d in 03 04 07 08 09 10 11 14 15`: `mv data/$d-09.xls data/35_$d-09.xls`.
*   Verificar: 11 archivos `35_*`, ninguno suelto; mtimes post-rename = snapshot.

## 4. Ingesta (RF2)
*   `.venv/Scripts/python backend/main.py` → espera `11/11` procesados.
*   `replace_day` reemplaza fechas existentes (01/02) y agrega las 9 nuevas; sin duplicados por PK.

## 5. Verificación DB (RF3)
*   `SELECT fecha … GROUP BY fecha` → 11 fechas exactas.
*   `SELECT DISTINCT campaign` → solo `'35'`; contar filas con `"Sin Campaña"` y `1970-01-01` → 0.

## 6. Smoke de endpoints (rango completo)
*   `get_summary('35', 2026-09-01, 2026-09-15)` → totales > 0, rate no nulo (registrar valor).
*   `get_daily_trend` → 11 filas, rates ∈ [0,1].
*   `get_campaign_diagnostics` y `pattern_detector` vía repo → responden sin error.

## 7. Regresión
*   `.venv/Scripts/python -m pytest -q` → 0 failed (sin cambios de código).
*   `stat` mtimes post-pipeline = snapshot (pipeline solo lectura).
*   `task.md` `[x]`.

## Flujo
Docs → snapshot mtimes → rename → ingesta → verificación DB → smoke → pytest → mtimes finales → task [x].

## Fuera de alcance
Código, otros archivos, esquema, contratos, frontend.
