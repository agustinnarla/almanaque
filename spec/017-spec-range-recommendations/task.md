# Task 17: Recomendaciones y diagnósticos en «Campaña completa»

## 1. Docs
- [x] `spec.md`, `plan.md`, `task.md`.

## 2. Backend — repo y endpoint
- [x] `build_range_recommendations` en `campaigns_repo.py` (devices/hourly rango + engine con `None, None`).
- [x] `GET .../recommendations` en `routers/campaigns.py` (`start_date`, `end_date`, `min_calls=50 ge=1`).

## 3. Backend — tests
- [x] `test_api.py`: contrato rango (200, claves, `len≤5`, sin `VOLUME_DELTA`), rango vacío → `[]`, campaña inexistente → `[]`, `min_calls=0` → 422.
- [x] `test_recommendations.py`: `test_no_volume_delta_without_days`.
- [x] Regresión: compare recommendations/diagnostics intactos (`test_compare_recommendations_contract_intact`).

## 4. Frontend — tipos, API, hooks
- [x] `types/api.ts`: `RangeRecommendationsResponse`, `RangeDiagnosticsResponse` (+ items).
- [x] `api/overview.ts`: `fetchRangeRecommendations`, `fetchRangeDiagnostics`.
- [x] `hooks/useRangeRecommendations.ts`, `hooks/useRangeDiagnostics.ts` (abort + reload).

## 5. Frontend — RangeMode
- [x] Mapeo `RangeDiagnostics → DiagnosticEvent` + `<DiagnosticsFeed />` tras KPIs.
- [x] `<RecommendationsPanel />` debajo del feed; `min_calls=50` fijo (`DEFAULT_MIN_CALLS`).
- [x] Loading skeleton / error ES / empty por sección; `reloadRange()` recarga los 3 hooks.

## 6. Verificación y cierre
- [x] `pytest -q` en verde (137 passed).
- [x] `npm test` (35) + `npx tsc -b` + `npm run lint` (solo warnings preexistentes) + `npm run build` en verde.
- [x] Smoke rango 01→15: 4 recs (PACING GW20, AMD IPLAN, ROUTING IPLAN, SCHEDULE 11h) sin VOLUME_DELTA; diagnostics GW37/IPLAN2 + peak 9/10/11.
- [x] `/data` mtime intacto (XLS_MTIMES_OK; sin archivos nuevos).
- [x] Marcar items `[x]`.
