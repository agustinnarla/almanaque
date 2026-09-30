# Task 39: Jerarquía visual, consistencia y navegación

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Formateadores y helpers
- [x] `lib/format.ts` + 4 tests; copias locales reemplazadas (texto renderizado idéntico).
- [x] `lib/gateways.ts` y `lib/chartData.ts`; imports actualizados.
- [x] Lint `only-export-components` 7 → 0.

## 3. Jerarquía y tarjetas
- [x] `DiagnosticsFeed` con `h3`; `RecommendationsPanel` sin `h2` duplicado ni `headerAction`.
- [x] `RecommendationCard` clara con `Badge`; badge AMD ámbar claro.

## 4. Mín. llamadas y navegación
- [x] `MinCallsSelect` en las 4 barras; `RangeValues.minCalls`; `RangeMode` usa `range.minCalls` + «min_calls N».
- [x] `SectionNav` fijo con anclas en los 4 modos; secciones con `id` y `scroll-mt-16`.

## 5. Tests
- [x] Nuevos: format (4), SectionNav (1), DiagnosticsFeed (1), RecommendationsPanel (1), FilterRangeBar (1), ExportButtons (2), ModeTabs (1).
- [x] Ajustes de tests existentes (título eliminado, `minCalls`, imports).

## 6. Verificación y cierre
- [x] `/cerrar-spec 039`: pytest 167 · npm test 227 · tsc · lint 0/0 · build · baseline OK.
- [x] Revisión visual en Chrome (tarjetas, índice, min_calls 100 en la 91, consola).
- [x] Commit de cierre en español.
- [x] Marcar items `[x]`.
