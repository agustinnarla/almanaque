# Task 20: Diagnósticos enriquecidos del rango

## 1. Docs
- [x] Reescribir `spec.md`, `plan.md`, `task.md` en formato SDD.

## 2. Constantes front
- [x] `frontend/src/lib/rangeThresholds.ts` con umbrales RF1–RF3 + top-3.

## 3. Lógica pura
- [x] `rangeDiagnostics.ts`: `mergePeakWindows`, `buildReliableTrunk`, `buildBestDay`, `rankPositiveDrivers`.

## 4. UI
- [x] `mapRangeDiagnostics` en `App.tsx` usa la lógica nueva + top-3.
- [x] RangeMode pasa header «Puntos destacados» / «Fortalezas…»; compare intacto.
- [x] `DiagnosticsFeed` con props opcionales de título/descripción.

## 5. Tests front
- [x] Tests de fusión de picos (9–11, aisladas, huecos).
- [x] Tests de `RELIABLE_TRUNK` (GW39, descarte AMD, descarte busy, vacío).
- [x] Tests de `BEST_DAY` (rate, min_calls, vacío).
- [x] Tests de header custom vs default en `DiagnosticsFeed`.
- [x] Regresión `npm test`.

## 6. Verificación y cierre
- [x] `pytest -q` → 143 (sin cambios backend).
- [x] `npm test` + `tsc -b` + `lint` + `build` en verde (53 tests front).
- [x] Smoke: PEAK_WINDOW 9h–11h; TRUNK GW39; BEST_DAY 2026-09-11; top-3.
- [x] `/data` mtime intacto.
- [x] Marcar items `[x]`.
