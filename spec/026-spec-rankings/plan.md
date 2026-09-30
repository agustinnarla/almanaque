# Plan 26: Rankings y alertas de patrones a la UI

## 1. Docs
*   `spec/026-spec-rankings/{spec,plan,task}.md`.

## 2. Tipos y API client
*   `frontend/src/types/api.ts`: `BaseRankingRow {base, agent_answer_rate}` · `SegmentRankingItem {device?/hora?, total_calls, agent_answer_rate, busy_rate, congestion_rate, health_score}` · `SegmentRankingResponse {min_calls_applied, limit_applied, best[], worst[]}` · `PatternAlert {fecha, hora, campaign, base, device, agent_answer_rate, pattern_alert}`.
*   `frontend/src/api/rangeExtras.ts`: `fetchBasesRanking(campaign, from, to, signal)`, `fetchDevicesRanking(...)`, `fetchHoursRanking(...)` (con `min_calls`/`limit`), `fetchPatterns(from, to, signal)` — mismo estilo `fetchJson` + `AbortSignal` que `api/overview.ts`.

## 3. Lógica pura
*   `frontend/src/lib/patterns.ts`: `summarizePatterns(alerts: PatternAlert[], campaign: string): { byDay, topCombos }`
    *   filtra `alert.campaign === campaign`;
    *   `byDay` agrupa por `fecha`, orden `fecha` asc;
    *   `topCombos` agrupa por `base|device`, cuenta `alerts` y toma `worstRate = min(agent_answer_rate)`, orden `(alerts desc, worstRate asc)`, recorta a **5**.

## 4. Hooks
*   `frontend/src/hooks/useRangeRankings.ts`: `{bases, devices, hours, loading, error, reload}` — `Promise.all` de los 3 rankings, patrón `IDLE`/`tick`/`abort` de `useRangeDiagnostics`.
*   `frontend/src/hooks/usePatternAlerts.ts`: `{alerts, loading, error, reload}` — fetch crudo de `/api/patterns` (agrupación en render, no en el hook).

## 5. Componentes
*   `components/overview/BasesRankingTable.tsx`: tabla simple `Base | AA %` (todas las filas), estado vacío `border-dashed`.
*   `components/overview/SegmentRankingTable.tsx`: recibe `{best, worst}` + `keyLabel` (`Dispositivo`/`Hora`), 2 bloques «Mejores»/«Peores» con columnas Segmento | Intentos | AA % | Ocupado % | Congestión % | Health.
*   `components/Insights/PatternsPanel.tsx`: resumen por día (fecha + cantidad de alertas) + tabla top-5 `base × device` con `alerts` y `worstRate` %.

## 6. Export CSV
*   `frontend/src/lib/exporters.ts`: `basesRankingRows`, `segmentRankingRows`, `patternDailyRows`, `patternComboRows` (encabezados ES, % 2 decimales).

## 7. App.tsx — solo RangeMode
*   `useRangeRankings` + `usePatternAlerts` en `RangeMode`.
*   Sección «Rankings del rango» (`grid lg:grid-cols-12`: bases 4 / dispositivos 4 / horas 4) con `h2` + `ExportCsvButton` por tabla.
*   Sección «Alertas de patrones» con `h2` + 2 `ExportCsvButton` (día / combinaciones).
*   Filenames: `rango_{campaña}_{desde}_{hasta}_{sección}.csv` con `bases_ranking|devices_ranking|hours_ranking|patterns_daily|patterns_combos`.

## 8. Tests
*   Nuevos: `lib/__tests__/patterns.test.ts`, `overview/__tests__/BasesRankingTable.test.tsx`, `overview/__tests__/SegmentRankingTable.test.tsx`, `Insights/__tests__/PatternsPanel.test.tsx`; builders en `lib/__tests__/exporters.test.ts`.
*   Actualizar: `__tests__/ModeTabs.test.tsx` y `__tests__/ExportButtons.test.tsx` — mocks de los 2 hooks nuevos y conteo RangeMode **6 → 11**.
*   Regresión: `npm test`, `npx tsc -b`, `npm run lint`, `npm run build`, `pytest -q` (156).

## 9. Verificación
1.  Smoke real con backend en 8000: 3 bases, IPLAN mejor, GW37 peor, hora 16 mejor / 13 peor, 170 alertas en 11 días, top `80 × GW20` = 36.
2.  Descarga CSV de los 5 archivos nuevos.
3.  mtimes `/data` = snapshot; `package.json` sin dependencias nuevas.
4.  `task.md [x]`.

## Flujo
Docs → tipos → api → lib/patterns → hooks → componentes → exporters → App.tsx → tests → regresión → smoke → mtimes → task [x].
