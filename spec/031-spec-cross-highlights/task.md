# Task 31: Intentos, highlights por campaña y grillas comparadas

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Backend — devices_a/devices_b
- [x] `build_cross_campaign_compare` devuelve `devices_a`/`devices_b` con `get_device_metrics`.
- [x] `test_api.py`: test nuevo `test_cross_campaign_compare_includes_device_metrics` (seed: 35 `GW37` 300 / `GW20` 90; 40 `GW37` 80) + contrato `devices_a/b`.

## 3. Tipos y merges — attemptsA/B
- [x] `types/api.ts`: `devices_a`/`devices_b` en el envelope; `CrossRankingRow.attemptsA/attemptsB`.
- [x] `lib/rankings.ts`: ambos merges poblan attempts (lado faltante `null`).

## 4. Grillas comparadas — apilado + columnas
- [x] `CrossRankingTable`: bases 6 col / segmentos 8 col con Intentos A/B, `text-sm` + `px-3 py-2.5`, `overflow-x-auto`.
- [x] `App.tsx`: «Rankings comparados» apilado (`gap-8`, `p-5`, subtítulos, CSV `flex-wrap`).
- [x] `exporters.crossRankingRows` con `Intentos A/B`.

## 5. Puntos destacados por campaña
- [x] `buildBestHour`/`buildBestDevice` con `campaign?` (entity `11 · 35`, copy «de la campaña 35»).
- [x] Nuevo `lib/crossDiagnostics.ts` → `composeCrossPositives` (garantía, orden, cap 5).
- [x] `App.tsx` campaigns: arma los 4 highlights y pasa `positiveTitle="Puntos destacados"`.

## 6. Tests
- [x] `rankings.test` · `CrossRankingTable.test` · `exporters.test` · `rangeDiagnostics.test` (con campaign).
- [x] Nuevo `crossDiagnostics.test`.
- [x] Fixtures `devices_a/b` + `attemptsA/B` en `ModeTabs` / `ExportButtons`.
- [x] Regresión: `pytest -q` (164) · `npm test` · `npx tsc -b` · `npm run lint` · `npm run build`.

## 7. Verificación y cierre
- [x] Smoke 35 vs 38: rankings apilados con intentos; 5 tarjetas (`11 · 35`, `IPLAN · 35`, `9 · 38`, `IPLAN · 38`); CSVs con `Intentos A/B`.
- [x] Modo rango y CompareMode sin regresiones.
- [x] mtimes `/data` intactos; `package.json` sin dependencias nuevas.
- [x] Marcar items `[x]`.
