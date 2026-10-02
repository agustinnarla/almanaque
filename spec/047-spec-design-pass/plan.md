# Plan de implementación — Spec 047

## Contexto
- `components/common/StatCard.tsx:66` título `uppercase tracking-wide`, valor `text-2xl font-bold`. `OverviewKpis.tsx` y `KpiGrid.tsx` empiezan por «Total de llamadas».
- `hooks/useApiResource.ts:65` ya conserva `data` mientras carga; los modos esconden todo con `!x.loading`.
- 37 celdas con `font-mono` en `components/**`.
- `lib/chartPalette.ts`: colores fijos en hex; `TrunkVolumeChart.tsx:132` usa `stroke="#ffffff"`.
- `charts/RateVolumeChart.tsx`: `maxBarSize={28}`, tooltip «nombre: valor», `<Legend>` con el color de la serie.
- `index.css`: sin modo oscuro.

## Pasos
1. **Docs** `spec/047-spec-design-pass/{spec,plan,task}.md`.
2. **Tema** `lib/theme.ts` (preferencia, `data-theme`, `useColorScheme` con `useSyncExternalStore`); `components/common/ThemeToggle.tsx`; `main.tsx` aplica el tema guardado antes de renderizar; `index.css` con las variables oscuras de Tailwind (solo `screen`).
3. **Paleta** `lib/chartPalette.ts` → `CHART_PALETTES.light/dark` + `useChartPalette()`.
4. **Gráficos** `charts/ChartCard.tsx`, `charts/DataTable.tsx`, `charts/ChartTooltip.tsx`; los 5 gráficos los usan; barras de 24 px, anillos y leyenda neutra.
5. **KPIs** `StatCard` `hero` + mayúscula inicial; reordenar `OverviewKpis` y `KpiGrid`.
6. **Números** `font-mono` → `tabular-nums`.
7. **Recarga** `refreshing` en `useApiResource` y en los hooks; `components/common/Refreshing.tsx`; los 3 modos.
8. **Tests** nuevos + ajustes.
9. **Verificación**: `/cerrar-spec 047` · validador de paleta · `task.md` en `[x]`.
