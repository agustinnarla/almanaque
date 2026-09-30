# Task 10: Recomendaciones Prescriptivas

## 1. Backend — config y motor
- [x] `config.py`: `REC_VOLUME_DROP_PCT = -10.0`, `REC_AMD_RATIO = 4.0`, `RECOMMENDATIONS_LIMIT = 5`.
- [x] `services/recommendations_engine.py`: orquestador + 5 generadores (RF1–RF5), orden por severidad, cap, textos ES.

## 2. Backend — endpoint
- [x] Ruta `GET .../compare/recommendations` en `routers/campaigns.py` (mismos Query que compare/diagnostics).
- [x] Orquestación en `build_compare_recommendations` con `get_day_metrics` / `get_device_metrics` / `get_hourly_trend`; día faltante → `recommendations: []` + 200.
- [x] **No** tocar `build_compare_diagnostics` ni su contrato (test de no-regresión agregado).

## 3. Backend — tests
- [x] `test_recommendations.py`: firing/no-firing por regla, orden, cap, variables en `text` (19 tests).
- [x] `test_api.py`: contrato 200, día faltante → `[]`, `min_calls=0` → 422, campaña inexistente → `[]`, `len ≤ 5`, min_calls filtra reglas de segmento, diagnóstico intacto.
- [x] **Revisión RF4 (amend 2026-09):** umbral AMD **4.0**, **máximo 1** `AMD_DIVERGENCE` (peor `machine/agent`); test `test_amd_emits_single_worst_ratio`.

## 4. Frontend — tipos, cliente, hook
- [x] `types/api.ts`: `Recommendation` + `RecommendationsResponse`.
- [x] `api/campaigns.ts`: `fetchRecommendations(...)`.
- [x] `hooks/useRecommendations.ts` (mismo patrón que Spec 008, deps primitivas + abort).

## 5. Frontend — componente e integración
- [x] `components/Insights/RecommendationsPanel.tsx`: header FileText, tarjetas oscuras `border-l-4` (4 categorías), empty/error ES.
- [x] Integrar en `App.tsx` debajo de `DiagnosticsFeed` (complemento, sin reemplazar).

## 6. Frontend — tests
- [x] `RecommendationsPanel.test.tsx`: render con fixture (bordes por categoría) y `[]` → empty-state.

## 7. Verificación y cierre
- [x] `pytest -q` en verde (123); `npm test` (20) + `tsc -b` + `npm run lint` + `npm run build` en verde.
- [x] Smoke campaña 35 (01/09–02/09): 5 recs (PACING GW20, AMD×2, VOLUME_DELTA, ROUTING IPLAN2); día faltante → `[]`; proxy 5173 OK.
- [x] Smoke post-revisión RF4: 5 recs 5 tipos (PACING GW20, AMD GW20 único ratio 8.2, VOLUME_DELTA, ROUTING GW37, SCHEDULE 12).
- [x] Micro-ajuste: test de `min_calls` alto espera que `VOLUME_DELTA` (dependiente solo del summary) pueda disparar aunque fallen las reglas de segmento — alineado a RF6.
- [x] Marcar items `[x]`.
