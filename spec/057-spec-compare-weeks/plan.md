# Plan de implementación — Spec 057

## Contexto
- `backend/repositories/campaigns_repo.py`: `_cross_gateway_intersection` (:923), `_cross_base_intersection` (:958), `build_cross_campaign_compare` (:1038), `build_cross_campaign_diagnostics` (:1092) y `build_cross_campaign_recommendations` (:1147). Todos usan un solo rango.
- `backend/routers/campaigns.py:39-79`: las 3 rutas `compare-campaigns`.
- `frontend/src/api/campaigns.ts` (`CrossCampaignParams`, `crossQuery`) y los hooks `useCrossCampaign*`.
- `frontend/src/lib/weeks.ts` (`buildWeekOptions`, `defaultWeek`); `lib/executiveSummary.ts` (`compareSummaryItems`).
- Componentes que se reusan: `KpiGrid`, `DiagnosticsFeed`, `RecommendationsPanel`, `HourlyTrendChart`, `GatewaysTable`, `BasesCompareTable`, `ChartCard` y `RateVolumeChart`.

## Pasos
1. **Rama** `feat/057-compare-weeks` + docs.
2. **Backend** rango B opcional en los 5 helpers y en las 3 rutas; tests.
3. **API y hooks** `startDateB` y `endDateB` opcionales.
4. **Lib**
   - `defaultWeekPair` en `weeks.ts`;
   - `mergeDailyByWeekday` en `chartData.ts`;
   - `weekdayCompareRows` en `exporters.ts`;
   - `weekMismatchNote`.
5. **UI**
   - `FilterWeeksCompareBar`;
   - `WeekdayCompareChart`;
   - `WeeksCompareMode`;
   - pestaña en `App.tsx`.
6. **Tests** pytest y vitest.
7. **Verificación** smoke real (35, S38 contra S39) · `/cerrar-spec 057` → PR → CI → squash merge.
