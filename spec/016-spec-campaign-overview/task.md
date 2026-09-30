# Task 16: Vista «Campaña completa» (overview por rango)

## 1. Docs
- [x] `spec.md`, `plan.md`, `task.md`.

## 2. Tipos + API + hook
- [x] `types/api.ts`: `CampaignSummary`, `DailyTrendPoint`, `DeviceRangeRow`.
- [x] `api/overview.ts`: summary, daily, hourly-range, devices.
- [x] `hooks/useCampaignOverview.ts` con abort + reload.

## 3. Componentes
- [x] `Filters/FilterRangeBar.tsx`.
- [x] `overview/OverviewKpis.tsx`.
- [x] `overview/DailyTrendChart.tsx`.
- [x] `overview/HourlyAggregateChart.tsx`.
- [x] `overview/GatewaysRangeTable.tsx`.

## 4. Integración App
- [x] Tabs «Campaña completa» / «Comparar 2 días»; modo rango nuevo; modo A/B intacto (`RangeMode` / `CompareMode` en `App.tsx`).

## 5. Tests
- [x] Tests de KPIs, Daily, Hourly, Gateways, FilterRangeBar (nuevos, 13 tests).
- [x] Los 22 tests existentes sin cambios → **35 passed / 10 files**.

## 6. Verificación y cierre
- [x] `npm test` (35) + `tsc -b` (0 errores) + `lint` (solo warnings preexistentes) + `build` (✓) en verde.
- [x] `pytest -q` en verde (**130 passed**).
- [x] Smoke rango 01→15 contra API viva: summary **35.413 / AA 0.0594**; daily **11** pts (0.039–0.085); hourly horas **9–17**; devices IPLAN, GW37, GW20, GW39, IPLAN2…
- [x] `/data` mtime intacto (md5 de mtimes idéntico al snapshot).
- [x] Marcar items `[x]`.
