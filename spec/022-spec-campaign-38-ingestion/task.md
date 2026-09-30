# Task 22: Ingesta campaña 38 + fix multi-campaña

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Fix `replace_day` (RF2)
- [x] `db_manager.py`: DELETE `WHERE fecha = ? AND campaign IN (…)`; empty → sin DELETE.
- [x] Nuevo test `test_replace_day_keeps_other_campaigns_same_date` + `test_replace_day_empty_dataframe_is_noop`.
- [x] Tests `replace_day` existentes en verde.

## 3. Evidencia previa (RF6)
- [x] Snapshot mtimes de los 22 archivos.

## 4. Renombrado autorizado (RF1)
- [x] 11 archivos → `38_DD-09.xls`; 11 `38_*` + 11 `35_*`; ninguno suelto.
- [x] mtimes post-rename idénticos al snapshot.

## 5. Ingesta (RF3)
- [x] `backend/main.py` → **22/22 procesados**.

## 6. Verificación DB (RF4)
- [x] `DISTINCT campaign = ('35','38')`; 22 pares fecha-campaña.
- [x] `campaign='35'` = **333 filas** intactas; `campaign='38'` = **441 filas**, 11 fechas.
- [x] `"Sin Campaña"` = 0; `1970-01-01` = 0.

## 7. Smoke campaña 38
- [x] `summary 01→15`: totales > 0, AA no nulo.
- [x] `daily` = 11 puntos, rates ∈ [0,1].
- [x] `diagnostics`/`recommendations` responden sin error.

## 8. Regresión y cierre
- [x] `pytest -q` en verde (**145 passed**).
- [x] mtimes finales de los 22 = snapshot.
- [x] Marcar items `[x]`.

