# Spec 028: Rankings y alertas comparados (modo Campañas)

## Usuario

Analista / supervisor del call center (usuario interno), el mismo de las Specs 026/027. En el modo **Campañas** (35 vs 38) ya se comparan KPIs, diagnóstico, gateways, bases (intersección con volumen mínimo) y series temporales, pero **falta dónde concentrarse**: los rankings por health score (Spec 005/006) y las alertas bajo umbral (Spec 002) solo existen en el modo Campaña completa. El analista que compara 2 campañas tiene que cambiarse de pestaña y leer dos rankings por separado. Este *spec* lleva lo de las Specs 026/027 al modo Campañas **fusionando A|B en una sola vista**, con **cero cambios de backend**.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — rankings comparados]:** nueva sección «Rankings comparados» en `CampaignsCompareMode`, tras «Recomendaciones», alimentada por los endpoints existentes llamados **2 veces** (campaña A y B) con el rango fijo del modo (`CROSS_START_DATE → CROSS_END_DATE`, `min_calls` del filtro, `limit = 5`):
    *   `GET /api/campaigns/{c}/bases-ranking`, `/{c}/devices/ranking`, `/{c}/hours/ranking` → **cero contratos nuevos**.
    *   3 tarjetas en `grid lg:grid-cols-3 items-start` (patrón Spec 027 RF2: encabezado con icono `Trophy`, `h3` propio, sin bordes dobles):
        *   **Bases**: unión de bases de ambas campañas → columnas `Base | AA A | AA B | Δ pp` (faltantes → `—`), orden por AA promedio desc. Filas: `34, 80, 76, 0` (base `0` solo en B: AA 70%).
        *   **Dispositivos** y **Horas**: unión de `best`+`worst` por campaña (dedup por `device`/`hora`) → columnas `Segmento | AA A | AA B | Δ pp | H A | H B` (`text-xs`), orden por health promedio desc (si falta, el disponible).
    *   Lógica pura nueva `frontend/src/lib/rankings.ts`: `mergeBaseRankings(a, b)` y `mergeSegmentRankings(a, b, kind)` → filas `CrossRankingRow { key, rateA, rateB, delta, healthA, healthB }`.
    *   Componente `overview/CrossRankingTable.tsx` con el lenguaje visual de Spec 027: `h4` interno, `<caption>` sr-only, `hover:bg-slate-50`, health coloreado (`data-good`/`data-warn`/`data-bad`, umbrales `≥0`/`≥−10`/`<−10`), estado vacío `border-dashed`.
*   **RF2 [State-driven — alertas de patrones comparadas]:** nueva sección «Alertas de patrones» tras Rankings, alimentada por **una sola** llamada a `GET /api/patterns` (ya devuelve ambas campañas) + filtro en cliente:
    *   Lógica pura `comparePatternSummaries(alerts, campaignA, campaignB)` en `lib/patterns.ts` → `{ byDay: [{fecha, alertsA, alertsB}], combos: [{base, device, alertsA, alertsB, total, worstRateA, worstRateB}] }` (fechas en unión ordenada asc; combos top-5 por `total` desc).
    *   Componente `Insights/PatternsComparePanel.tsx`: **barras dobles** por fecha (A índigo `bg-indigo-400`, B ámbar `bg-amber-400`, leyenda, eje compartido = máximo de ambos, fecha `dd/MM` vía `Intl` + ISO en `title`) y tabla `Base | Dispositivo | A | B | Total` con fila #1 `bg-amber-50`; chips de totales «35: 170 · 38: 193».
*   **RF3 [UI — export CSV]:** +5 botones `ExportCsvButton` en `CampaignsCompareMode` (**7 → 12**), heredando Spec 025 (BOM/`;`/coma decimal/`print:hidden`), patrón de nombre `campanas_{A}_vs_{B}_{sección}.csv` con secciones `rank_bases|rank_devices|rank_hours|patterns_daily|patterns_combos`:
    *   Builders nuevos en `lib/exporters.ts`: `crossRankingRows`, `patternCompareDailyRows`, `patternCompareComboRows`.
    *   Orden DOM: `[0..2]` kpis/diagnóstico/recomendaciones intactos → `[3..7]` nuevos (bases, devices, hours, patterns_daily, patterns_combos) → `[8..11]` hourly, gateways, bases existentes, daily.
*   **RF4 [Ubiquitous — datos]:** reutilizar **tal cual** los hooks `useRangeRankings` (×2, una por campaña) y `usePatternAlerts` (×1) — ya mockeados en `ModeTabs.test.tsx`/`ExportButtons.test.tsx` → **cero cambios de mocks**. Tipos nuevos solo si hace falta (`CrossRankingRow`, `PatternCompare*`).
*   **RF5 [Unwanted behavior — aislamiento]:**
    *   Cero endpoints, engines, contratos o dependencias nuevos; `pytest` intacto en **156**; `package.json` y `/data` intocados.
    *   CompareMode (día A vs día B) y RangeMode **sin cambios**; Specs 023/024 sin supersede — la sección «Comparativa de bases» existente se **mantiene** (intersección con `min_calls` en ambas + shares: hoy 1 fila, base 34) con su copy actual; la nueva «Bases» aporta el ranking completo (4 filas) — son complementarias.
*   **RF6 [Testing]:**
    *   Nuevos: `lib/__tests__/rankings.test.ts` (unión, faltantes, orden), casos de `comparePatternSummaries` en `patterns.test.ts`, `overview/__tests__/CrossRankingTable.test.tsx`, `Insights/__tests__/PatternsComparePanel.test.tsx`, builders en `exporters.test.ts`.
    *   Actualizar: `ExportButtons.test.tsx` campaigns `7 → 12` y `buttons[5]` (bases CSV) → `buttons[10]`.
    *   Regresión: `npx vitest run` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q` (156).

## Specs superadas por esta revisión

Ninguna *supersede* completa. Extiende el alcance de UI de la **Spec 026** (secciones de rankings/alertas) y aplica el lenguaje visual de la **Spec 027** al modo Campañas; las Specs 023/024 (comparación de campañas) quedan intactas — ver RF5.

## Datos de entrada (smoke real)

*   `bases-ranking` 35 → `34: 44.95%, 76: 41.18%, 80: 5.70%` · 38 → `0: 70.00%, 80: 57.14%, 34: 51.58%, 76: 4.67%`.
*   `devices/ranking` 38 → best IPLAN 1.65 … worst GW37 −35.33 (35: IPLAN 3.38 … GW37 −25.67).
*   `/api/patterns` 01→15/09 → 363 filas: **35 = 170**, **38 = 193**, 11 días comunes.
*   `bases_comparison` (Spec 023 existente, `min_calls=50` en ambas) → **1 fila** (base 34) → sin duplicidad con la nueva sección.

## Contrato JSON

**Sin cambios.** `pytest` debe pasar intacto con los 156 tests actuales.

## Fuera de Alcance

*   Backend, routers, engines, esquema DB, `/data`, nuevos endpoints de comparación.
*   CompareMode (día A vs día B); RangeMode; `GET /api/metrics`; paginación.
*   Nuevas librerías (gráficas, icon sets); cambios en `summarizePatterns` existente o en builders previos.

## Criterios de Finalización

*   Docs `spec/028-spec-cross-rankings/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Sección «Rankings comparados» con 3 tarjetas fusionadas A|B|Δ (bases 4 filas incluyendo `0` solo-B; devices/horas con health coloreado) y «Alertas de patrones» con barras dobles (170 vs 193) y combos `A|B|Total`.
*   CampaignsCompareMode: **12** botones CSV con el patrón `campanas_35_vs_38_{sección}.csv` y orden `[0..2]` intacto.
*   `npm test` + `tsc` + `lint` + `build` en verde; `pytest -q` = **156**.
*   `package.json` sin dependencias nuevas; `/data` mtimes intactos (22/22).
