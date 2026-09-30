# Plan 031: Intentos, highlights por campaña y grillas comparadas

## 1. Docs
*   `spec/031-spec-cross-highlights/{spec,plan,task}.md`.

## 2. Backend — devices_a/devices_b
*   `backend/repositories/campaigns_repo.py` → `build_cross_campaign_compare`: defaults `"devices_a": []` / `"devices_b": []` en el envelope y, tras el chequeo de `totals_a/totals_b`, poblar con `get_device_metrics(conn, campaign_a|b, start_date, end_date)`.
*   `backend/test_api.py`: test nuevo `test_cross_campaign_compare_includes_device_metrics` (seed, 35 vs 40): `devices_a` = `GW37` 300 (80/300) y `GW20` 90; `devices_b` = `GW37` 80 (0.5); contrato exacto de claves. Además el contrato del envelope (`test_cross_campaign_contract`) suma `devices_a`/`devices_b` y el caso campaña faltante los valida como `[]`.

## 3. Tipos y merges — attemptsA/B
*   `frontend/src/types/api.ts`: `CrossCampaignCompareResponse` += `devices_a`/`devices_b: DeviceRangeRow[]`; `CrossRankingRow` += `attemptsA: number | null` · `attemptsB: number | null`.
*   `frontend/src/lib/rankings.ts`:
    *   `mergeBaseRankings`: el `upsert` guarda `item.total_calls` en `attemptsA`/`attemptsB` (lado ausente queda `null`).
    *   `mergeSegmentRankings`: `attemptsA = itemA?.total_calls ?? null` (íd. B).

## 4. Grillas comparadas — apilado + columnas
*   `frontend/src/components/overview/CrossRankingTable.tsx`:
    *   Bases (6 col): `Base | Intentos A | AA A | Intentos B | AA B | Δ`.
    *   Segmentos (8 col): `Segmento | Intentos A | AA A | H A | Intentos B | AA B | H B | Δ`.
    *   Fin del modo `compact` (`text-xs`/`px-1`): `text-sm` + `px-3 py-2.5` para todos; anchos nuevos por `kind`; wrapper `overflow-x-auto`.
    *   Sin cambios: `data-good/warn/bad`, `data-delta-*`, fila #1 `bg-emerald-50`, estados vacíos, `data-testid`.
*   `frontend/src/App.tsx` (sección «Rankings comparados»): `grid gap-6 lg:grid-cols-3` → `grid items-start gap-8` (1 columna), tarjetas `p-4`→`p-5`, encabezado `h3` + subtítulo en wrapper `mb-4`, CSV con `flex-wrap`.
*   `frontend/src/lib/exporters.ts` → `crossRankingRows`: headers `[…, 'Intentos A', 'Agent Answer A %', 'Intentos B', 'Agent Answer B %', 'Delta pp', (Health A, Health B)]` y celdas en el mismo orden.

## 5. Puntos destacados por campaña
*   `frontend/src/lib/rangeDiagnostics.ts`:
    *   `buildBestHour(hourly, campaign?)` y `buildBestDevice(devices, campaign?)`.
    *   Sin `campaign` → `entity` y `message` actuales (sin regresión en modo rango).
    *   Con `campaign` → `entity` `"{hora} · {c}"` / `"{device} · {c}"`; mensaje «Mejor hora de la campaña {c}: {h}h con {rate}% de contacto humano ({agents} de {total} intentos).» (íd. dispositivo).
*   Nuevo `frontend/src/lib/crossDiagnostics.ts` → `composeCrossPositives(backendPositives: DiagnosticEvent[], campaignEvents: (DiagnosticEvent | null)[]): DiagnosticEvent[]`:
    *   filtra `null`, garantiza los highlights hasta `POSITIVE_DRIVERS_MAX` (5) y completa con `backendPositives` en orden; salida backend primero y highlights al final (A: hora, device; B: hora, device).
*   `frontend/src/App.tsx` → `CampaignsCompareMode`:
    *   `const highlights = [buildBestHour(data.hourly_a, data.campaign_a), buildBestDevice(data.devices_a, data.campaign_a), buildBestHour(data.hourly_b, data.campaign_b), buildBestDevice(data.devices_b, data.campaign_b)]`.
    *   `positiveDrivers={composeCrossPositives(diagnostics.data.positive_drivers ?? [], highlights)}`.
    *   `positiveTitle="Puntos destacados"` + `positiveDescription="Fortalezas y señales positivas del período"`.

## 6. Tests
*   Backend: +1 (`devices_a/b`) → 164.
*   `lib/__tests__/rankings.test.ts`: `attemptsA/B` en `mergeBaseRankings` y `mergeSegmentRankings` (lado faltante `null`).
*   `overview/__tests__/CrossRankingTable.test.tsx`: headers nuevos («Intentos A/B»), índices de Δ/health recalculados, `—` en lado faltante.
*   `lib/__tests__/exporters.test.ts`: `crossRankingRows` bases y segmentos con intentos.
*   `lib/__tests__/rangeDiagnostics.test.ts`: builders con `campaign` (entity y copy) y sin ella (copy intacto).
*   Nuevo `lib/__tests__/crossDiagnostics.test.ts`: garantía de 4 highlights con 5 backend, orden de salida, filtrado de `null`, cap 5.
*   `__tests__/ModeTabs.test.tsx` y `__tests__/ExportButtons.test.tsx`: mocks de `useCrossCampaignCompare` += `devices_a`/`devices_b` (con datos reales mínimos) y `attemptsA`/`attemptsB` en fixtures de `CrossRankingRow` donde falte.
*   Regresión completa: `pytest -q` (164) · `npm test` · `npx tsc -b` · `npm run lint` · `npm run build`.

## 7. Verificación y cierre
1.  Smoke 35 vs 38 (01→15/09): rankings apilados con 6/8 columnas e intentos (34: 198|1200, 76: 17|261943, 80: 35198|35, 0: —|20); «Puntos destacados» con 5 tarjetas (`BASE_IMPROVEMENT` + `11 · 35` + `IPLAN · 35` + `9 · 38` + `IPLAN · 38`); CSVs con `Intentos A/B`.
2.  Modo rango sin regresiones (copy de highlights intacto) y CompareMode intacto.
3.  mtimes `/data` = snapshot; `package.json` sin dependencias nuevas.
4.  `task.md [x]`.

## Flujo
Docs → backend + test → tipos → merges → CrossRankingTable/exporters → App.tsx (grid) → builders/crossDiagnostics → App.tsx (diagnóstico) → tests → regresión → smoke → mtimes → task [x].
