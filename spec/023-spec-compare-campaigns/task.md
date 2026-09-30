# Task 23: Comparar 2 campañas (rango fijo)

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Backend — repo
- [x] `get_range_totals` (BETWEEN, espejo de `get_day_totals`).
- [x] Breakdown de bases por rango (o parametrizar el día-acentuado).
- [x] `build_cross_campaign_compare` (summary + gateways + bases + hourly + daily; sin causes/recommendations).

## 3. Backend — router
- [x] `GET /api/campaigns/compare-campaigns`.

## 4. Backend — tests
- [x] Contract shape; campaña inexistente → nulls+200; `min_calls` filtra; regresión.

## 5. Frontend — types/api/hook
- [x] `CrossCampaignCompareResponse`, `fetchCrossCampaignCompare`, `useCrossCampaignCompare`.

## 6. Frontend — componentes
- [x] `FilterCrossCampaignBar` (A/B/minCalls + rango fijo informativo).
- [x] `ModeTabs` 3er tab + `CampaignsCompareMode` en `App.tsx`.
- [x] `KpiGrid` `labelA`/`labelB` opcionales; `HourlyTrendChart` labels opcionales.
- [x] Nuevo `DailyCompareChart`; nuevo `BasesCompareTable`.

## 7. Frontend — tests
- [x] Vitest: Filter, DailyCompareChart, BasesCompareTable, 3 tabs, KpiGrid labels.
- [x] `npm test` + `tsc -b` + `lint` + `build` verdes.

## 8. Verificación y cierre
- [x] Smoke `35 vs 38` 01→15: totals 35413/263198, AA 0.0594/0.0489, 11 daily c/u, gateways/bases poblados.
- [x] `pytest -q` verde.
- [x] mtimes `/data` intactos.
- [x] Marcar items `[x]`.
