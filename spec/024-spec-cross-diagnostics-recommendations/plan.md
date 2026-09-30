# Plan 24: Diagnóstico y recomendaciones entre campañas

## 1. Docs
*   `spec/024-spec-cross-diagnostics-recommendations/{spec,plan,task}.md`.

## 2. Backend — repo (refactor + builders)
*   Extraer de `build_cross_campaign_compare` ( `campaigns_repo.py` ~878–937 ):
    *   `_cross_gateway_intersection(conn, a, b, start, end, min_calls) -> list[dict]`
    *   `_cross_base_intersection(conn, a, b, start, end, min_calls, total_a, total_b) -> list[dict]`
*   `build_cross_campaign_compare` los reutiliza → contrato 023 intacto.
*   `build_cross_campaign_diagnostics(conn, a, b, start, end, min_calls) -> dict`:
    *   Guard: `get_range_totals` de A o B `None` → envelope nulls + 3 listas `[]`.
    *   `summary` = mismo bloque que 023 / 007 RF6.
    *   `evaluate_causes` con summaries per-side `{agent_answer_rate, congestion_rate}` + intersecciones.
*   `build_cross_campaign_recommendations(conn, a, b, start, end, min_calls) -> dict`:
    *   Guard: `get_range_totals(B) is None` → `recommendations: []`.
    *   `devices = get_device_metrics(conn, B, start, end)`; `hourly = get_hourly_trend(conn, B, start, end)`.
    *   `build_recommendations(None, None, devices, hourly, min_calls, campaign_b)` → sin `VOLUME_DELTA`.

## 3. Backend — router
*   `GET /compare-campaigns/diagnostics` y `GET /compare-campaigns/recommendations` en `routers/campaigns.py`, **después** de `GET /compare-campaigns`.
*   Query: `campaign_a`/`campaign_b` `min_length=1`, `start_date`, `end_date`, `min_calls=50 ge=1`.

## 4. Backend — tests
*   `test_api.py`: keys exactas ×2, campaña inexistente → nulls/`[]` + 200, `min_calls=0` → 422, recs sin `VOLUME_DELTA` y `len ≤ 5`, regresión keys 023.

## 5. Frontend — types/api/hooks
*   `CrossCampaignDiagnosticsResponse`, `CrossCampaignRecommendationsResponse` en `types/api.ts`.
*   `fetchCrossCampaignDiagnostics`, `fetchCrossCampaignRecommendations` en `api/campaigns.ts`.
*   `useCrossCampaignDiagnostics`, `useCrossCampaignRecommendations` (abort + tick).

## 6. Frontend — App.tsx
*   `CampaignsCompareMode`: tras KPIs → DiagnosticsFeed (defaults) → RecommendationsPanel; skeletons/errors propios; `reload()` de los 3 hooks en re-apply.

## 7. Frontend — tests
*   `ModeTabs.test.tsx`: `vi.mock` de los 2 hooks nuevos + aserción de feed/panel en tab campañas (con datos mockeados).
*   Regresión: `npm test`, `tsc -b`, `lint`, `build`.

## 8. Verificación
1.  Smoke `35 vs 38` 01→15 (ver Criterios de la spec).
2.  `pytest -q` verde.
3.  mtimes `/data` = snapshot.
4.  `task.md [x]`.

## Flujo
Docs → refactor helpers + builders → router → tests backend → types/api/hooks → App.tsx → tests front → smoke → pytest → mtimes → task [x].

## Fuera de alcance
Engines, endpoints existentes, `/data`, esquema, VOLUME_DELTA entre campañas, recs de A, copy custom de DiagnosticsFeed, fechas editables.
