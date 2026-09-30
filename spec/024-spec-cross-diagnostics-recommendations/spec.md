# Spec 024: Diagnóstico y recomendaciones entre campañas

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). El tab «Comparar campañas» (Spec 023) ya muestra KPIs, gateways, bases y tendencias; hace falta el **mismo par diagnóstico + recomendaciones** del modo A/B, evaluado **entre dos campañas** sobre el rango fijo `2026-09-01 → 2026-09-15`.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — diagnóstico entre campañas]:** `GET /api/campaigns/compare-campaigns/diagnostics?campaign_a=&campaign_b=&start_date=&end_date=&min_calls=`
    *   `campaign_a`/`campaign_b` `min_length=1`; `min_calls` default **50**, `ge=1` ( Specs 007/017/023 ).
    *   Payload: `{campaign_a, campaign_b, start_date, end_date, min_calls_applied, summary, root_causes[], positive_drivers[], insights[], bases_comparison, gateways_comparison}` (espejo de Spec 007 RF4/RF6 con fechas de rango).
    *   `summary` = mismos campos que Spec 007 RF6 (totales A/B del rango, AA, busy, congestión, `health_score` de la campaña **B**).
    *   `bases_comparison` / `gateways_comparison` = intersección `total_calls ≥ min_calls` en ambas campañas (misma regla Spec 007 RF2 / 023 RF4); delta = B − A.
    *   `root_causes` / `positive_drivers` / `insights` = `evaluate_causes(summary_a, summary_b, bases_rows, gateway_rows)` ( Specs 007/… ; engine **sin cambios** ).
    *   *Por qué:* Reusar el engine de causas; las intersecciones ya se calculan en `build_cross_campaign_compare` → se extraen a helpers privados.

*   **RF2 [Unwanted behavior — campaña sin datos]:** Si `campaign_a` o `campaign_b` no existen en el rango: `summary`, `bases_comparison`, `gateways_comparison` → **`null`**; `root_causes` / `positive_drivers` / `insights` → **`[]`**; HTTP **200**.
    *   Campañas ok pero 0 segmentos ≥ `min_calls`: `summary` poblado, listas `[]` (o solo lo que dispare el engine con lo disponible).

*   **RF3 [State-driven — recomendaciones entre campañas]:** `GET /api/campaigns/compare-campaigns/recommendations?campaign_a=&campaign_b=&start_date=&end_date=&min_calls=`
    *   Payload: `{campaign_a, campaign_b, start_date, end_date, min_calls_applied, recommendations[]}`.
    *   Se evalúan **solo sobre la campaña B** (`get_device_metrics` / `get_hourly_trend` de B en el rango): patrón del día B en Spec 010.
    *   Motor: `build_recommendations(None, None, devices_B, hourly_B, min_calls, campaign_b)` → **`VOLUME_DELTA` suprimida** sin tocar `recommendations_engine.py` (patrón Spec 017 RF1).
    *   Tipos posibles: `ROUTING`, `PACING`, `SCHEDULE`, `AMD_DIVERGENCE` ( Specs 010/014/018/019 ). Cap `RECOMMENDATIONS_LIMIT` (5) intacto.
    *   `campaign_b` inexistente o 0 segmentos ≥ `min_calls` → `recommendations: []`, HTTP **200**.

*   **RF4 [Ubiquitous — rutas estáticas]:** Ambos endpoints viven bajo `/api/campaigns/compare-campaigns/…` (segmentos literales), **después** de `GET /compare-campaigns` en el router; sin conflicto con `/{campaign_name}/…`.
    *   *Por qué:* Misma razón que Spec 023 RF3.

*   **RF5 [UI — secciones en `CampaignsCompareMode`]:** Orden dentro del success block:
    1. `FilterCrossCampaignBar` ( Spec 023 RF2, sin cambios ).
    2. **KPIs** (`KpiGrid`, Spec 023 RF6.1).
    3. **Diagnóstico**: skeleton `h-40` + error propio + `<DiagnosticsFeed rootCauses positiveDrivers />` con **copy por defecto** (sin `positiveTitle`/`positiveDescription`).
    4. **Recomendaciones**: skeleton `h-32` + error propio + `<RecommendationsPanel />`.
    5. Hourly + Gateways (grid), Bases, Daily ( Spec 023 RF6 ).
    6. Footer: `A vs B · start → end · min_calls N`.
    *   Cada panel es independiente: un error no bloquea KPIs ni el otro panel ( RF resiliencia, Specs 016/017 ).
    *   Hooks propios con abort + `reload()`; re-apply con mismos filtros recarga los 3 hooks (compare + diagnostics + recommendations).

*   **RF6 [Testing]:**
    *   `pytest`: contrato de ambos endpoints (keys exactas), campaña inexistente → nulls/`[]` + 200, `min_calls=0` → 422, recomendaciones **sin `VOLUME_DELTA`** y `len ≤ 5`, regresión total (incl. keys de `compare-campaigns` Spec 023).
    *   `vitest`: `ModeTabs.test.tsx` con `vi.mock` de los 2 hooks nuevos; presencia de feed/panel en el tab campañas.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build`; `pytest -q`.

## Specs superadas por esta revisión

Ninguna. Spec **aditiva** (2 endpoints + secciones en `CampaignsCompareMode`). Specs 007, 010, 017, 023 quedan **reusadas sin modificar** de contrato (helpers privados extraídos sin cambiar payloads).

## Datos de entrada

*   DB poblada con campañas `35` y `38` ( Spec 022 ), 11 fechas 2026-09-01→15.
*   Reutiliza: `get_range_totals`, `get_breakdown_by_*_range`, `get_device_metrics`, `get_hourly_trend`, `evaluate_causes`, `build_recommendations(None, None, …)`, `compute_delta_percentage`, `compute_health_score`.
*   Constantes `config.py` **sin cambio**.

## Contrato JSON

### `GET /api/campaigns/compare-campaigns/diagnostics?campaign_a=&campaign_b=&start_date=&end_date=&min_calls=`
```jsonc
{
  "campaign_a": "35", "campaign_b": "38",
  "start_date": "2026-09-01", "end_date": "2026-09-15",
  "min_calls_applied": 50,
  "summary": SummaryKpi | null,
  "root_causes": DiagnosticEvent[],
  "positive_drivers": DiagnosticEvent[],
  "insights": Array<DiagnosticEvent & { polarity: "POSITIVE" | "NEGATIVE" }>,
  "bases_comparison": BaseComparison[] | null,
  "gateways_comparison": GatewayComparison[] | null
}
```
Sin datos → `summary`/`bases`/`gateways` `null` + listas `[]` + 200.

### `GET /api/campaigns/compare-campaigns/recommendations?campaign_a=&campaign_b=&start_date=&end_date=&min_calls=`
```jsonc
{
  "campaign_a": "35", "campaign_b": "38",
  "start_date": "2026-09-01", "end_date": "2026-09-15",
  "min_calls_applied": 50,
  "recommendations": [ { "id", "type", "category", "entity", "text", "excluded_amd?" } ]
}
```
**Nunca** `VOLUME_DELTA`. Sin datos → `recommendations: []` + 200.

## Fuera de Alcance

*   Cambios a `diagnostics_engine`, `recommendations_engine`, endpoints existentes (007/010/017/023), esquema DB, `/data`.
*   `VOLUME_DELTA` entre campañas; recomendaciones de campaña A; copy custom en `DiagnosticsFeed`; fechas editables en el filtro de cruce; auth; deploy.

## Criterios de Finalización

*   Docs `spec/024-…/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke `35 vs 38`, `2026-09-01→15`, `min_calls=50`: diagnostics 200 con mismos totales 35413/263198 y listas ≤ 5; recommendations 200 con `len ≤ 5` y **sin `VOLUME_DELTA`**.
*   Campaña `999` → nulls/`[]` + 200 en ambos endpoints.
*   UI: en «Comparar campañas», tras KPIs se ven `DiagnosticsFeed` y `RecommendationsPanel` con loading/error/empty por sección.
*   `pytest -q` en verde; `npm test` + `tsc` + `lint` + `build` en verde.
*   Contratos de Specs 007/010/017/023 sin cambios de aserciones.
*   `/data` mtimes intactos.
