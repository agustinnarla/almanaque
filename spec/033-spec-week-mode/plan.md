# Plan de implementación — Spec 033

## Contexto

- `App.tsx:88` `type ViewMode = 'range' | 'compare' | 'campaigns'`; `ModeTabs` (115-167) con 3 botones; render en 1225-1227.
- `RangeMode()` (App.tsx:207-564): estado `RangeValues` + 5 hooks (`useCampaignOverview`, `useRangeDiagnostics`, `useRangeRecommendations`, `useRangeRankings`, `usePatternAlerts`) + 11 `ExportCsvButton` con prefijo `rango_` + empty-state en 554-561.
- `FilterRangeBar.tsx`: form con Campaña/Desde/Hasta y `onApply(RangeValues)`.
- Backend sin cambios: los 12 endpoints de rango aceptan cualquier `start_date/end_date`.
- Cobertura: S36 (4 días, parcial), S37 (5, completa), S38 (2, parcial).

## Pasos

1. **`frontend/src/lib/weeks.ts`** (nuevo)
    - `WeekOption { label, start, end, dataDays, partial }`, `WEEK_OPTIONS` (3 semanas ISO), `DEFAULT_WEEK = WEEK_OPTIONS[1]` (S37).

2. **`frontend/src/components/Filters/FilterWeekBar.tsx`** (nuevo)
    - Props `{ initial: { campaign, weekStart }, onApply: (values: RangeValues) => void }` (importa `RangeValues` de `./FilterRangeBar`).
    - Select de semanas (`getByLabelText('Semana')`), input Campaña, info `label · start → end · N días con datos`, badge «Parcial» si `partial`.
    - Submit emite `{ campaign, from: week.start, to: week.end }`; testids `filter-week-bar` / `filter-week-submit`.

3. **`frontend/src/App.tsx`**
    - `ViewMode` += `'week'`; 4º botón «Por semana» `tab-week` en `ModeTabs`.
    - `DEFAULT_WEEK_RANGE = { campaign: '35', from: DEFAULT_WEEK.start, to: DEFAULT_WEEK.end }`.
    - `RangeMode({ variant = 'range' })`:
        - `useState<RangeValues>(variant === 'week' ? DEFAULT_WEEK_RANGE : DEFAULT_RANGE)`;
        - `same` comparado contra el default de la variante;
        - filtro condicional (`FilterWeekBar` con `weekStart` derivado de `range.from` vía `WEEK_OPTIONS.find`);
        - `const filePrefix = variant === 'week' ? 'semana' : 'rango'` → reemplazar los 11 `rango_${…}`;
        - cabecera week con `week.label`, `dataDays` y badge `week-partial-badge`;
        - empty-state diferenciado por variante.
    - Render: `{mode === 'week' && <RangeMode variant="week" />}`.

4. **Tests**
    - Nuevo `frontend/src/components/Filters/__tests__/FilterWeekBar.test.tsx` (render/defaults, emisión, badge).
    - `ModeTabs.test.tsx`: cuatro tabs + `tab-week` → `filter-week-bar`; conserva estado.
    - `ExportButtons.test.tsx`: WeekMode 11 CSV + filename `semana_35_2026-09-07_2026-09-13_kpis.csv` + badge al elegir S38.

5. **Verificación**
    - `npm test` · `npx tsc -b` · `npm run lint` · `npm run build` · `.venv/Scripts/python -m pytest -q` (164).
    - Smoke UI: 4 tabs, S37 default, S36/S38 con badge.
    - mtimes `/data` intactos; `package.json` sin dependencias nuevas; `task.md` en `[x]`.

## Riesgos / notas

- `ModeTabs` mockea `useCampaignOverview` con `summary: null` → el panel de semana mostrará el empty-state en ese test (se aserciona el filtro, no la cabecera); el badge se prueba en `ExportButtons` (mock con summary).
- S36 empieza 2026-08-31 (antes de `DATA_MIN`): el query `BETWEEN` responde igual; los CSV se nombran con ese start.
