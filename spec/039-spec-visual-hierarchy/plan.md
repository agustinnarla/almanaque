# Plan de implementación — Spec 039

## Contexto
- Títulos: `DiagnosticsFeed.tsx:30` (`h2` por columna), `RecommendationsPanel.tsx:94-105` (`section` + `h2` + `headerAction` sin uso).
- Tarjeta oscura: `RecommendationsPanel.tsx:39-80` (`bg-slate-900`, badge `amber-950/40`); estilo de referencia `InsightCard.tsx` + `common/Badge.tsx`.
- Formateadores duplicados: `KpiGrid.tsx:10-22`, `OverviewKpis.tsx:4-11`, `GatewaysTable.tsx:23-33`, `BasesCompareTable.tsx:3-18`, `CrossRankingTable.tsx:4-17`, `SegmentRankingTable.tsx:4-7`; `toLocaleString('es-AR')` inline en `BasesRankingTable`, `GatewaysRangeTable`, `SegmentRankingTable`.
- Helpers exportados desde componentes: `DailyTrendChart.tsx:14-28`, `HourlyTrendChart.tsx:14-45`, `DailyCompareChart.tsx:14-52`, `GatewaysTable.tsx:3-21`.
- `MIN_CALLS_OPTIONS` duplicado en `FilterBar.tsx` y `FilterCrossCampaignBar.tsx`; `RangeMode` usa `DEFAULT_MIN_CALLS` fijo.

## Pasos
1. **Docs** `spec/039-spec-visual-hierarchy/{spec,plan,task}.md`.
2. **`lib/format.ts`** + `format.test.ts`; reemplazar copias locales (RF3).
3. **`lib/gateways.ts`** y **`lib/chartData.ts`** (RF4); actualizar imports en componentes y tests.
4. **Jerarquía** (RF1): `DiagnosticsFeed` a `h3`; `RecommendationsPanel` sin `h2` ni `headerAction`.
5. **Tarjeta clara** (RF2) con `Badge`; badge AMD ámbar claro.
6. **`MinCallsSelect`** (RF6) en las 4 barras; `RangeValues.minCalls`; `catalog.ts` con `minCalls`; `RangeMode` con `range.minCalls` y «min_calls N».
7. **`SectionNav`** (RF5) + `id`/`scroll-mt-16` en las secciones de los 3 archivos de modo; `scroll-behavior: smooth` en `index.css`.
8. **Tests** nuevos y ajustados (RF8).
9. **Verificación**:
   - `/cerrar-spec 039` (pytest 167 · npm test 227 · tsc · lint 0/0 · build · baseline).
   - Revisión visual en Chrome.
   - Commit.
