# Spec 020: Diagnósticos enriquecidos del rango

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). En «Campaña completa» el feed de positivos es poco accionable: horas sueltas, sin señal de troncal sana ni de mejor jornada, y un copy genérico de columna.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — ventana pico consolidada]:** El frontend agrupará las horas de `peak_hours` con `agent_answer_rate ≥ PEAK_WINDOW_MIN_RATE` (**0.065**, constante front) en runs de hora consecutiva (`hora[i+1] == hora[i] + 1`).
    *   Run de **≥ 2 horas** → un solo `DiagnosticEvent` con `type: "PEAK_WINDOW"`, `severity: "INFO"`, `entity: "9h–11h"` (guion medio) y `message` en español con **tasa ponderada** `SUM(rate × total) / SUM(total)` y absolutos acumulados (no promedio simple de %).
    *   Run de **1 hora** → se conserva como `PEAK_HOUR` individual (Spec 017 RF2).
    *   Horas no consecutivas entre sí no se fusionan (p. ej. 9h y 11h sin 10h apta → dos eventos).
    *   `peak_hours: []` o ninguna ≥ umbral → sin `PEAK_WINDOW`.
    *   *Por qué:* Una franja 9h–11h es más legible que tres tarjetas sueltas.

*   **RF2 [State-driven — troncal de menor fricción]:** Sobre `overview.devices` del rango, el sistema emitirá **como máximo 1** evento `type: "RELIABLE_TRUNK"`, `severity: "SUCCESS"` si existe candidato que cumpla **todas**:
    *   `share = total_calls(device) / total_calls(campaña) ≥ TRUNK_MIN_SHARE` (**0.10**);
    *   `congestion_rate < TRUNK_MAX_CONGESTION` (**0.05**);
    *   `busy_rate ≤ TRUNK_MAX_BUSY` (**0.31**);
    *   **no** `AMD`: `machine_answers ≥ AMD_RATIO × agent_answers` con `AMD_RATIO = 4.0` (misma regla Specs 018/019; ambos 0 → no es AMD);
    *   rates no `null`.
    *   Selección determinista: **menor `congestion_rate`**, empate → **mayor `share`**.
    *   `entity` = `device`; `message` en español con congestión, ocupado y share (2 dec. / 1 dec.).
    *   Sin candidato → no se emite (sin empty-state nuevo).
    *   *Por qué:* Destacar la troncal con menos fricción de red y línea, sin promover troncales con contestadores desbalanceados (guarda AMD). En campaña 35 el único que pasa es **GW39**.

*   **RF3 [State-driven — mejor jornada del período]:** Sobre `overview.daily`, el sistema emitirá **como máximo 1** evento `type: "BEST_DAY"`, `severity: "SUCCESS"`:
    *   Candidatos: `agent_answer_rate ≠ null` y `total_calls ≥ BEST_DAY_MIN_CALLS` (**50**).
    *   Ganador: **mayor `agent_answer_rate`**; empate → mayor `agent_answers`, luego `fecha` ASC.
    *   `entity` = `fecha` ISO `YYYY-MM-DD`; `message` en español con tasa (2 dec.), `agent_answers` y `total_calls`.
    *   Sin candidatos → no se emite.
    *   *Por qué:* Marcar el día récord del rango sin salir del feed.

*   **RF4 [UI — header dinámico solo en rango]:** `DiagnosticsFeed` aceptará props **opcionales** `positiveTitle?` y `positiveDescription?` con **default = textos actuales** («Factores de mejora» / «Señales positivas o recuperaciones detectadas»).
    *   **RangeMode** (`App.tsx`) pasa `positiveTitle="Puntos destacados"` y `positiveDescription="Fortalezas y señales positivas del período"`.
    *   **CompareMode** no envía las props → copy **intacto**.
    *   La columna positiva del rango se limita a los **3** primeros eventos tras el orden de prioridad: `PEAK_WINDOW` → `RELIABLE_TRUNK` → `BEST_DAY` → `PEAK_HOUR` restantes (`POSITIVE_DRIVERS_MAX = 3`), vía `slice` en el mapeo del rango (no se toca `ROOT_CAUSES_LIMIT` del backend).
    *   Causas negativas (`NETWORK_CONGESTION`, `BUSY_HOUR`) sin cambio.

*   **RF5 [Testing]:**
    *   `vitest`: (a) fusión 9+10+11 → un `PEAK_WINDOW` con tasa ponderada; (b) hora aislada ≥ umbral → `PEAK_HOUR`; (c) 9 y 11 sin 10 → sin fusión; (d) trunk: GW39 gana con fixtures de campaña 35; IPLAN descartado por AMD; GW20 por busy; sin candidato → `null`; (e) best-day: max rate con `min_calls`, empates; (f) `DiagnosticsFeed` con/sin props de título; (g) regresión suite actual.
    *   `pytest -q` → **sin cambios** (143) — la spec es front-only.
    *   Regresión: `npx tsc -b`, `npm run lint`, `npm run build` en verde.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 017 | RF2 mapeo positivos (solo `PEAK_HOUR` a plana) | El rango puede emitir `PEAK_WINDOW`, `RELIABLE_TRUNK`, `BEST_DAY` y top-3 |

Specs 006, 010, 014, 016, 018, 019 y el modo compare **intactos**. Endpoints y esquema sin cambios.

## Datos de entrada

*   `GET .../diagnostics` rango → `peak_hours` (ya consumido).
*   `GET .../devices` y `GET .../daily` → vía `useCampaignOverview` (`overview.devices`, `overview.daily`), ya cargados en RangeMode.
*   Constantes front nuevas en `frontend/src/lib/rangeThresholds.ts` (espejo de umbrales de negocio; **no** se edita `backend/config.py`).

## Contrato JSON

Sin cambios de endpoints. Solo `DiagnosticEvent.type` en el front (`PEAK_WINDOW` | `RELIABLE_TRUNK` | `BEST_DAY` además de los existentes). `message` en español; UI en español.

## Fuera de Alcance

*   Backend, esquema DB, `/data`, `recommendations_engine`, `diagnostics_engine`, `campaigns_repo`.
*   Cambiar `peak_hours` del API o Spec 006 RF5.
*   Modo comparar (header y eventos A/B sin cambios).
*   Renombrar tipos de recomendación; auth; deploy; librerías nuevas.

## Criterios de Finalización

*   Docs `spec/plan/task` con esta estructura; `task.md` en `[x]`.
*   `npm test` (+ tests nuevos de umbral, fusión, trunk, best-day, header) en verde; `npx tsc -b`; `npm run lint`; `npm run build`.
*   `pytest -q` → 143 passed (sin tocar backend).
*   Smoke campaña 35, rango 01→15:
    *   `PEAK_WINDOW` **9h–11h** (tasas 6.90 / 6.93 / 7.09 ≥ 6.5%; ponderada ≈ 6.98%).
    *   `RELIABLE_TRUNK` **GW39** (cong ≈ 3.50%, busy ≈ 30.02% ≤ 31%, share ≈ 15.7%, no AMD).
    *   `BEST_DAY` **2026-09-11** (AA ≈ 8.52%, 218/2558, ≥50).
    *   Header rango = «Puntos destacados» + «Fortalezas y señales positivas del período»; compare conserva «Factores de mejora».
    *   Máximo **3** tarjetas en la columna positiva del rango.
*   `/data` mtimes intactos.
