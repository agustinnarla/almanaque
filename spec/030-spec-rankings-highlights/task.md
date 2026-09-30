# Task 30: Intentos en bases, respiración en rankings y destacados de hora/dispositivo

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Backend — total_calls en bases-ranking
- [x] `campaigns_repo.get_ranking` devuelve `total_calls` por base.
- [x] `test_api.py`: test nuevo `test_campaign_ranking_includes_total_calls` (34→240, 80→100, 99→50).

## 3. Frontend — Intentos en la tabla de bases (RF1)
- [x] `types/api.ts`: `BaseRankingRow.total_calls` requerido.
- [x] `BasesRankingTable`: columna «Intentos» (`es-AR`, `font-mono`) y anchos redistribuidos.
- [x] `exporters.basesRankingRows`: header y celda `Intentos`.

## 4. UI — Respiración de «Rankings del rango» (RF2)
- [x] `App.tsx`: `gap-8`, tarjetas `p-5`, `mb-4` + subtítulos por tarjeta, CSV con `flex-wrap`.
- [x] `BasesRankingTable`/`SegmentRankingTable`: padding `px-3 py-2.5`; «Mejores»/«Peores» con punto de color; bloques `gap-5`.

## 5. Puntos destacados — mejor hora y mejor dispositivo (RF3/RF4)
- [x] `rangeThresholds`: `POSITIVE_DRIVERS_MAX = 5`, `BEST_HOUR_MIN_CALLS`, `BEST_DEVICE_MIN_CALLS`.
- [x] `rangeDiagnostics`: `buildBestHour`, `buildBestDevice`, nuevas prioridades y garantía de inclusión.
- [x] `App.tsx`: `mapRangeDiagnostics` recibe `overview.hourly` y emite los 2 eventos (cero requests nuevos).

## 6. Tests
- [x] `rangeDiagnostics.test.ts`: builders, prioridad, garantía y tope 5.
- [x] `BasesRankingTable.test.tsx` / `exporters.test.ts` actualizados.
- [x] Fixtures `total_calls` en `ModeTabs` / `ExportButtons` / `rankings`.
- [x] Regresión: `pytest -q` (+1) · `npm test` · `npx tsc -b` · `npm run lint` · `npm run build`.

## 7. Verificación y cierre
- [x] Smoke real campaña 35 (01→15/09): intentos 198/17/35.198, `gap-8`, mejor hora 11h, mejor dispositivo IPLAN, máx. 5 tarjetas.
- [x] CSV bases con columna `Intentos`.
- [x] mtimes `/data` intactos; `package.json` sin dependencias nuevas.
- [x] Marcar items `[x]`.
