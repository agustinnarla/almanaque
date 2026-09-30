# Plan 17: Recomendaciones y diagnósticos en «Campaña completa»

## 1. Docs
*   `spec/017-spec-range-recommendations/{spec,plan,task}.md`.

## 2. Backend — repo (`repositories/campaigns_repo.py`)
*   Nueva función `build_range_recommendations(conn, campaign_name, start_date, end_date, min_calls) -> dict`:
    *   `devices = get_device_metrics(conn, name, start, end)`
    *   `hourly = get_hourly_trend(conn, name, start, end)`
    *   `recs = build_recommendations(None, None, devices, hourly, min_calls, name)` (VOLUME_DELTA no dispara por guard `day_a is None`)
    *   Retorna `{campaign, start_date, end_date, min_calls_applied, recommendations}`.
*   Sin SQL nuevo; sin tocar `build_compare_recommendations`.

## 3. Backend — endpoint (`routers/campaigns.py`)
*   `GET /{campaign_name}/recommendations?start_date=&end_date=&min_calls=50` (`min_calls: Query(50, ge=1)`).
*   Diagnósticos: **cero backend** (`GET /diagnostics` ya existe).

## 4. Backend — tests
*   `test_api.py`:
    *   `test_range_recommendations_contract`: 200, claves exactas, `len ≤ 5`, types ⊆ {ROUTING, PACING, SCHEDULE, AMD_DIVERGENCE}, **`VOLUME_DELTA` ausente**.
    *   `test_range_recommendations_empty_range`: rango sin datos → `recommendations: []`, 200.
    *   `test_range_recommendations_unknown_campaign`: → `[]`.
    *   `test_range_recommendations_min_calls_validation`: `min_calls=0` → 422.
    *   Regresión: tests de `/compare/recommendations` sin tocar.
*   `test_recommendations.py`:
    *   `test_no_volume_delta_without_days`: `day_a=None, day_b=None` con devices/hourly → types sin `VOLUME_DELTA`.

## 5. Frontend — tipos y API
*   `types/api.ts`: `RangeRecommendationsResponse` (`{campaign, start_date, end_date, min_calls_applied, recommendations}`) y `RangeDiagnosticsResponse` (`{min_calls_applied, congested_gateways, burn_hours, peak_hours}` con shapes de Spec 006).
*   `api/overview.ts`: `fetchRangeRecommendations(campaign, from, to, minCalls, signal?)`, `fetchRangeDiagnostics(campaign, from, to, minCalls, signal?)`.

## 6. Frontend — hooks
*   `hooks/useRangeRecommendations.ts`: patrón de `useRecommendations` (deps primitivas, abort, reload); params `{campaign, from, to, minCalls=50}`.
*   `hooks/useRangeDiagnostics.ts`: mismo patrón sobre `RangeDiagnosticsResponse`.
*   **Separados** de `useCampaignOverview` (RF5: un error no bloquea KPIs).

## 7. Frontend — integración `RangeMode` (`App.tsx`)
*   Tras los KPIs y antes del grid Daily/Gateways:
    1.  **Diagnósticos**: mapear `RangeDiagnosticsResponse` → `{rootCauses, positiveDrivers}` de `DiagnosticEvent` (RF2: congested+burn → negativos WARNING; peak → positivos INFO; `message` tal cual) y render `<DiagnosticsFeed />` **sin tocar el componente**.
        *   Loading → skeleton; error → `role="alert"` ES; sin datos → feed con listas vacías (ya tiene empty-states).
    2.  **Recomendaciones**: `<RecommendationsPanel recommendations={...} />` reusado (RF3); loading/error/empty como en modo A/B.
*   `min_calls` fijo **50** (constante `DEFAULT_MIN_CALLS` o literal; sin selector).

## 8. Tests frontend
*   Sin tests nuevos obligatorios (componentes reusados). Regresión: los 35 existentes intactos.

## 9. Verificación
1.  `.venv/Scripts/python -m pytest -q` → 0 failed.
2.  `cd frontend && npm test && npx tsc -b && npm run lint && npm run build`.
3.  Smoke (backend vivo o TestClient):
    *   `GET /api/campaigns/35/recommendations?start_date=2026-09-01&end_date=2026-09-15` → 4 items esperados (PACING GW20, AMD IPLAN, ROUTING IPLAN, SCHEDULE 11), sin VOLUME_DELTA.
    *   `GET /api/campaigns/35/diagnostics?start_date=2026-09-01&end_date=2026-09-15` → GW37/IPLAN2 congested; peak 9/10/11.
    *   Comparar: `/compare/recommendations` y `/compare/diagnostics` sin cambios.
4.  `stat` mtime `/data` intacto.
5.  `task.md` items en `[x]`.

## Flujo
1.  Docs → repo → endpoint → tests backend.
2.  Tipos/API → hooks → `RangeMode`.
3.  `pytest` + suite front + smoke + mtimes → `task.md [x]`.

## Fuera de alcance
*   VOLUME_DELTA en rango, selector min_calls, cambios de engine/compare/esquema/`/data`, rankings en modo rango.
