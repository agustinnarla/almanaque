# Spec 033: Pestaña «Por semana» (panel completo con badge de parcialidad)

## Usuario

Analista / supervisor del call center (usuario interno). Hoy el modo **Campaña completa** solo permite rangos libres de fechas: para mirar una semana hay que tipear a mano el lunes y el domingo, no se distinguen semanas parciales y se compara manzanas con naranjas (la S38 solo tiene 2 días de datos).

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — calendario semanal]:** nuevo `frontend/src/lib/weeks.ts` con `WEEK_OPTIONS` (S36, S37, S38 ISO: start lunes / end domingo), `dataDays` (4/5/2) y flag `partial` (true/false/true); `DEFAULT_WEEK` = S37 (la única completa). Hardcodeado, igual que `CROSS_START_DATE`/`CROSS_END_DATE`.
*   **RF2 [UI — filtro de semana]:** nuevo `frontend/src/components/Filters/FilterWeekBar.tsx` (clon de `FilterRangeBar`): **Campaña** (texto) + **Semana** (`<select>` con las 3 opciones, etiquetas con «· parcial» donde aplica), información del rango computado (`start → end · N días con datos`) y **badge «Parcial»** (ámbar) cuando `partial`. Emite `RangeValues { campaign, from: start, to: end }` para que la lógica de recarga de `RangeMode` quede intacta. testids `filter-week-bar` / `filter-week-submit`.
*   **RF3 [UI — variante de `RangeMode`]:** `ViewMode` += `'week'`; 4º tab **«Por semana»** (`tab-week`) en `ModeTabs`; render `{mode === 'week' && <RangeMode variant="week" />}`. `RangeMode({ variant })`:
    *   Estado inicial week → `{ campaign: '35', from: DEFAULT_WEEK.start, to: DEFAULT_WEEK.end }`.
    *   Filtro: `FilterWeekBar` (week) vs `FilterRangeBar` (range); misma lógica `setRange` + reload si no cambió.
    *   Los **5 hooks, diagnóstico (Puntos destacados), recomendaciones, rankings, alertas de patrones, tendencia diaria, gateways y distribución horaria se reutilizan sin cambios** → panel completo heredado del modo rango.
    *   Prefijo de los 11 CSV: `semana_` vs `rango_` (p. ej. `semana_35_2026-09-07_2026-09-13_kpis.csv`).
    *   Cabecera week: `campaña · fechas · etiqueta de semana · N días con datos` + badge `Parcial` (testid `week-partial-badge`) si `partial`.
    *   Empty-state week: «Elegí una semana y presioná «Analizar»…» / «Sin datos para la semana seleccionada.»
*   **RF4 [Unwanted behavior — aislamiento]:** **cero** cambios de backend (`pytest` = **164**); modos rango/comparar/campañas intactos (mismo componente con `variant='range'` por defecto); 11 CSV también en la variante week; sin librerías nuevas.
*   **RF5 [Testing]:**
    *   Nuevo `FilterWeekBar.test.tsx` (3 opciones, defaults S37, emisión `from/to`, badge «Parcial» en S38).
    *   `ModeTabs.test.tsx`: «muestra **cuatro** tabs» + `tab-week` muestra `filter-week-bar`; conserva estado con 4 tabs.
    *   `ExportButtons.test.tsx`: «WeekMode ofrece **11** CSV + imprimir» + filename `semana_…`.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Datos de entrada (cobertura real, 11 días hábiles 01→15/09)

| Semana | Rango ISO | Días con datos | Estado |
|---|---|---|---|
| S36 | 2026-08-31 → 2026-09-06 | 4 (01–04 sep) | **Parcial** |
| S37 | 2026-09-07 → 2026-09-13 | 5 (07–11 sep) | Completa (default) |
| S38 | 2026-09-14 → 2026-09-20 | 2 (14–15 sep) | **Parcial** |

Los 12 endpoints de rango aceptan cualquier `start_date/end_date` (sin límites) → pidiendo `from/to` de 7 días se obtiene el análisis semanal **sin endpoint nuevo**.

## Fuera de Alcance

*   Backend / endpoint de agregación semanal (`GROUP BY week`).
*   Comparación semana vs semana (WoW) y tabla de evolución semanal.
*   Centralizar las constantes de fecha duplicadas (`CROSS_*`, `DEFAULT_RANGE`).
*   Modo campañas con selector de semanas.

## Criterios de Finalización

*   Docs `spec/033-spec-week-mode/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke: 4 tabs; «Por semana» abre el panel completo con S37 por defecto; S36/S38 muestran badge «Parcial» y «N días con datos»; CSVs `semana_35_2026-09-07_2026-09-13_*.csv` (11).
*   Sin regresiones: modos rango/comparar/campañas idénticos; `pytest -q` = **164**; `npm test` + `tsc` + `lint` + `build` en verde.
*   `package.json` sin dependencias nuevas; `/data` mtimes intactos.
