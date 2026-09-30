# Task 26: Rankings y alertas de patrones a la UI

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Tipos y API client
- [x] `types/api.ts`: `BaseRankingRow`, `SegmentRankingItem`, `SegmentRankingResponse`, `PatternAlert`.
- [x] `src/api/rangeExtras.ts`: `fetchBasesRanking`, `fetchDevicesRanking`, `fetchHoursRanking`, `fetchPatterns`.

## 3. Lógica pura
- [x] `src/lib/patterns.ts`: `summarizePatterns` (filtro por campaña, `byDay` asc, `topCombos` top-5 por cantidad desc / peor tasa asc).

## 4. Hooks
- [x] `useRangeRankings` (`Promise.all`, 1 loading/error/reload) + `usePatternAlerts`.

## 5. Componentes
- [x] `BasesRankingTable` · `SegmentRankingTable` (best/worst) · `PatternsPanel` (día + top combos), con estados vacíos.

## 6. Export CSV
- [x] `exporters.ts`: `basesRankingRows`, `segmentRankingRows`, `patternDailyRows`, `patternComboRows`.

## 7. App.tsx — RangeMode
- [x] Sección «Rankings del rango» (3 tablas + 3 CSV) y «Alertas de patrones» (2 CSV); RangeMode 6 → 11 botones.

## 8. Tests
- [x] `patterns.test.ts` + tests de los 3 componentes + builders en `exporters.test.ts`.
- [x] Actualizar `ModeTabs.test.tsx` / `ExportButtons.test.tsx` (mocks de 2 hooks, conteo 11); regresión `npm test` + `tsc` + `lint` + `build` + `pytest`.

## 9. Verificación y cierre
- [x] Smoke real: 3 bases, IPLAN/GW37, horas 16/13, 170 alertas en 11 días, top `80 × GW20` = 36; descarga de los 5 CSV.
- [x] `pytest -q` = 156 (backend intacto).
- [x] mtimes `/data` intactos; `package.json` sin dependencias nuevas.
- [x] Marcar items `[x]`.
