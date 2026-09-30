# Task 35: Peor hora y peor dispositivo en Causas negativas del rango

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. App.tsx — mapRangeDiagnostics
- [x] Construir `buildWorstHour(hourly)` y `buildWorstDevice(devices)`.
- [x] `rootCauses = composeCrossNegatives(causasBackend, [worstHour, worstDevice])` (máx. 5).

## 3. Tests
- [x] `ExportButtons.test.tsx`: texto «Peor hora del período» / «Peor dispositivo del período» en Causas negativas.
- [x] `ExportButtons.test.tsx`: CSV `diagnosticos` del rango con filas `WORST_HOUR` y `WORST_DEVICE`.
- [x] Regresión: `pytest -q` (164) · `npm test` · `npx tsc -b` · `npm run lint` · `npm run build`.

## 4. Verificación y cierre
- [x] Smoke campaña 35: peor hora 16h (4.91%, 120/2446), peor dispositivo IPLAN2 (3.54%, 55/1555), ≤ 5 tarjetas.
- [x] CSV `rango_35_..._diagnosticos.csv` con `WORST_HOUR;16` y `WORST_DEVICE;IPLAN2`.
- [x] mtimes `/data` intactos; `package.json` sin dependencias nuevas.
- [x] Marcar items `[x]`.
