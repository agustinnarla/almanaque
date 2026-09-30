# Plan 10: Recomendaciones Prescriptivas

## 1. Configuración (`backend/config.py`)
*   `REC_VOLUME_DROP_PCT = -10.0` (RF5).
*   `REC_AMD_RATIO = 4.0` (RF4).
*   `RECOMMENDATIONS_LIMIT = 5` (RF6).
*   RF2 reutiliza `DIAG_BUSY_THRESHOLD` existente (import, sin duplicar).

## 2. Motor (`backend/services/recommendations_engine.py`)
*   `build_recommendations(day_a, day_b, devices_b, hourly_b, min_calls) -> list[dict]` orquestador:
    *   **RF1** `rec_gw_routing`: `devices_b` con `total_calls ≥ min_calls` y `agent_answer_rate` no `null`; mejor rate → `ROUTING/SUCCESS`.
    *   **RF2** `rec_gw_pacing`: mismo filtro con `busy_rate ≥ DIAG_BUSY_THRESHOLD`; peor `busy_rate` (una sola rec) → `PACING/WARNING`.
    *   **RF3** `rec_peak_hour`: `hourly_b` con `total_calls ≥ min_calls` y `agent_answers` máximo; texto con hora y vecinas ±1 (solo horas presentes) → `SCHEDULE/SUCCESS`.
    *   **RF4** `rec_amd_divergence`: candidatos con `machine_answers ≥ REC_AMD_RATIO × agent_answers` (agent=0 y machine>0 → ratio infinito; ambos 0 → no); ordenar por **peor ratio** (`machine/agent` DESC, empate `total_calls` DESC); **máximo 1** item → `AMD_DIVERGENCE/WARNING`.
    *   **RF5** `rec_volume_drop`: `day_a.agent_answers > 0` y `((b−a)/a)×100 ≤ REC_VOLUME_DROP_PCT` → `VOLUME_DELTA/WARNING`.
*   Orden final: severidad `CRITICAL→WARNING→SUCCESS→INFO` + empate por orden fijo de reglas; cap `RECOMMENDATIONS_LIMIT`.
*   `text` en español con 2 decimales para tasas/porcentajes; entidad en `entity`.

## 3. Endpoint (`backend/routers/campaigns.py`)
*   `GET /{campaign_name}/compare/recommendations?date_a=&date_b=&min_calls=` (mismos Query que `compare/diagnostics`).
*   Orquestación en `repositories/campaigns_repo.py::build_compare_recommendations` (sin tocar `build_compare_diagnostics`):
    *   `get_day_metrics` ×2 (A y B) → RF5.
    *   `get_device_metrics` rango `date_b..date_b` → RF1/RF2/RF4.
    *   `get_hourly_trend` rango `date_b..date_b` → RF3.
    *   Día faltante → payload base con `recommendations: []` (HTTP 200).

## 4. Tests backend
*   `backend/test_recommendations.py` (unit, sin HTTP): cada regla firing y no-firing; cap; orden; `text` con variable dinámica.
*   `backend/test_api.py`: contrato del endpoint (200 + claves), día faltante → `[]`, `min_calls=0` → 422, campaña inexistente → `[]`, `len ≤ 5`.

## 5. Frontend — tipos y cliente
*   `types/api.ts`: `Recommendation { id, type, category: Severity, entity, text }` + `RecommendationsResponse`.
*   `api/campaigns.ts`: `fetchRecommendations(campaign, dateA, dateB, minCalls, signal)`.

## 6. Frontend — hook y componente
*   `hooks/useRecommendations.ts`: mismo patrón que `useCompareDiagnostics` (deps primitivas, abort, `reload`).
*   `components/Insights/RecommendationsPanel.tsx`:
    *   Header `FileText` + título/subtítulo (RF7).
    *   Tarjeta `bg-slate-900 border-l-4` por `category` (rose/amber/emerald/slate-400); tipo en negrita (`uppercase font-bold`); `entity` + `text` en `slate-100`.
    *   `[]` → empty-state; loading skeleton simple; error en español.

## 7. Integración `App.tsx`
*   Debajo de `<DiagnosticsFeed />`, ancho completo: `<RecommendationsPanel ... />`.
*   Mismo `params` de filtros (campaña, fechas, min_calls).

## 8. Tests frontend (Vitest)
*   `RecommendationsPanel.test.tsx`: render con fixture (verifica `border-l-4` WARNING/SUCCESS y testids), `[]` → empty-state.

## 9. Verificación y cierre
*   `.venv/Scripts/python -m pytest -q`; `cd frontend && npm test && npx tsc -b && npm run lint && npm run build`.
*   Smoke: curl endpoint real (campaña 35, 01/09–02/09) + proxy `localhost:5173`; día faltante → `[]`.
*   Actualizar spec/plan/task si hubo micro-ajustes; marcar `task.md` `[x]`.
