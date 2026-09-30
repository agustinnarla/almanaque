# Plan 16: Vista «Campaña completa» (overview por rango)

## 1. Docs
*   `spec/016-spec-campaign-overview/{spec,plan,task}.md`.

## 2. Tipos (`frontend/src/types/api.ts`)
*   `CampaignSummary`, `DailyTrendPoint`, `DeviceRangeRow` (espejo de contratos existentes).

## 3. API (`frontend/src/api/overview.ts`)
*   `fetchSummary(campaign, from, to, signal?)` → `GET /summary`
*   `fetchDailySeries(campaign, from, to, signal?)` → `GET /daily`
*   `fetchHourlyRange(campaign, from, to, signal?)` → `GET /hourly-trend` con `start≠end` (la función de `campaigns.ts` solo manda 1 fecha)
*   `fetchDevicesRange(campaign, from, to, signal?)` → `GET /devices`
*   Errores → `Error('Error de API: {status}')` (patrón actual).

## 4. Hook (`frontend/src/hooks/useCampaignOverview.ts`)
*   Params `{campaign, from, to}`; `Promise.all` de los 4 fetches; estado `{summary, daily, hourly, devices, loading, error}` + `reload`; abort al desmontar/cambiar (patrón de `useCompareDiagnostics`).

## 5. Filtro (`frontend/src/components/Filters/FilterRangeBar.tsx`)
*   Campaña / Desde / Hasta / botón «Analizar»; `onApply({campaign, from, to})`; mismos `inputClass` que `FilterBar`.

## 6. Componentes (`frontend/src/components/overview/`)
*   `OverviewKpis.tsx` — 4 × `StatCard` (RF3).
*   `DailyTrendChart.tsx` — ComposedChart barras+línea, eje X `DD/MM` (RF4).
*   `HourlyAggregateChart.tsx` — ComposedChart 1 serie por hora (RF5).
*   `GatewaysRangeTable.tsx` — tabla 5 columnas; reutiliza `formatRatePct` exportado de `GatewaysTable` (RF6).

## 7. App (`frontend/src/App.tsx`)
*   `mode: 'range' | 'compare'` (default `'range'`) + tabs en el header.
*   Modo rango: `FilterRangeBar` + KPIs + grid (Daily 7 col / Gateways 5 col) + Hourly; skeleton/error/empty.
*   Modo compare: **idéntico** al actual (FilterBar, KpiGrid, DiagnosticsFeed, Recommendations, HourlyTrendChart, GatewaysTable) — solo envuelto en `mode === 'compare'`.

## 8. Tests (`frontend/src/components/overview/__tests__/` + `Filters/__tests__/`)
*   KPIs: valores formateados y `rate: null` → `—`.
*   Daily/Hourly: render con datos y empty-state.
*   Gateways: filas y vacío.
*   FilterRangeBar: submit emite valores correctos.
*   Los 22 tests existentes sin tocar.

## 9. Verificación
1.  `npm test` + `npx tsc -b` + `npm run lint` + `npm run build`.
2.  `.venv/Scripts/python -m pytest -q` (regresión backend).
3.  Smoke: backend `:8000` + resumen de los 4 endpoints del rango (35.413 / 0.0594 / 11 pts / devices).
4.  `/data` mtimes intactos.
5.  `task.md` `[x]`.

## Fuera de alcance
Backend, rankings/diagnósticos/patrones en modo rango, tocar componentes A/B, dependencias.
