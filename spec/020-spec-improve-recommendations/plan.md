# Plan 20: Diagnósticos enriquecidos del rango (front-only)

## 1. Docs
*   Reescribir `spec/020-spec-improve-recommendations/{spec,plan,task}.md` en formato SDD (Usuario, EARS, Specs superadas, Datos, Contrato, Fuera de alcance, Criterios).

## 2. Constantes front — `frontend/src/lib/rangeThresholds.ts` (nuevo)
*   `PEAK_WINDOW_MIN_RATE = 0.065`
*   `TRUNK_MIN_SHARE = 0.10`
*   `TRUNK_MAX_CONGESTION = 0.05`
*   `TRUNK_MAX_BUSY = 0.31`  ← GW39 = 0.30016; 0.30 estricto lo excluía
*   `AMD_RATIO = 4.0`
*   `BEST_DAY_MIN_CALLS = 50`
*   `POSITIVE_DRIVERS_MAX = 3`

## 3. Lógica pura — `frontend/src/lib/rangeDiagnostics.ts` (nuevo)
*   `mergePeakWindows(peaks: PeakHour[]): DiagnosticEvent[]`
    *   Filtra `agent_answer_rate ≥ PEAK_WINDOW_MIN_RATE`, ordena por `hora`, agrupa runs consecutivos.
    *   Run ≥2 → `PEAK_WINDOW` (`entity` `${a}h–${b}h`, tasa ponderada, abs acumulados).
    *   Run =1 → `PEAK_HOUR` (reusa `message` del item original).
*   `buildReliableTrunk(devices: DeviceRangeRow[], totalCalls: number): DiagnosticEvent | null`
    *   Filtros RF2 + guarda AMD; menor congestión, empate mayor share.
*   `buildBestDay(daily: DailyTrendPoint[]): DiagnosticEvent | null`
    *   Filtros RF3; max rate, empate agent_answers, luego fecha ASC.
*   `rankPositiveDrivers(events: DiagnosticEvent[]): DiagnosticEvent[]`
    *   Prioridad: `PEAK_WINDOW` → `RELIABLE_TRUNK` → `BEST_DAY` → `PEAK_HOUR`; `slice(0, POSITIVE_DRIVERS_MAX)`.

## 4. `App.tsx` — `mapRangeDiagnostics`
*   Firma: `(data, devices, daily)` o equivalentes desde RangeMode.
*   `rootCauses` igual (congested + burn).
*   `positiveDrivers = rankPositiveDrivers([...mergePeakWindows(peak_hours), trunk?, bestDay?])`.
*   RangeMode: pasar `positiveTitle` / `positiveDescription` a `DiagnosticsFeed`.

## 5. `DiagnosticsFeed.tsx`
*   Props opcionales `positiveTitle?`, `positiveDescription?` con default actuales.
*   CompareMode sin cambios de props.

## 6. Tests vitest
*   `frontend/src/lib/__tests__/rangeDiagnostics.test.ts`: fusión, aisladas, no consecutivas, trunk (GW39 / AMD / busy / vacío), best-day, ranking top-3.
*   `DiagnosticsFeed.test.tsx` (o ampliar existente): título custom vs default.
*   Regresión: `npm test`, `tsc -b`, `lint`, `build`.

## 7. Verificación
1.  `npm test` + `npx tsc -b` + `npm run lint` + `npm run build`.
2.  `.venv/Scripts/python -m pytest -q` → 143 intactos.
3.  Smoke lógica: PEAK_WINDOW 9h–11h; TRUNK GW39; BEST_DAY 2026-09-11.
4.  `stat` mtime `/data` 11 XLS.
5.  `task.md` en `[x]`.

## Fuera de alcance
*   Cualquier archivo bajo `backend/`, endpoints, esquema, `/data`, modo compare (salvo que el default de props lo deje idéntico).
