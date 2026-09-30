# Plan de implementación — Spec 032

## Contexto

- Modo `CampaignsCompareMode` (`frontend/src/App.tsx:759+`): `data` (compare) y `diagnostics` (diagnostics) cargan en paralelo.
- Bloque «Diagnóstico» (`App.tsx:886-930`): el CSV (`App.tsx:893`) y el `DiagnosticsFeed` (`App.tsx:916`) usan hoy los crudos del backend para ambas columnas.
- Positivos ya se componen con `composeCrossPositives` (`frontend/src/lib/crossDiagnostics.ts`, Spec 031) usando `buildBestHour`/`buildBestDevice` con `campaign?` (`frontend/src/lib/rangeDiagnostics.ts:179-247`).
- Negativos: no existen builders (`WORST_*` no está en el repo); backend aporta `root_causes` con `ROOT_CAUSES_LIMIT = 5` (`backend/config.py:16`) ordenados por severidad/impacto.

## Pasos

1. **`frontend/src/lib/rangeThresholds.ts`**
    - Agregar `export const NEGATIVE_DRIVERS_MAX = 5`.

2. **`frontend/src/lib/rangeDiagnostics.ts`**
    - `buildWorstHour(hourly: HourlyTrendPoint[], campaign?: string): DiagnosticEvent | null`
        - Filtro: `agent_answer_rate != null && total_calls >= BEST_HOUR_MIN_CALLS`.
        - Sort: tasa **asc** → `agent_answers` asc → `hora` asc.
        - `severity: 'WARNING'`, `type: 'WORST_HOUR'`.
        - `entity`: `campaign ? \`${worst.hora} · ${campaign}\` : String(worst.hora)`.
        - Mensaje: `Peor hora ${scope}: ${hora}h con ${rate.toFixed(2)}% de contacto humano (${agent_answers} de ${total_calls} intentos).` (`scope` = «de la campaña X» / «del período»).
    - `buildWorstDevice(devices: DeviceRangeRow[], campaign?: string): DiagnosticEvent | null`
        - Ídem con `BEST_DEVICE_MIN_CALLS`, desempate final `device.localeCompare`, `type: 'WORST_DEVICE'`.

3. **`frontend/src/lib/crossDiagnostics.ts`**
    - Helper interno `composeCross(backendEvents, campaignEvents, limit)` con la lógica actual de `composeCrossPositives`.
    - `composeCrossPositives` pasa a delegar (firma y comportamiento idénticos).
    - Nueva `composeCrossNegatives(backendRootCauses, campaignEvents)` con `NEGATIVE_DRIVERS_MAX`.

4. **`frontend/src/App.tsx` — `CampaignsCompareMode`**
    - En el cuerpo (junto a `baseRows`, ~línea 795, con guarda `data ? … : []`):
      ```ts
      const crossPositives = diagnostics.data
        ? composeCrossPositives(diagnostics.data.positive_drivers ?? [], data ? [bestHourA, bestDeviceA, bestHourB, bestDeviceB] : [])
        : []
      const crossNegatives = diagnostics.data
        ? composeCrossNegatives(diagnostics.data.root_causes ?? [], data ? [worstHourA, worstDeviceA, worstHourB, worstDeviceB] : [])
        : []
      ```
    - CSV (`App.tsx:893`): `diagnosticRows(crossNegatives, crossPositives)`.
    - Feed (`App.tsx:916`): `rootCauses={crossNegatives}` y `positiveDrivers={crossPositives}` (se elimina el inline de `composeCrossPositives`).
    - Import: `composeCrossNegatives` desde `./lib/crossDiagnostics`; `buildWorstHour`, `buildWorstDevice` desde `./lib/rangeDiagnostics`.

5. **Tests**
    - `frontend/src/lib/__tests__/rangeDiagnostics.test.ts`: `describe('buildWorstHour')` y `describe('buildWorstDevice')` (3 tests c/u: criterio+min calls, empates, null + copy con campaign).
    - `frontend/src/lib/__tests__/crossDiagnostics.test.ts`: `describe('composeCrossNegatives')` (reserva+cap, orden A/B, nulls, backend truncado).
    - `frontend/src/__tests__/ModeTabs.test.tsx`:
        - Test «muestra Causas negativas por campaña…»: asserts «Peor hora de la campaña 35: 9h», «Peor dispositivo de la campaña 35: IPLAN», ídem 38.
        - Actualizar `getAllByTestId('insight-card')` de 6 → **10** (5 neg + 5 pos) en el test existente.
    - `frontend/src/__tests__/ExportButtons.test.tsx`: test nuevo — CSV `campanas_35_vs_38_diagnosticos.csv` con headers `Polaridad…` y 10 filas (5 Negativa + 5 Positiva), ubicando el botón por recorrido (índice esperado `[1]`, verificar al correr).

6. **Verificación**
    - `npm test` (frontend) · `npx tsc -b` · `npm run lint` · `npm run build`.
    - `.venv/Scripts/python -m pytest -q` → **164** (backend intacto).
    - Smoke real (uvicorn 127.0.0.1:8000): `GET /api/campaigns/compare-campaigns/diagnostics?campaign_a=35&campaign_b=38&start_date=2026-09-01&end_date=2026-09-15` (1 causa backend) y compare para hourly/devices → 5 tarjetas negativas + 5 positivas.
    - mtimes `/data` (`/tmp/data_mtimes_before.txt`) y `package.json` sin dependencias nuevas.
    - Marcar `task.md` en `[x]`.

## Riesgos / notas

- `insight-card` total en `ModeTabs` pasa de 6 a 10: actualizar la aserción existente.
- Con mocks de un solo candidato, la misma hora/dispositivo aparece como mejor y peor (esperado, decisión de diseño).
- Si `diagnostics.data` es `null` (cargando), el CSV queda vacío (comportamiento actual equivalente con `?? []`).
