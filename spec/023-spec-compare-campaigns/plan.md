# Plan 23: Comparar 2 campañas (rango fijo)

## 1. Docs
*   `spec/023-spec-compare-campaigns/{spec,plan,task}.md`.

## 2. Backend — repo
*   `get_range_totals(conn, campaign, start, end) -> dict | None` (espejo de `get_day_totals` con `BETWEEN`; totales + `agent_answer_rate` + `busy_rate` + `congestion_rate`).
*   `get_breakdown_by_base_range(conn, campaign, start, end, min_calls) -> dict[str, dict]` (o parametrizar el actual: filtro de fecha `=` vs `BETWEEN`).
*   `build_cross_campaign_compare(conn, campaign_a, campaign_b, start, end, min_calls) -> dict`:
    *   Guard: si `get_range_totals` de alguna campaña es `None` → envelope nulls + `hourly_*`/`daily_*` `[]`.
    *   `summary` = mismos campos que `build_compare_diagnostics` (totales, AA, delta_rate, delta_percentage, busy, congestión, `health_score` de B).
    *   Gateways: `get_device_metrics` por campaña → intersección con `total_calls ≥ min_calls` en ambas → `GatewayComparison`.
    *   Bases: breakdown range por campaña → intersección `≥ min_calls` → `BaseComparison`.
    *   `hourly_a/b` = `get_hourly_trend`; `daily_a/b` = `get_daily_trend`.
    *   **Sin** `evaluate_causes` / `build_recommendations`.

## 3. Backend — router
*   `GET /compare-campaigns` en `routers/campaigns.py` (query: `campaign_a`, `campaign_b`, `start_date`, `end_date`, `min_calls=50 ge=1`).

## 4. Backend — tests
*   `test_api.py`: contract shape (keys, tipos), campaña inexistente → nulls+200, `min_calls` filtra intersección, regresión `pytest -q`.

## 5. Frontend — types/api/hook
*   `CrossCampaignCompareResponse` en `types/api.ts`.
*   `fetchCrossCampaignCompare` en `api/campaigns.ts`.
*   `useCrossCampaignCompare` (abort + tick, patrón existente).

## 6. Frontend — componentes
*   `FilterCrossCampaignBar` (campaignA, campaignB, minCalls, rango fijo informativo).
*   `ModeTabs`: 3er botón `tab-campaigns`; `ViewMode` + `CampaignsCompareMode` en `App.tsx`.
*   `KpiGrid`: props opcionales `labelA`/`labelB` (defaults = copy actual).
*   `HourlyTrendChart`: props opcionales de subtítulo/labels (default intacto).
*   Nuevo `DailyCompareChart` (dual A/B).
*   Nuevo `BasesCompareTable`.

## 7. Frontend — tests
*   Vitest: Filter submit, DailyCompareChart, BasesCompareTable, 3 tabs, KpiGrid labels.
*   Regresión: `npm test`, `tsc -b`, `lint`, `build`.

## 8. Verificación
1.  Smoke `35 vs 38` 01→15 (valores de RF finalización).
2.  `pytest -q` verde.
3.  mtimes `/data` = snapshot.
4.  `task.md [x]`.

## Flujo
Docs → repo+router+tests → types/api/hook → componentes → tests front → smoke → pytest → mtimes → task [x].

## Fuera de alcance
Diagnóstico, recomendaciones, fechas editables, esquema, `/data`, modos existentes (más allá de props opcionales).
