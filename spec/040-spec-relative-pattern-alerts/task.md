# Task 40: Alertas de patrones relativas a cada campaña

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Backend
- [x] `config.py`: `PATTERN_RELATIVE_FACTOR = 0.6`, `PATTERN_MIN_CALLS = 50` (sin `AGENT_ANSWER_THRESHOLD`).
- [x] `evaluate_campaigns` relativo al promedio por campaña + volumen mínimo + campos nuevos.
- [x] `/api/patterns` con `min_calls` (default 50, `ge=1`).
- [x] Tests: 2 reescritos + 4 nuevos (pytest 171).

## 3. Frontend
- [x] `PatternAlert` con campos nuevos; `fetchPatterns`/`usePatternAlerts` con `minCalls`; modos pasan su `minCalls`.
- [x] `campaignThreshold` + líneas de umbral en `PatternsPanel` y `PatternsComparePanel`.
- [x] Subtítulos y estados vacíos sin «(5%)».
- [x] Tests +3 (vitest 230).

## 4. Verificación y cierre
- [x] `/cerrar-spec 040`: pytest 171 · npm test 230 · tsc · lint 0/0 · build · baseline OK.
- [x] Smoke: alertas 35 = 67, 38 = 88, 91 = 365, 92 = 350; umbral 35 ≈ 3,56%; `min_calls` 100 reduce alertas.
- [x] Revisión visual en Chrome (línea de umbral en rango y campañas, subtítulo, consola).
- [x] Commit de cierre en español.
- [x] Marcar items `[x]`.
