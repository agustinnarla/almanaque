# Plan 30: Intentos en bases, respiración en rankings y destacados de hora/dispositivo

## 1. Docs
*   `spec/030-spec-rankings-highlights/{spec,plan,task}.md`.

## 2. Backend — `total_calls` en bases-ranking
*   `backend/repositories/campaigns_repo.py` → `get_ranking`: al dict de cada fila sumar `"total_calls": int(row["total_calls"])` (`AGG_COLUMNS` ya lo trae; sin cambios de SQL).
*   `backend/test_api.py`: test nuevo `test_campaign_ranking_includes_total_calls` — claves `{base, agent_answer_rate, total_calls}` y valores del seed (34→240, 80→100, 99→50), rango 2026-09-01 → 2026-09-02.

## 3. Frontend — Intentos en la tabla de bases (RF1)
*   `frontend/src/types/api.ts`: `BaseRankingRow { base, agent_answer_rate, total_calls }` (requerido).
*   `frontend/src/components/overview/BasesRankingTable.tsx`: columna «Intentos» entre Base y AA %, `text-right font-mono`, `toLocaleString('es-AR')`; anchos `# 12% / Base 38% / Intentos 27% / AA % 23%`.
*   `frontend/src/lib/exporters.ts` → `basesRankingRows`: headers `['Rank', 'Base', 'Intentos', 'Agent Answer %']` + celda `row.total_calls`.
*   Sin cambios en `lib/rankings.ts` ni `CrossRankingTable` (modo comparar fuera de alcance).

## 4. UI — Respiración de «Rankings del rango» (RF2)
*   `frontend/src/App.tsx` (sección Rankings): `gap-6` → `gap-8`; tarjetas `p-4` → `p-5`; `h3 mb-3` → `mb-4` + subtítulo `text-xs text-slate-500` por tarjeta; contenedor de CSV con `flex-wrap`.
*   `BasesRankingTable.tsx` / `SegmentRankingTable.tsx`: `px-2 py-2` → `px-3 py-2.5` en thead y filas; `RankingBlock`: punto de color antes del título (emerald en «Mejores», slate/rojo en «Peores»), contenedor de bloques `gap-4` → `gap-5`.
*   `data-testid`, estados vacíos y textos de headers **intactos** (tests existentes siguen en verde).

## 5. Puntos destacados — mejor hora y mejor dispositivo (RF3/RF4)
*   `frontend/src/lib/rangeThresholds.ts`: `POSITIVE_DRIVERS_MAX` 3 → 5; altas `BEST_HOUR_MIN_CALLS = 50`, `BEST_DEVICE_MIN_CALLS = 50`.
*   `frontend/src/lib/rangeDiagnostics.ts`:
    *   `buildBestHour(hourly: HourlyTrendPoint[])` → evento `SUCCESS`/`BEST_HOUR`, `entity` = `String(hora)`, copy ES «Mejor hora del período: 11h con 7.09% de contacto humano (366 de 5161 intentos)».
    *   `buildBestDevice(devices: DeviceRangeRow[])` → `SUCCESS`/`BEST_DEVICE`, `entity` = `device`, copy análogo.
    *   Candidatos: `agent_answer_rate != null && total_calls >= MIN`; orden: rate desc → `agent_answers` desc → `hora`/`device` ASC; sin candidatos → `null`.
    *   `POSITIVE_PRIORITY`: `PEAK_WINDOW 0, BEST_HOUR 1, BEST_DEVICE 2, RELIABLE_TRUNK 3, BEST_DAY 4, PEAK_HOUR 5`.
    *   `rankPositiveDrivers`: ordena por prioridad, recorta a `POSITIVE_DRIVERS_MAX`, y **garantiza** `BEST_HOUR`/`BEST_DEVICE` (si existen en la entrada y quedaron fuera, reemplaza las entradas de menor prioridad y reordena).
*   `frontend/src/App.tsx` → `mapRangeDiagnostics(data, devices, daily, hourly)` agrega `buildBestHour(hourly)` y `buildBestDevice(devices)` a `positiveDrivers`; la llamada en `RangeMode` pasa `overview.hourly`. **Cero requests nuevos.**

## 6. Tests
*   `backend/test_api.py`: +1 test (`total_calls`).
*   `frontend/src/lib/__tests__/rangeDiagnostics.test.ts`: describes nuevos para `buildBestHour`/`buildBestDevice` (mínimo de llamadas, empates, sin candidatos); actualizar `rankPositiveDrivers` (orden con los 2 tipos nuevos, tope 5, garantía con 4 ventanas pico).
*   `frontend/src/components/overview/__tests__/BasesRankingTable.test.tsx`: fixtures con `total_calls`, celdas desplazadas (`AA %` en índice 3), aserción de «Intentos».
*   `frontend/src/lib/__tests__/exporters.test.ts`: `basesRankingRows` con header y celda nuevos.
*   Fixtures `total_calls` en `ModeTabs.test.tsx`, `ExportButtons.test.tsx`, `rankings.test.ts`.
*   Regresión: `pytest -q` (+1) · `npm test` · `npx tsc -b` · `npm run lint` · `npm run build`.

## 7. Verificación y cierre
1.  Smoke real (campaña 35, 01→15/09): bases 34/76/80 con intentos 198/17/35.198; grid con `gap-8`; puntos destacados con mejor hora **11h** y mejor dispositivo **IPLAN** (máx. 5 tarjetas).
2.  CSV bases con columna `Intentos`.
3.  mtimes `/data` intactos; `package.json` sin dependencias nuevas.
4.  `task.md [x]`.

## Flujo
Docs → backend + test → tipos → BasesRankingTable/exporters → UI rankings → thresholds/rangeDiagnostics → App.tsx → tests → regresión → smoke → mtimes → task [x].
