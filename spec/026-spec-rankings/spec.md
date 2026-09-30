# Spec 026: Rankings y alertas de patrones a la UI

## Usuario

Analista / supervisor del call center (usuario interno). El dashboard (Specs 016/021/023/024/025) responde *cómo va* la campaña, pero no responde **dónde concentrarse**: el endpoint de bases (`bases-ranking`) y los rankings de dispositivos/horas (`devices/ranking`, `hours/ranking`) llevan tests en backend desde las Specs 005/006 y **nadie los consume**; `/api/patterns` devuelve las combinaciones bajo umbral pero **tampoco se muestra nunca**. El analista tiene que consultarlos a mano con curl o quedarse con las tablas ordenadas por volumen.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — rankings del rango]:** en el modo **Campaña completa** (`RangeMode`), nueva sección «Rankings del rango» con 3 tablas alimentadas por endpoints existentes (**cero cambios de backend**):
    *   `BasesRankingTable` ← `GET /api/campaigns/{c}/bases-ranking?start_date&end_date`: muestra **todas** las filas `{base, agent_answer_rate}` tal cual las devuelve (ya ordenadas desc por el backend; en el rango completo son 3: `34`, `76`, `80`).
    *   `SegmentRankingTable` (dispositivos) ← `GET /api/campaigns/{c}/devices/ranking?…&min_calls=50&limit=5` y `SegmentRankingTable` (horas) ← `GET /api/campaigns/{c}/hours/ranking?…`: muestran `best` y `worst` con `total_calls`, `agent_answer_rate`, `busy_rate`, `congestion_rate` y `health_score` (2 decimales), respetando `min_calls_applied`/`limit_applied`.
    *   Estados vacíos con el estilo `border-dashed` existente; loading/error con el patrón de los hooks actuales.
*   **RF2 [State-driven — alertas de patrones agregadas]:** nueva sección «Alertas de patrones» en `RangeMode` alimentada por `GET /api/patterns?start_date&end_date`:
    *   **Filtro por campaña en cliente** (el endpoint cruza campañas: 363 filas totales, 170 de la 35).
    *   **Agregación pura** en `frontend/src/lib/patterns.ts` → `summarizePatterns(alerts, campaign)`:
        *   `byDay: [{ fecha, alerts }]` ordenado por `fecha` asc.
        *   `topCombos: [{ base, device, alerts, worstRate }]` — top **5** combinaciones `base × device`, ordenadas por cantidad de alertas desc y, en empate, por `worstRate` asc (peor tasa primero).
    *   UI: mini-resumen de alertas por día (fecha + cantidad) y tabla de top combinaciones con `worstRate` en % (2 decimales).
*   **RF3 [UI — export CSV de las nuevas secciones]:** 5 botones nuevos `ExportCsvButton` en `RangeMode` (**6 → 11**), heredando Spec 025 (BOM, `;`, coma decimal, `print:hidden`):
    *   Secciones nuevas: `bases_ranking` · `devices_ranking` · `hours_ranking` · `patterns_daily` · `patterns_combos`.
    *   Patrón de nombre invariable: `rango_{campaña}_{desde}_{hasta}_{sección}.csv`.
    *   Builders puros nuevos en `frontend/src/lib/exporters.ts`: `basesRankingRows`, `segmentRankingRows`, `patternDailyRows`, `patternComboRows` (encabezados ES, % 2 decimales).
*   **RF4 [Ubiquitous — datos]:** 100% client-side sobre los contratos ya existentes; tipos nuevos en `frontend/src/types/api.ts` (`BaseRankingRow`, `SegmentRankingItem`, `SegmentRankingResponse`, `PatternAlert`). Hooks nuevos `useRangeRankings` (3 requests en `Promise.all`, un solo loading/error/reload) y `usePatternAlerts`, siguiendo el patrón `IDLE`/`tick`/`abort` de `useRangeDiagnostics`.
*   **RF5 [Unwanted behavior — aislamiento]:**
    *   **Cero** endpoints, engines o contratos nuevos; `pytest` debe seguir en **156**.
    *   Sin librerías nuevas (`package.json` y venv intactos).
    *   Alcance **solo** en `RangeMode`: CompareMode y CampaignsCompareMode sin cambios (además de los ajustes de mocks de tests).
*   **RF6 [Testing]:**
    *   `vitest`: `patterns.test.ts` (agrupación, orden, top-5, filtro de campaña, empate por peor tasa) · tests de los 3 componentes (filas, vacíos, top-5) · builders en `exporters.test.ts` · actualización de conteos en `ModeTabs.test.tsx` y `ExportButtons.test.tsx` (11 botones + mocks de los 2 hooks nuevos).
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build`; `pytest -q` intacto en **156**.

## Specs superadas por esta revisión

Ninguna. Spec **aditiva de frontend** sobre contratos de Specs 005/006/002, sin supersede.

## Datos de entrada

*   `GET /api/campaigns/{c}/bases-ranking` → `[{ base, agent_answer_rate }]` (34: 0.4495, 76: 0.4118, 80: 0.0570).
*   `GET /api/campaigns/{c}/devices/ranking?min_calls=50&limit=5` → `{min_calls_applied, limit_applied, best[], worst[]}` (mejor IPLAN health 3.38; peor GW37 −25.67).
*   `GET /api/campaigns/{c}/hours/ranking?min_calls=50&limit=5` → igual con `hora` (mejor 16: −3.72; peor 13: −15.88).
*   `GET /api/patterns?start_date&end_date` → `[{fecha, hora, campaign, base, device, agent_answer_rate, pattern_alert}]` (363 totales; 170 de la campaña 35; 01/09 = 36; top combo `80 × GW20` = 36).
*   `min_calls` = `DEFAULT_MIN_CALLS` (50) y `limit` = 5 de `App.tsx`; `AGENT_ANSWER_THRESHOLD` = 0.05 (backend, intocado).

## Contrato JSON

**Sin endpoints nuevos.** No hay cambios de contrato: `pytest` debe pasar intacto con los 156 tests actuales.

## Fuera de Alcance

*   Backend, routers, engines, esquema DB, `/data`.
*   `GET /api/metrics` (774 filas crudas, redundante con los agregados ya visibles: summary/daily/hourly/devices).
*   Rankings/alertas en CompareMode y CampaignsCompareMode; paginación; cambios en `/api/patterns` (filtro de campaña, agregación server-side); alertas por hora dentro de la combinación; export a PDF nuevo.

## Criterios de Finalización

*   Docs `spec/026-spec-rankings/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke real (campaña 35, 2026-09-01 → 2026-09-15): 3 bases (34/76/80), mejor IPLAN, peor GW37, mejor hora 16, peor hora 13, **170** alertas agregadas en **11** días, top combo `80 × GW20` con **36**; los 11 botones CSV descargan con el patrón `rango_35_2026-09-01_2026-09-15_{sección}.csv`.
*   `pytest -q` = **156**; `npm test` + `tsc` + `lint` + `build` en verde.
*   `package.json` sin dependencias nuevas; `/data` mtimes intactos.
