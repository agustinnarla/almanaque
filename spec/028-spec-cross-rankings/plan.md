# Plan 28: Rankings y alertas comparados (modo Campañas)

## 1. Docs
*   `spec/028-spec-cross-rankings/{spec,plan,task}.md`.

## 2. Tipos (`frontend/src/types/api.ts`)
*   `CrossRankingRow { key, rateA, rateB, delta, healthA, healthB }`.
*   `PatternCompareDay { fecha, alertsA, alertsB }` y `PatternCompareCombo { base, device, alertsA, alertsB, total, worstRateA, worstRateB }` (en `lib/patterns.ts`, junto a `PatternSummary`).

## 3. Lógica pura
*   `frontend/src/lib/rankings.ts`:
    *   `mergeBaseRankings(a: BaseRankingRow[], b: BaseRankingRow[]): CrossRankingRow[]` — unión por `base`, `delta = (rateB − rateA) * 100` en pp (null si falta uno), orden por promedio de rates desc (los null al final).
    *   `mergeSegmentRankings(a: SegmentRankingResponse|null, b: …, kind: 'device'|'hour'): CrossRankingRow[]` — unión de `best`+`worst` (dedup por `device`/`hora`), orden por promedio de health desc (null al final, desempate por promedio de rate).
*   `frontend/src/lib/patterns.ts`: `comparePatternSummaries(alerts, campaignA, campaignB): { byDay: PatternCompareDay[], combos: PatternCompareCombo[] }` — filtra por campaña a y b, `byDay` unión de fechas asc con conteos por lado, `combos` unión por `base|device` ordenada por `total` desc (empate: peor `worstRate` de A/B asc) recortada a **5**.

## 4. Componentes
*   `frontend/src/components/overview/CrossRankingTable.tsx`:
    *   props `{ kind: 'base'|'device'|'hour', rows: CrossRankingRow[] | null }`.
    *   Tabla con `<caption>` sr-only, `text-xs` para device/hour (6 columnas) y `text-sm` para base (4 columnas), `hover:bg-slate-50`, health A/B coloreados (`data-good`/`data-warn`/`data-bad`, umbrales `≥0`/`≥−10`/`<−10`), Δ con signo (`+`/`−`), estado vacío `border-dashed` con `data-testid` propio.
*   `frontend/src/components/Insights/PatternsComparePanel.tsx`:
    *   props `{ alerts: PatternAlert[] | null, campaignA, campaignB }`.
    *   Izquierda (`lg:col-span-5`): leyenda A/B + lista de barras dobles por fecha (`pattern-compare-day-row`, fecha `dd/MM` + `title` ISO, barra A índigo sobre barra B ámbar, ancho % del máximo global, `width` inline sin animación) + chips de totales por campaña.
    *   Derecha (`lg:col-span-7`): tabla combos `Base | Dispositivo | A | B | Total` (`pattern-compare-combo-row`, fila #1 `bg-amber-50`, hover), estado vacío `patterns-empty` reutilizado cuando no hay alertas de ninguna campaña.

## 5. Export CSV (`frontend/src/lib/exporters.ts`)
*   `crossRankingRows(kind, rows: CrossRankingRow[]): CsvTable` — headers `['Segmento','Agent Answer A %','Agent Answer B %','Delta pp','Health A','Health B']` (base: sin columnas de health).
*   `patternCompareDailyRows(byDay: PatternCompareDay[]): CsvTable` — `['Fecha','Alertas A','Alertas B']`.
*   `patternCompareComboRows(combos: PatternCompareCombo[]): CsvTable` — `['Base','Dispositivo','Alertas A','Alertas B','Total']`.

## 6. App.tsx — solo CampaignsCompareMode
*   Hooks: `rankingsA = useRangeRankings({campaign: cross.campaignA, from: CROSS_START_DATE, to: CROSS_END_DATE, minCalls: cross.minCalls, limit: 5})`, `rankingsB` ídem con B; `patternAlerts = usePatternAlerts({from, to})`.
*   Combina loading/error de los 2 rankings para los estados de la sección.
*   Sección «Rankings comparados» (icono `Trophy`) tras «Recomendaciones»: `grid lg:grid-cols-3 items-start` con 3 tarjetas (Bases / Dispositivos / Horas) + 3 `ExportCsvButton` con `label` (`Bases`/`Dispositivos`/`Horas`) → DOM `[3][4][5]`.
*   Sección «Alertas de patrones» (icono `AlertTriangle`) con `PatternsComparePanel` + 2 CSV (`label` «Por día»/«Combinaciones») → DOM `[6][7]`.
*   Quitar de su ubicación actual los CSV de hourly `[3]`, gateways `[4]`, bases `[5]`, daily `[6]` (quedan `[8..11]` — solo cambia su posición en el DOM, no su markup).

## 7. Tests
*   Nuevos: `lib/__tests__/rankings.test.ts`; `comparePatternSummaries` en `lib/__tests__/patterns.test.ts` (unión de fechas, conteos A/B, top-5 por total); `overview/__tests__/CrossRankingTable.test.tsx` (4/6 columnas, `—` en faltantes, `data-good`/`data-bad`, vacío); `Insights/__tests__/PatternsComparePanel.test.tsx` (fechas unión, barras A/B, chips 170/193, combos top-5, vacío); builders en `lib/__tests__/exporters.test.ts`.
*   Actualizar `__tests__/ExportButtons.test.tsx`: `CampaignsCompareMode ofrece 12 CSV` + `buttons[10]` → `campanas_35_vs_38_bases.csv`.
*   Verificar `ModeTabs.test.tsx` sin cambios (hooks ya mockeados).
*   Regresión: `npx vitest run`, `npx tsc -b`, `npm run lint`, `npm run build`, `.venv/Scripts/python -m pytest -q` (156).

## 8. Verificación
1.  Smoke real (backend 8000, 35 vs 38, 2026-09-01 → 2026-09-15): unión de bases = `34/80/76/0`, health IPLAN A 3.38 / B 1.65, GW37 A −25.67 / B −35.33, alertas 170 vs 193 en 11 días, 12 CSV con `campanas_35_vs_38_*.csv`.
2.  mtimes `/data` (22/22) y `package.json` sin dependencias nuevas.
3.  `task.md` `[x]`.
