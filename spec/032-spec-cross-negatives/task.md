# Task 32: Causas negativas por campaña y CSV sincronizado

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Umbrales y builders
- [x] `rangeThresholds.ts`: `NEGATIVE_DRIVERS_MAX = 5`.
- [x] `rangeDiagnostics.ts`: `buildWorstHour` / `buildWorstDevice` (WARNING, criterio espejo, `campaign?`).

## 3. Composición
- [x] `crossDiagnostics.ts`: helper compartido + `composeCrossNegatives` (garantía, orden, cap 5, nulls).

## 4. App.tsx — CampaignsCompareMode
- [x] `crossPositives` / `crossNegatives` calculados en el cuerpo del componente.
- [x] CSV `diagnosticRows(crossNegatives, crossPositives)`; `DiagnosticsFeed` con ambas listas compuestas.

## 5. Tests
- [x] `rangeDiagnostics.test`: `buildWorstHour` / `buildWorstDevice`.
- [x] `crossDiagnostics.test`: `composeCrossNegatives`.
- [x] `ModeTabs`: tarjetas «Peor … de la campaña …»; `insight-card` 6 → 10.
- [x] `ExportButtons`: CSV `campanas_35_vs_38_diagnosticos.csv` (5 Negativa + 4 Positiva en el mock).
- [x] Regresión: `pytest -q` (164) · `npm test` · `npx tsc -b` · `npm run lint` · `npm run build`.

## 6. Verificación y cierre
- [x] Smoke 35 vs 38: 5 tarjetas negativas (backend + 4 de campaña) y 5 positivas intactas; CSV 10 filas.
- [x] Modo rango y CompareMode sin regresiones; 12 CSV de campañas sin cambio.
- [x] mtimes `/data` intactos; `package.json` sin dependencias nuevas.
- [x] Marcar items `[x]`.
