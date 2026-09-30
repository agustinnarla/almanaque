# Task 33: Pestaña «Por semana»

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Calendario semanal
- [x] `lib/weeks.ts`: `WEEK_OPTIONS` (S36/S37/S38 con `dataDays` y `partial`) + `DEFAULT_WEEK` (S37).

## 3. Filtro
- [x] `FilterWeekBar.tsx`: campaña + select de semanas, info del rango, badge «Parcial», emite `RangeValues`.

## 4. App.tsx
- [x] `ViewMode` += `'week'`; tab «Por semana» (`tab-week`).
- [x] `RangeMode({ variant })`: estado inicial week, filtro condicional, prefijo `semana_` en los 11 CSV, cabecera con `week.label`/`dataDays`/badge, empty-state propio.
- [x] Render `{mode === 'week' && <RangeMode variant="week" />}`.

## 5. Tests
- [x] Nuevo `FilterWeekBar.test.tsx`.
- [x] `ModeTabs.test.tsx`: cuatro tabs, `tab-week` → filtro, conserva estado.
- [x] `ExportButtons.test.tsx`: WeekMode 11 CSV + filename `semana_…` + badge en S38.
- [x] Regresión: `pytest -q` (164) · `npm test` · `npx tsc -b` · `npm run lint` · `npm run build`.

## 6. Verificación y cierre
- [x] Smoke: 4 tabs; S37 default; S36/S38 con badge «Parcial» y «N días con datos»; modos anteriores intactos.
- [x] mtimes `/data` intactos; `package.json` sin dependencias nuevas.
- [x] Marcar items `[x]`.
