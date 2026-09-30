# Spec 017: Recomendaciones y diagnósticos en la vista «Campaña completa»

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). En el modo rango (Spec 016) hace falta el mismo par **diagnóstico + recomendaciones** del modo A/B, evaluado sobre el **período completo**.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — recomendaciones por rango]:** `GET /api/campaigns/{name}/recommendations?start_date=&end_date=&min_calls=` evaluará las **4 reglas de estrategia** de Spec 014 sobre el acumulado `start..end`:
    *   `ROUTING` (share ≥ `REC_MIN_VOLUME_SHARE` 0.10), `PACING` (`busy_rate ≥ DIAG_BUSY_THRESHOLD` 0.35), `SCHEDULE` (hora con más `agent_answers` y vecinas ±1), `AMD_DIVERGENCE` (umbral `REC_AMD_RATIO` 4.0, cap 1).
    *   **`VOLUME_DELTA` no aplica** en rango (no hay Día A vs Día B): el motor se invoca con `day_a=None, day_b=None` → la regla no dispara **sin tocar** `recommendations_engine.py`.
    *   Payload: `{campaign, start_date, end_date, min_calls_applied, recommendations[]}`; item **sin cambios** `{id, type, category, entity, text}` (espejo de Spec 010 RF6 con fechas de rango).
    *   `min_calls` default **50**, `ge=1` (sin selector en `FilterRangeBar` — decisión cerrada). Rango vacío o campaña inexistente → `recommendations: []`, HTTP **200**. Cap `RECOMMENDATIONS_LIMIT` (5) intacto.
    *   *Por qué:* Endpoint dedicado al rango, paralelo a `/diagnostics`; no se extiende `/compare/recommendations`.

*   **RF2 [State-driven — feed de diagnósticos del rango]:** El modo rango consumirá **sin cambios de backend** `GET /api/campaigns/{name}/diagnostics?start_date=&end_date=&min_calls=` (Spec 006 RF5) y lo presentará con el componente `DiagnosticsFeed` existente mapeando:
    *   `congested_gateways` → `rootCauses` con `{severity: "WARNING", type: "NETWORK_CONGESTION", entity: device, message}`.
    *   `burn_hours` → `rootCauses` con `{severity: "WARNING", type: "BUSY_HOUR", entity: hora, message}`.
    *   `peak_hours` → `positiveDrivers` con `{severity: "INFO", type: "PEAK_HOUR", entity: hora, message}`.
    *   El `message` en español del API se usa tal cual.
    *   *Por qué:* Reusar `DiagnosticsFeed`/`InsightCard` sin tocar su contrato (Spec 007); cero backend nuevo para diagnósticos.

*   **RF3 [Ubiquitous — panel de recomendaciones en rango]:** `RecommendationsPanel` (Spec 010 RF7 + secciones Spec 014 RF7) se renderiza en `RangeMode` **sin cambios de componente**: con solo las 4 reglas, la sección «Alertas del período» queda vacía y se omite; se ve «Estrategia de campaña».

*   **RF4 [Ubiquitous — posición en `RangeMode`]:** Orden en `App.tsx` (modo rango): `FilterRangeBar` → KPIs → **feed de diagnósticos** → **panel de recomendaciones** → grid (Daily + Gateways) → Hourly → footer. Misma disposición conceptual que el modo A/B (diagnóstico antes que recomendaciones).

*   **RF5 [Unwanted behavior — resiliencia]:** Recomendaciones y diagnósticos viven en **hooks propios** (`useRangeRecommendations`, `useRangeDiagnostics`) con abort + reload: un error en un panel **no** bloquea KPIs, gráficos ni el otro panel; cada sección maneja loading (skeleton), error (mensaje ES) y `[]` (empty-state ya existente).

*   **RF6 [Testing]:**
    *   `pytest`: contrato del endpoint rango (200, claves, `len ≤ 5`, **tipos sin `VOLUME_DELTA`**, `min_calls=0` → 422, campaña inexistente → `[]`, rango vacío → `[]`); test unitario `day_a=day_b=None → sin VOLUME_DELTA` en `test_recommendations.py`.
    *   Regresión: `/compare/recommendations` y `/compare/diagnostics` intactos; `npm test` sin cambios de aserciones.
    *   Smoke rango 01→15 (ver Criterios).

## Specs superadas por esta revisión

Ninguna. Spec **aditiva** (nuevo endpoint + secciones en `RangeMode`). Specs 006, 010 y 014 quedan **reusadas sin modificar**.

## Datos de entrada

*   Contadores ya en DB (Specs 011/012/015); rates derivados en runtime.
*   Reutiliza `get_device_metrics`, `get_hourly_trend` (rango), `build_recommendations(None, None, ...)` y `get_campaign_diagnostics` (ya existentes).
*   Constantes: `DIAG_BUSY_THRESHOLD`, `REC_AMD_RATIO`, `REC_MIN_VOLUME_SHARE`, `RECOMMENDATIONS_LIMIT`, `DIAG_CONGESTION_THRESHOLD` — **sin cambio**.

## Contrato JSON

### `GET /api/campaigns/{name}/recommendations?start_date=&end_date=&min_calls=`
```json
{
  "campaign": "35",
  "start_date": "2026-09-01",
  "end_date": "2026-09-15",
  "min_calls_applied": 50,
  "recommendations": [
    {"id": "rec_gw_pacing", "type": "PACING", "category": "WARNING", "entity": "GW20", "text": "..."},
    {"id": "rec_amd_divergence_iplan", "type": "AMD_DIVERGENCE", "category": "WARNING", "entity": "IPLAN", "text": "..."},
    {"id": "rec_gw_routing", "type": "ROUTING", "category": "SUCCESS", "entity": "IPLAN", "text": "..."},
    {"id": "rec_peak_hour", "type": "SCHEDULE", "category": "SUCCESS", "entity": "11", "text": "..."}
  ]
}
```
Sin datos → `recommendations: []`, HTTP 200. **Nunca** `VOLUME_DELTA` en este endpoint.

### `GET .../diagnostics` (Spec 006, sin cambios)
`{min_calls_applied, congested_gateways[], burn_hours[], peak_hours[]}`.

## Fuera de Alcance

*   VOLUME_DELTA o reglas nuevas de tendencia diaria en rango; selector `min_calls` en `FilterRangeBar`.
*   Cambios a `build_recommendations`, `recommendations_engine`, `/compare/*`, esquema DB, `/data`.
*   Rankings/patrones en modo rango (candidato Spec 018); auth; deploy.

## Criterios de Finalización

*   Endpoint rango smoke campaña **35**, `2026-09-01→2026-09-15`, `min_calls=50`: **4 items** en orden severidad/regla: **PACING GW20** (AA 3.65%, ocupado 48.34%), **AMD IPLAN** (8.376 automáticos vs 1.195 agentes), **ROUTING IPLAN** (AA 7.19%, share 46.9%), **SCHEDULE 11h** (366 de 2.104; vecinas 10h, 12h). Sin `VOLUME_DELTA`.
*   `GET /diagnostics` rango → congested **GW37 12.01%, IPLAN2 6.56%**; burn `[]`; peak 9h/10h/11h.
*   Tab «Campaña completa»: feed de diagnósticos + panel de recomendaciones visibles con loading/error/empty por sección; orden RF4.
*   `pytest -q` en verde; `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` en verde.
*   `/data` sin modificaciones (mtime intacto).
*   `task.md` en `[x]`.
