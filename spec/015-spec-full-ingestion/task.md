# Task 15: Ingesta de campaña completa (11 archivos)

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Evidencia previa
- [x] Snapshot de mtimes de `/data` antes del rename (`/tmp/data_mtimes_before.txt`).

## 3. Renombrado autorizado (RF1)
- [x] 9 archivos → `35_DD-09.xls`; 11 archivos `35_*` en total.
- [x] mtimes post-rename idénticos al snapshot.

## 4. Ingesta (RF2)
- [x] `backend/main.py` → **11/11 procesados** (67, 46, 40, 44, 38, 27, 15, 15, 15, 15, 11 grupos).

## 5. Verificación DB (RF3)
- [x] 11 fechas exactas: 01, 02, 03, 04, 07, 08, 09, 10, 11, 14, 15.
- [x] Solo `campaign='35'` (0 filas ajenas); sin `"Sin Campaña"` ni `1970-01-01`.

## 6. Smoke + regresión
- [x] `summary 01→15`: total **35.413**, agents **2.104**, machines **11.282**, rechazadas **22.027**, AA **0.0594**.
- [x] `daily` = **11** puntos, rates ∈ [0,1] (mín 0.0390 el 15/09, máx 0.0852 el 11/09).
- [x] `diagnostics` rango completo responde (peak_hours: 9, 10, 11).
- [x] `pytest -q` en verde (**130 passed**).
- [x] mtimes finales = snapshot (**idénticos**).
- [x] Marcar items `[x]`.
