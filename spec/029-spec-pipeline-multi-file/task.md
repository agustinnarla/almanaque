# Task checklist — Spec 029

- [x] Docs: `spec/029-spec-pipeline-multi-file/{spec,plan,task}.md` creados
- [x] `backend/main.py::run_pipeline`: agrupar `cleaned` por campaña (`extract_campaign`), flush único por campaña con `pd.concat` antes de `compute_metrics`, `replace_day` por fecha
- [x] Prints en español: `Leído:` por archivo, `Cargado: campaña X (N grupos).`, resumen final intacto; retorno = archivos OK
- [x] Nuevo `backend/test_pipeline_multi_file.py` con los 5 tests (unión con hora compartida, idempotencia, campañas coexistentes, archivo roto, dir vacío)
- [x] `pytest -q` = 161 (156 existentes intactos)
- [x] Mover 5 `.xls` de `data/_sin_procesar/` → `data/91_DD-09.xls` (mtime preservado, verificado contra baseline)
- [x] Correr pipeline → 38/38 procesados
- [x] DB: 5 días fragmentados con `SUM(total_calls)` > pre-fix; `91` ≈734K llamadas; `35=333` y `38=441` intactos
- [x] Smoke endpoints `91` (summary/bases/devices/hours/patterns/compare-campaigns) + regresión `35`/`38` + vite/proxy 200
- [x] `vitest` 152 · `tsc -b` 0 · lint 0 errores · build OK
- [x] Retirar `data/_sin_procesar/` y actualizar baseline de mtimes (38 archivos)
- [x] `task.md` en `[x]`

## Revisión (campaña 92 + RF7 memoria)

- [x] Docs actualizados: RF7 en `spec.md`, diseño de doble pasada en `plan.md`, esta checklist
- [x] `run_pipeline` en doble pasada: `_read_dates` (solo FECHA, `_parse_fecha` de `data_cleaner`) → grupos `(campaña, fecha)` → flush por día con `day_rows` filtrado
- [x] Prints: `Error en <archivo>: no se pudo determinar la FECHA.` · `Cargado: campaña <c> <fecha> (N grupos).`; retorno = paths únicos OK (`seen`)
- [x] Test nuevo `test_run_pipeline_skips_file_without_fecha` → `pytest -q` = **162** (los 5 previos intactos)
- [x] Snapshot previo de mtimes (60 archivos); renombrar 22 → `92_DD-MM.xls` / `92_DD-MM.xlsx` / `92_08-09_h2.xlsx` con mtime+size verificados
- [x] Pipeline → **60/60** procesados
- [x] DB: `92` = 11 fechas, `SUM(total_calls)` ≈ 1000787 (menos INICIO ≥ 20:00), horas 9–19; `35=333/35413`, `38=441/263198`, `91=1772/734207` intactos
- [x] Smoke endpoints `92` + regresión `35`/`38`/`91` + vite/proxy 200
- [x] `vitest` 152 · `tsc -b` 0 · lint 0 errores · build OK
- [x] Nuevo baseline `/data` = 60 archivos
- [x] Revisión en `[x]`
