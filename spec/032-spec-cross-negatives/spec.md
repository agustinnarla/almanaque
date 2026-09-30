# Spec 032: Causas negativas por campaña y CSV de diagnóstico sincronizado

## Usuario

Analista / supervisor del call center (usuario interno). La Spec 031 llevó los *Puntos destacados* del modo **Campaña vs Campaña** a nivel por campaña (`11 · 35`, `IPLAN · 38`), pero la columna **Causas negativas** quedó atrás:

1.  Muestra solo las causas crudas del backend (`NETWORK_CONGESTION · GW37`, `BASE_DEGRADATION · Base 34`…), cuyos textos son deltas agregados A→B y **nunca dicen a qué campaña pertenecen**.
2.  No hay ningún detalle *horario* ni *por dispositivo* del lado negativo: hoy puede quedar una sola tarjetas mientras el lado positivo muestra 5.
3.  El CSV del bloque «Diagnóstico» exporta los crudos del backend: **queda desincronizado** de lo que se pinta en pantalla (problema que ya existía en los positivos desde la Spec 031).

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — builders negativos por campaña]:** nuevos `buildWorstHour(hourly, campaign?)` y `buildWorstDevice(devices, campaign?)` en `frontend/src/lib/rangeDiagnostics.ts`, **espejo exacto** de `buildBestHour`/`buildBestDevice`:
    *   Criterio: `agent_answer_rate != null` y `total_calls >= BEST_HOUR_MIN_CALLS` / `BEST_DEVICE_MIN_CALLS` (50); orden **ascendente** por tasa (peor primero); empate → **menor** `agent_answers` → hora/device ASC.
    *   `severity: 'WARNING'`, tipos nuevos `WORST_HOUR` / `WORST_DEVICE`.
    *   Sin `campaign` → `entity` sin sufijo y copy «del período» (simetría con los positivos).
    *   Con `campaign` → `entity: "9 · 35"` / `"IPLAN · 38"` y mensaje «Peor hora de la campaña 35: 9h con 10.00% de contacto humano (10 de 100 intentos).».
    *   Sin candidatos → `null` (se descarta al componer).
*   **RF2 [State-driven — composición]:** nueva `composeCrossNegatives(backendRootCauses, campaignEvents)` en `frontend/src/lib/crossDiagnostics.ts`, espejo de `composeCrossPositives`:
    *   Reserva los highlights de campaña (hasta 4: peor hora/dispositivo de A y de B) y completa con `root_causes` del backend **en su orden** hasta `NEGATIVE_DRIVERS_MAX` (**5**).
    *   Salida: `[…causas backend…, peor hora A, peor device A, peor hora B, peor device B]`; `null` descartados.
    *   Ambas composiciones (`composeCrossPositives` y `composeCrossNegatives`) delegan en un helper interno; la API pública de la 031 **no cambia**.
*   **RF3 [State-driven — CSV sincronizado]:** el botón CSV del bloque «Diagnóstico» de `CampaignsCompareMode` exporta **las listas compuestas** (`diagnosticRows(crossNegatives, crossPositives)`), igual que lo pintado. Mismo criterio para el `DiagnosticsFeed`.
*   **RF4 [Unwanted behavior — aislamiento]:**
    *   **Cero** cambios de backend/routers/DB: `pytest` se mantiene en **164**.
    *   Nueva constante `NEGATIVE_DRIVERS_MAX = 5` en `rangeThresholds.ts` (espejo de `POSITIVE_DRIVERS_MAX`).
    *   RangeMode, CompareMode y títulos de `DiagnosticsFeed` **intactos**; botones CSV de campañas **12 → 12**.
*   **RF5 [Testing]:**
    *   `vitest`: `rangeDiagnostics.test` (builders `buildWorst*`: criterio, min calls, empates, `null`, copy con campaña) · `crossDiagnostics.test` (`composeCrossNegatives`: garantía, orden, cap 5, nulls) · `ModeTabs` (4 tarjetas «Peor … de la campaña …»; total de `insight-card` 6 → 10) · `ExportButtons` (CSV `campanas_35_vs_38_diagnosticos.csv` con 5 filas Negativa + 4 Positiva en el mock, que no trae `positive_drivers`).
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 031 | Composición solo de positivos en `CampaignsCompareMode` y CSV con crudos | Ahora ambos flujos (positivos y negativos) se componen en front y el CSV exporta lo pintado |

Spec 031 se **extiende** al lado negativo; Specs 028-030, CompareMode y RangeMode **intactos**.

## Datos de entrada (smoke real 35 vs 38, 2026-09-01 → 2026-09-15)

*   `root_causes` del backend (hoy) → **1** (`NETWORK_CONGESTION · GW37`, CRITICAL) → total de tarjetas negativas = **1 + 4 = 5**.
*   `hourly_a/b` y `devices_a/b` → mismos insumos de los positivos (ya en el envelope de compare; **cero requests nuevos**).
*   Criterio: min calls 50 (`BEST_*_MIN_CALLS`), menor `agent_answer_rate`, empate → menor `agent_answers` → hora/device ASC.
*   Nota: con un solo candidato válido, esa hora/dispositivo aparece como mejor **y** como peor (misma regla simétrica que los builders positivos; no se agrega umbral de tasa "sana").

## Contrato

*   Sin cambios de JSON: no se toca el backend ni los tipos de respuesta.
*   Nuevos `DiagnosticEvent.type` front-only: `WORST_HOUR`, `WORST_DEVICE` (`severity: 'WARNING'`).
*   Mensajes en español; UI en español.

## Fuera de Alcance

*   Backend, routers, esquema DB, `/data`.
*   Títulos/descripción/mensaje vacío de la columna negativa de `DiagnosticsFeed` (sigue «Causas negativas» / «…para este rango»).
*   Etiquetar las causas existentes del backend con su campaña; builders negativos por día/troncal; CompareMode y RangeMode; librerías nuevas.

## Criterios de Finalización

*   Docs `spec/032-spec-cross-negatives/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke 35 vs 38 (01→15/09):
    *   «Causas negativas» = **5** tarjetas: `NETWORK_CONGESTION · GW37` (backend) + peor hora/device de 35 y de 38 (entity `H · 35`, `DEV · 38`).
    *   «Puntos destacados» sigue en 5 (sin regresión).
    *   CSV `campanas_35_vs_38_diagnosticos.csv` = 10 filas (5 Negativa + 5 Positiva).
*   `pytest -q` = **164**; `npm test` + `tsc` + `lint` + `build` en verde.
*   `package.json` sin dependencias nuevas; `/data` mtimes intactos.
