# Spec 035: Peor hora y peor dispositivo en «Causas negativas» del rango

## Usuario

Analista / supervisor del call center (usuario interno). En el modo **Campaña completa** la columna «Causas negativas» solo muestra congestión de red y horas en burn (datos del backend) y **nunca dice cuál fue la peor hora ni el peor dispositivo** del período. En el modo campañas (Spec 032) esos dos eventos ya existen; en el rango no.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — peor hora y peor dispositivo en el rango]:** `mapRangeDiagnostics` (App.tsx) agrega a `rootCauses` los eventos ya construidos por **`buildWorstHour(hourly)`** y **`buildWorstDevice(devices)`** (Spec 032, sin campaña → `scope = "del período"`, `entity` = hora / device):
    *   `WORST_HOUR` / `WORST_DEVICE`, `severity: "WARNING"`, mensaje «Peor hora del período: …» / «Peor dispositivo del período: …» con tasa (2 dec.), `agent_answers` y `total_calls`.
    *   Candidatos: `agent_answer_rate ≠ null` y `total_calls ≥` `BEST_HOUR_MIN_CALLS` / `BEST_DEVICE_MIN_CALLS` (50); orden: menor tasa → menor `agent_answers` → hora/device ASC. Sin candidatos → no se emite.
*   **RF2 [State-driven — tope de negativas en el rango]:** `rootCauses` del rango pasa a componerse con **`composeCrossNegatives(causasBackend, [worstHour, worstDevice])`** (ya importado y testeado): garantiza los 2 eventos nuevos y completa con las causas del backend hasta **`NEGATIVE_DRIVERS_MAX` = 5**, orden = backend primero y destacados al final (mismo patrón que el modo campañas).
    *   Esto **supersede** el `rootCauses` sin tope de Spec 017 RF1 (congestión + burn ilimitados → máximo 5 tarjetas).
*   **RF3 [Unwanted behavior — aislamiento]:** cero endpoints nuevos (se alimenta de `overview.hourly`/`overview.devices` ya cargados); CSV `diagnosticos` del rango hereda los eventos nuevos automáticamente (`diagnosticRows`); modo comparar, modo campañas, rankings y semana **íntactos**; `pytest` = **164**; sin librerías nuevas.
*   **RF4 [Testing]:**
    *   `ExportButtons.test.tsx`: «RangeMode muestra peor hora y peor dispositivo en Causas negativas» (`/Peor hora del período/`, `/Peor dispositivo del período/`) y «RangeMode exporta el diagnóstico del rango con WORST_HOUR y WORST_DEVICE» (CSV índice 1, filas `Negativa` con esos tipos).
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Datos de entrada (campaña 35, 2026-09-01 → 2026-09-15)

*   Backend `GET /api/campaigns/35/diagnostics` → 2 `congested_gateways` (GW37, IPLAN2), 0 `burn_hours`.
*   `overview.hourly` → peor hora = **16h** (4.91%, 120 de 2446); `overview.devices` → peor dispositivo = **IPLAN2** (3.54%, 55 de 1555).
*   Negativas resultantes: GW37, IPLAN2, `16`, IPLAN2 → 4 tarjetas (≤ 5).

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 017 | RF1 `rootCauses` = congestión + burn sin tope | Ahora se compone con `composeCrossNegatives` (máx. 5, garantizando peor hora/dispositivo) |

## Fuera de Alcance

*   Backend, `/data`, esquema DB, dependencias.
*   Peor día / troncal de peor fricción; cambios en CompareMode o CampaignsCompareMode.
*   Renombrar `composeCrossNegatives`.

## Criterios de Finalización

*   Docs `spec/035-spec-range-worst/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke real campaña 35: «Causas negativas» con «Peor hora del período: 16h…» y «Peor dispositivo del período: IPLAN2…», ≤ 5 tarjetas; CSV `rango_35_..._diagnosticos.csv` con filas `Negativa;WARNING;WORST_HOUR;16` y `…;WORST_DEVICE;IPLAN2`.
*   `pytest -q` = **164**; `npm test` + `tsc` + `lint` + `build` en verde; `/data` mtimes intactos; `package.json` sin dependencias nuevas.
