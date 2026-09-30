# Plan de implementación — Spec 040

## Contexto
- `backend/services/pattern_detector.py:4-26`: umbral fijo `AGENT_ANSWER_THRESHOLD` (config.py:1), sin volumen mínimo.
- `backend/routers/patterns.py:13-20`: `/api/patterns` sin `min_calls`.
- Tests: `test_api.py:99-161` (3 del detector + 2 del endpoint).
- Front: `api/rangeExtras.ts:71` (`fetchPatterns`), `hooks/usePatternAlerts.ts`, `RangeMode.tsx:93` y `CampaignsCompareMode.tsx:104` (llamadas al hook); subtítulos «(5%)» en `RangeMode.tsx:386` y `CampaignsCompareMode.tsx:396`; estados vacíos en `PatternsPanel.tsx:23` y `PatternsComparePanel.tsx:28`.

## Pasos
1. **Docs** `spec/040-spec-relative-pattern-alerts/{spec,plan,task}.md`.
2. **Backend**:
   - `config.py` → `PATTERN_RELATIVE_FACTOR`, `PATTERN_MIN_CALLS`.
   - `pattern_detector` en 2 pasadas (promedio por campaña, después evaluación).
   - Router con `min_calls: int = Query(50, ge=1)`.
3. **Tests backend**: reescribir los 2 que asumen el umbral fijo y sumar 4 (pytest 171).
4. **Front — datos**:
   - Tipo `PatternAlert` con `total_calls`/`campaign_rate`/`threshold_rate`.
   - `fetchPatterns(from, to, minCalls)` y `usePatternAlerts` con `minCalls`.
   - Los modos pasan su `minCalls`.
5. **Front — UI**: `campaignThreshold`, líneas de umbral en los 2 paneles, subtítulos y estados vacíos.
6. **Tests front** (+3, total 230).
7. **Verificación**:
   - `/cerrar-spec 040`.
   - Smoke de `/api/patterns` con los conteos esperados.
   - Revisión visual en Chrome.
   - Commit.
