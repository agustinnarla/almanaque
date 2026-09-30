# Spec 030: Intentos en bases, respiración en rankings y destacados de hora/dispositivo

## Usuario

Analista / supervisor del call center (usuario interno). Tres mejoras de legibilidad sobre el modo **Campaña completa**:

1.  «Bases por AA %» muestra la tasa pero **no cuántos intentos** respaldan cada base: una base con 45% sobre 100 llamadas se ve igual que una sobre 16.000.
2.  La sección «Rankings del rango» se ve **apretada**: 3 tarjetas justas (`gap-6`/`p-4`) con tablas de 5 columnas y filas de `py-2`.
3.  «Puntos destacados» puede mostrar franjas pico, troncal y jornada, pero **nunca dice cuál fue la mejor hora ni el mejor dispositivo** del período.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — intentos en el ranking de bases]:** `GET /api/campaigns/{c}/bases-ranking` devolverá, además de `{base, agent_answer_rate}`, el campo **`total_calls`** (entero) por base (aditivo: `AGG_COLUMNS` ya lo selecciona en `get_ranking`).
    *   `BasesRankingTable` muestra la columna **«Intentos»** entre «Base» y «AA %», alineada a la derecha, formateada con `toLocaleString('es-AR')` y estilo `font-mono` (misma convención que `SegmentRankingTable`).
    *   Tipo front `BaseRankingRow { base, agent_answer_rate, total_calls }` (campo **requerido**).
    *   Export CSV `basesRankingRows` gana el header **`Intentos`** (orden `Rank;Base;Intentos;Agent Answer %`), heredando Spec 025 (BOM, `;`, coma decimal).
*   **RF2 [UI — respiración de «Rankings del rango»]:** la sección conserva el **grid de 3 columnas** en desktop pero gana aire, sin cambiar columnas ni datos:
    *   `App.tsx`: `gap-6` → `gap-8`, tarjetas `p-4` → `p-5`, `mb-3` → `mb-4`; botones CSV con `flex-wrap`.
    *   Subtítulo `text-xs` por tarjeta con el criterio (bases = «Todas las bases ordenadas por Agent Answer»; dispositivos/horas = «Mejores y peores por health score» + `min_calls_applied`/`limit_applied`).
    *   `BasesRankingTable` y `SegmentRankingTable`: padding de filas/headers `px-2 py-2` → `px-3 py-2.5`; títulos «Mejores»/«Peores» con punto de color (emerald/rojo) y `gap` entre bloques `4` → `5`.
    *   Estados vacíos, loading/error y `data-testid` **intactos**.
*   **RF3 [State-driven — mejor hora y mejor dispositivo en Puntos destacados]:** dos eventos nuevos en la columna positiva de `RangeMode`, criterio **mayor `agent_answer_rate`**:
    *   `buildBestHour(hourly)` → `type: "BEST_HOUR"`, `severity: "SUCCESS"`, `entity` = hora (string). Candidatos de `overview.hourly`: `agent_answer_rate ≠ null` y `total_calls ≥ BEST_HOUR_MIN_CALLS` (**50**). Orden: mayor `agent_answer_rate` → mayor `agent_answers` → `hora` ASC. `message` en español con tasa (2 dec.), `agent_answers` y `total_calls`.
    *   `buildBestDevice(devices)` → `type: "BEST_DEVICE"`, `severity: "SUCCESS"`, `entity` = `device`. Mismos candidatos sobre `overview.devices` con `BEST_DEVICE_MIN_CALLS` (**50**); empate → mayor `agent_answers` → `device` ASC.
    *   Sin candidatos → no se emite (sin empty-state nuevo). Cero requests nuevos: se alimentan de `overview.hourly`/`overview.devices` ya cargados.
*   **RF4 [UI — tope y prioridad de Puntos destacados]:**
    *   `POSITIVE_DRIVERS_MAX` **3 → 5**; `POSITIVE_PRIORITY` = `PEAK_WINDOW 0 → BEST_HOUR 1 → BEST_DEVICE 2 → RELIABLE_TRUNK 3 → BEST_DAY 4 → PEAK_HOUR 5`.
    *   **Garantía:** si `BEST_HOUR`/`BEST_DEVICE` existen en la lista, siempre se muestran (aunque el `slice` a 5 los dejara fuera por varias ventanas pico: se reemplazan las entradas de menor prioridad y se reordena).
    *   Causas negativas, CompareMode y CampaignsCompareMode **intactos** (DiagnosticsFeed sin props nuevas conserva «Factores de mejora»).
*   **RF5 [Unwanted behavior — aislamiento]:**
    *   Un solo campo aditivo de contrato (`total_calls`); **sin endpoints, esquema DB ni engines nuevos**; `/data` intocado.
    *   Sin librerías nuevas (`package.json` y venv intactos).
    *   Cambios de UI solo en `RangeMode`; modo comparar y campañas sin cambios funcionales.
*   **RF6 [Testing]:**
    *   `pytest`: test nuevo `test_campaign_ranking_includes_total_calls` (claves + valores del seed: 34→240, 80→100, 99→50); resto intacto.
    *   `vitest`: `rangeDiagnostics.test.ts` (builders con mínimo de llamadas, empates y sin candidatos; orden de prioridad; garantía con 4 ventanas pico; tope 5), `BasesRankingTable.test.tsx` (columna Intentos + índices), `exporters.test.ts` (headers/fila nuevos) y fixtures `total_calls` en `ModeTabs`/`ExportButtons`/`rankings`.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build`; `pytest -q` en verde.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 020 | RF4 (tope `POSITIVE_DRIVERS_MAX = 3` y prioridad `PEAK_WINDOW → RELIABLE_TRUNK → BEST_DAY → PEAK_HOUR`) | Tope pasa a **5** y se suman `BEST_HOUR`/`BEST_DEVICE` con garantía de inclusión |
| 026 | RF1 «**cero cambios de backend**» y contrato `BaseRankingRow {base, agent_answer_rate}` | `get_ranking` suma `total_calls` (aditivo) y la tabla muestra la columna «Intentos» |

Specs 006, 016, 017, 021, 025 y los modos comparar/campañas **intactos**.

## Datos de entrada

*   `GET .../bases-ranking` → `[{base, agent_answer_rate, total_calls}]` (campaña 35 completo: 34 = 44.95% / 198 intentos, 76 = 41.18% / 17, 80 = 5.70% / 35.198).
*   `GET .../hourly-trend` y `GET .../devices` → ya consumidos por `useCampaignOverview` (`overview.hourly`, `overview.devices`).
*   Constantes front nuevas/modificadas en `frontend/src/lib/rangeThresholds.ts` (**no** se edita `backend/config.py`).

## Contrato JSON

```jsonc
// GET /api/campaigns/35/bases-ranking?start_date&end_date
[
  { "base": "34", "agent_answer_rate": 0.4495, "total_calls": 198 },
  { "base": "76", "agent_answer_rate": 0.4118, "total_calls": 17 }
]
```

El resto de endpoints sin cambios. `DiagnosticEvent.type` agrega `BEST_HOUR` y `BEST_DEVICE` (solo front). Mensajes en español; UI en español.

## Fuera de Alcance

*   `/data`, esquema DB, routers, engines, `backend/config.py`.
*   Intentos en el modo comparar (`CrossRankingTable` / `mergeBaseRankings`).
*   Cambios de datos en CompareMode y CampaignsCompareMode.
*   Renombrar columnas existentes; paginación; librerías nuevas; export a PDF.

## Criterios de Finalización

*   Docs `spec/030-spec-rankings-highlights/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke real (campaña 35, 2026-09-01 → 2026-09-15):
    *   «Bases por AA %» con columna **Intentos** (34/76/80) y CSV `rango_35_..._bases_ranking.csv` con `Rank;Base;Intentos;Agent Answer %`.
    *   «Rankings del rango» con `gap-8`/`p-5`, subtítulos por tarjeta y filas de `py-2.5`.
    *   «Puntos destacados» con hasta **5** tarjetas, incluyendo **mejor hora = 11h** (7.09%, 366/5161) y **mejor dispositivo = IPLAN** (7.19%, 1195/16625) por AA %.
*   `pytest -q` en verde (test nuevo de `total_calls`); `npm test` + `tsc` + `lint` + `build` en verde.
*   `package.json` sin dependencias nuevas; `/data` mtimes intactos.
