# Task 24: Diagnóstico y recomendaciones entre campañas

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Backend — repo
- [x] Extraer helpers `_cross_gateway_intersection` / `_cross_base_intersection` (023 intacto).
- [x] `build_cross_campaign_diagnostics` (evaluate_causes + summary + intersecciones).
- [x] `build_cross_campaign_recommendations` (solo campaña B, sin VOLUME_DELTA).

## 3. Backend — router
- [x] `GET /api/campaigns/compare-campaigns/diagnostics`.
- [x] `GET /api/campaigns/compare-campaigns/recommendations`.

## 4. Backend — tests
- [x] Contract keys ×2; campaña inexistente → nulls/`[]` + 200; `min_calls=0` → 422; sin `VOLUME_DELTA`; regresión 023.

## 5. Frontend — types/api/hooks
- [x] Tipos + fetchers + `useCrossCampaignDiagnostics` / `useCrossCampaignRecommendations`.

## 6. Frontend — App.tsx
- [x] Secciones DiagnosticsFeed + RecommendationsPanel tras KPIs (order RF5); reload de 3 hooks.

## 7. Frontend — tests
- [x] ModeTabs mocks + aserciones; `npm test` + `tsc -b` + `lint` + `build` verdes.

## 8. Verificación y cierre
- [x] Smoke `35 vs 38` 01→15 (diagnostics + recommendations).
- [x] `pytest -q` verde.
- [x] mtimes `/data` intactos.
- [x] Marcar items `[x]`.
