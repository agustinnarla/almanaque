# Task 25: Exportación CSV y reporte PDF

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Serializador CSV
- [x] `src/lib/csv.ts` (`toCsv` BOM/;/CRLF/escape/coma decimal + `downloadCsv`).

## 3. Builders de sección
- [x] `src/lib/exporters.ts` (11 builders puros con encabezados ES).

## 4. Componentes
- [x] `ExportCsvButton` + `PrintButton` (common).
- [x] `headerAction?: ReactNode` en `DailyTrendChart`, `HourlyAggregateChart`, `HourlyTrendChart`, `DailyCompareChart`, `RecommendationsPanel`.

## 5. App.tsx — 3 modos
- [x] `print:hidden` en header/tabs/filtros; PrintButton en cada success block.
- [x] ExportCsvButton por sección en RangeMode (6) / CompareMode (5, con nuevas secciones h2) / CampaignsCompareMode (7).

## 6. CSS print
- [x] `@media print` en `index.css`.

## 7. Tests
- [x] `csv.test.ts` + `exporters.test.ts` + tests de los 2 botones.
- [x] `ModeTabs.test.tsx` asienta CSV/print; regresión `npm test` + `tsc` + `lint` + `build` + `pytest`.

## 8. Verificación y cierre
- [x] Smoke manual: CSV por sección en 3 modos + impresión sin chrome.
- [x] `pytest -q` = 156 (backend intacto).
- [x] mtimes `/data` intactos; `package.json` sin dependencias nuevas.
- [x] Marcar items `[x]`.
