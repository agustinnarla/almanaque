# Plan de implementación — Spec 042

## Contexto
- Los 4 gráficos (`overview/DailyTrendChart.tsx`, `overview/HourlyAggregateChart.tsx`, `dashboard/HourlyTrendChart.tsx`, `overview/DailyCompareChart.tsx`) repiten un `ComposedChart` con `YAxis yAxisId="left"/"right"` y colores hex propios.
- Los tests de gráficos mockean `recharts`.
- Tablas sin `overflow-x-auto`: `dashboard/BasesCompareTable`, `dashboard/GatewaysTable`, `overview/GatewaysRangeTable`, `Insights/PatternsPanel`, `Insights/PatternsComparePanel`.
- Filtros: `md:flex-row` sin wrap. `ModeTabs` (App.tsx) es `inline-flex`.

## Pasos
1. **Docs** `spec/042-spec-responsive-palette/{spec,plan,task}.md`.
2. **`lib/chartPalette.ts`** + test.
3. **`components/charts/RateVolumeChart.tsx`**: 2 paneles con `syncId`, tooltip propio y leyenda condicional; tests.
4. **Los 4 gráficos** delegan en `RateVolumeChart` (los headers y estados vacíos no cambian; solo los subtítulos).
5. **Responsive**: contenedores de tabla, `flex-wrap` en filtros y pestañas.
6. **Tests**: mocks con `CartesianGrid`, aserción del subtítulo y tests de tabla.
7. **Verificación**:
   - `/cerrar-spec 042`.
   - grep sin `yAxisId="right"`.
   - Chrome en vista ancha y angosta.
   - Commit + push.
