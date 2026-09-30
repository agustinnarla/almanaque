# Task 28: Rankings y alertas comparados (modo Campañas)

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Tipos
- [x] `CrossRankingRow` en `types/api.ts`; `PatternCompareDay`/`PatternCompareCombo` en `lib/patterns.ts`.

## 3. Lógica pura
- [x] `lib/rankings.ts`: `mergeBaseRankings` + `mergeSegmentRankings` (unión, faltantes null, orden).
- [x] `lib/patterns.ts`: `comparePatternSummaries` (fechas unión asc, combos top-5 por total) con `aggregateCombos`/`compareCombos` compartidos.

## 4. Componentes
- [x] `overview/CrossRankingTable.tsx` (kind parametrizado, colores health, hover, caption, vacío).
- [x] `Insights/PatternsComparePanel.tsx` (barras dobles A/B, leyenda, chips, combos A|B|Total).
- [x] Refactor: `lib/dates.ts` con `formatDayLabel` compartido con `PatternsPanel`.

## 5. Export CSV
- [x] `exporters.ts`: `crossRankingRows`, `patternCompareDailyRows`, `patternCompareComboRows`.

## 6. App.tsx — CampaignsCompareMode
- [x] Hooks `useRangeRankings` ×2 + `usePatternAlerts` ×1 (CROSS_START/END, limit 5) + `reloadAll` en reclic de «Comparar».
- [x] Sección «Rankings comparados» (3 tarjetas + 3 CSV) y «Alertas de patrones» (panel + 2 CSV) tras Recomendaciones.
- [x] Orden de botones: `[0..2]` intactos, `[3..7]` nuevos, `[8..11]` hourly/gateways/bases/daily.

## 7. Tests
- [x] Nuevos: `rankings.test.ts` (4 casos), `comparePatternSummaries` (4 casos), `CrossRankingTable.test.tsx` (4), `PatternsComparePanel.test.tsx` (4), builders (3 describes).
- [x] Actualizar `ExportButtons.test.tsx` (7 → 12, `buttons[5]` → `buttons[10]`, +1 test de los CSV nuevos) y `ModeTabs.test.tsx` (7 → 12).
- [x] `ModeTabs`/`ExportButtons` en verde con hooks ya mockeados.

## 8. Verificación y cierre
- [x] `npx vitest run` = **152** (29 archivos) + `npx tsc -b` = 0 + `npm run lint` = 0 errores + `npm run build` OK.
- [x] `pytest -q` = **156**.
- [x] Smoke real (35 vs 38, 01→15/09): bases unión `0/34/76` con `0` solo-B (AA 70%), delta 34 = +6.63 pp, health IPLAN A 3.38 / B 1.65 y GW37 A −25.67 / B −35.33, alertas 170 vs 193 en 11 días; 12 CSV `campanas_35_vs_38_*.csv`.
- [x] mtimes `/data` intactos (22/22); `package.json` sin dependencias nuevas (6 deps / 12 devDeps).
- [x] Marcar items `[x]`.
