# Spec 039: Jerarquía visual, consistencia y navegación

## Usuario

Analista / supervisor del call center (usuario interno). El dashboard creció sección por sección y quedó inconsistente:

1.  **Títulos duplicados y jerarquía rota**: «Recomendaciones del rango» (`h2` del modo) y justo abajo «Observaciones y recomendaciones» (otro `h2` del panel). Las columnas «Causas negativas» / «Puntos destacados» también son `h2` dentro de la sección «Diagnóstico».
2.  **Tarjetas oscuras en una UI clara**: las recomendaciones usan `bg-slate-900` (Spec 010, «estética destacada oscuro»), mientras que todo lo demás (diagnóstico, rankings, KPIs) es blanco con borde. El badge de AMD excluido está pensado para fondo oscuro.
3.  **Formateadores repetidos**: `formatRate`/`formatRatePct` están definidos 4 veces, `formatDeltaPp` 2, `formatHealth`/`formatScore` 3, `formatNumber` 2. Además, 7 helpers exportados desde componentes generan los **7 warnings** de lint `only-export-components` que quedan.
4.  **Páginas largas sin navegación**: el modo rango tiene 7 secciones y el de campañas 8. Para llegar a «Alertas de patrones» hay que scrollear toda la página.
5.  **«Mín. llamadas» fijo en 50 en Campaña completa / Por semana**: los modos «Comparar 2 días» y «Comparar campañas» ya tienen el selector. En las campañas grandes (91, 92), 50 llamadas es un umbral bajo para rankings y recomendaciones.

Es el ítem 038 del plan de mejora (Fase 1).

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — un título por sección]:** Cada sección tiene **un solo `h2`**: el del modo, junto a sus botones CSV. Los componentes internos usan `h3`.
    *   `DiagnosticsFeed`: las columnas («Causas negativas», «Factores de mejora» / «Puntos destacados») pasan de `h2` a **`h3`**. Textos, íconos y descripciones sin cambios.
    *   `RecommendationsPanel`: se elimina su `h2` «Observaciones y recomendaciones» y la prop `headerAction`, que no se usaba. Conserva la descripción «Generadas automáticamente…», los grupos `h3` y el empty-state. Su `<section aria-label>` interno pasa a `<div>`, para no anidar dos regiones con nombre.
    *   Los gráficos, cuyo `h2` es el título de la sección, y las tarjetas de rankings (`h3`/`h4`) ya cumplen la regla y no cambian.

*   **RF2 [Ubiquitous — tarjetas de recomendación claras]:** `RecommendationCard` adopta el estilo de `InsightCard`:
    *   Fondo blanco, `border border-slate-200` y `shadow-sm`; mantiene el **`border-l-4` por categoría** (`border-l-rose/amber/emerald/slate-*`).
    *   Tipo en negrita `text-slate-900`, entidad en `text-slate-600` y texto en `text-slate-700`.
    *   Suma el **`Badge` de severidad** (Crítico / Advertencia / Éxito / Información) a la derecha, igual que en diagnóstico.
    *   El badge de AMD excluido (`routing-excluded-amd`) pasa a ámbar claro: `border-amber-200`, `bg-amber-50`, texto `amber-900`/`amber-800`, ícono `amber-600`. Textos sin cambios.

*   **RF3 [Ubiquitous — formateadores únicos]:** Nuevo `lib/format.ts`:
    *   `formatRatePct(rate, digits = 2)`: `0.0594 → "5.94%"`; `null` → `"—"`.
    *   `formatNumber(value)`: `35413 → "35.413"` (es-AR); `null` → `"—"`.
    *   `formatScore(score)`: 2 decimales; `null` → `"—"`.
    *   `formatDeltaPp(delta)`: delta como fracción, `0.0123 → "+1.23 pp"`, con signo menos tipográfico `−`; `null` → `"—"`.
    *   Reemplaza las copias locales en `KpiGrid`, `OverviewKpis`, `GatewaysTable`, `BasesCompareTable` (`formatShare` → `formatRatePct(share, 1)`), `CrossRankingTable`, `SegmentRankingTable`, `BasesRankingTable`, `GatewaysRangeTable`, `PatternsPanel` y `PatternsComparePanel`.
    *   **El texto renderizado no cambia.** `CrossRankingTable.formatDelta`, que recibe el delta ya en pp, y los tooltips de los gráficos, que reciben valores ya escalados, quedan como están.

*   **RF4 [Ubiquitous — helpers fuera de los componentes]:** Para que cada archivo de componente exporte solo componentes (regla `only-export-components`):
    *   `lib/gateways.ts`: `GatewayStatus`, `SATURATED_RATE_B`, `RELIEVED_DELTA`, `gatewayStatus` (hoy en `GatewaysTable.tsx`).
    *   `lib/chartData.ts`: `mapDailyPoints`/`DailyChartPoint` (hoy en `DailyTrendChart.tsx`), `mergeHourlyPoints`/`MergedHourPoint` (en `HourlyTrendChart.tsx`) y `mergeDailyPoints`/`DailyComparePoint` (en `DailyCompareChart.tsx`), sin cambios de lógica.
    *   Lint: **7 → 0 warnings**, 0 errores.

*   **RF5 [State-driven — índice de secciones]:** Nuevo `components/common/SectionNav.tsx`, un `<nav aria-label="Secciones">` con enlaces de ancla, que se renderiza en los 4 modos debajo del filtro cuando hay datos cargados.
    *   **Solo el índice queda fijo arriba** (`sticky top-0`, una fila de ~40 px con scroll horizontal si no entra), no el formulario completo, para no ocupar media pantalla en móviles. Es un ajuste respecto del plan.
    *   El primer enlace, «Filtros», vuelve al filtro. Cada sección destino tiene `id` y `scroll-mt-16`, así el índice no la tapa. Desplazamiento suave (`scroll-behavior: smooth`). Oculto al imprimir.
    *   Enlaces por modo:
        *   Campaña completa / Por semana: Filtros · Indicadores · Diagnóstico · Recomendaciones · Rankings · Alertas · Tendencia diaria · Por hora.
        *   Comparar 2 días: Filtros · Indicadores · Diagnóstico · Recomendaciones · Horas y gateways.
        *   Comparar campañas: Filtros · Indicadores · Diagnóstico · Recomendaciones · Rankings · Alertas · Horas y gateways · Bases · Tendencia diaria.

*   **RF6 [Event-driven — «Mín. llamadas» en rango y semana]:** Nuevo `components/Filters/MinCallsSelect.tsx` (opciones 50 / 100 / 200), compartido por las 4 barras; reemplaza las 2 copias de `MIN_CALLS_OPTIONS`.
    *   `RangeValues` suma `minCalls`, que `FilterRangeBar` y `FilterWeekBar` emiten al enviar. El valor por defecto es `DEFAULT_MIN_CALLS` (50).
    *   `RangeMode` usa `range.minCalls` en diagnóstico, recomendaciones y rankings; «Analizar» con valores sin cambios sigue recargando.
    *   La línea de contexto del modo suma «· min_calls N», como en los otros modos.
    *   Los nombres de los CSV no cambian.

*   **RF7 [Unwanted behavior — aislamiento]:** Cero cambios de backend (`pytest` = **167**). El contenido de los CSV no cambia. No cambian textos visibles, salvo que se quita el título duplicado «Observaciones y recomendaciones» y se agregan el badge de severidad, el índice y «min_calls N». Sin librerías nuevas.

*   **RF8 [Testing]:**
    *   **Nuevos:**
        *   `lib/__tests__/format.test.ts` (4): los 4 formateadores con valores reales y `null`.
        *   `common/__tests__/SectionNav.test.tsx` (1): enlaces, `href` y `aria-label`.
        *   `DiagnosticsFeed.test` (+1): columnas como `heading` nivel 3.
        *   `RecommendationsPanel.test` (+1): tarjeta clara (sin `bg-slate-900`) con badge de severidad y sin título duplicado.
        *   `FilterRangeBar.test` (+1): emite el `minCalls` elegido.
        *   `ExportButtons.test` (+2): cada enlace del índice del modo rango apunta a un `id` existente; elegir 100 y «Analizar» muestra «min_calls 100».
        *   `ModeTabs.test` (+1): los enlaces del índice del modo campañas apuntan a `id` existentes.
    *   **Existentes que se ajustan:**
        *   Aserciones de «Observaciones y recomendaciones» (el título se elimina a propósito).
        *   Objetos emitidos y defaults que ahora incluyen `minCalls` (`FilterRangeBar`, `FilterWeekBar`, `catalog.test`).
        *   Rutas de import de los helpers movidos (`OverviewKpis`, `GatewaysTable` y los tests de gráficos).
    *   Total vitest **216 + 11 = 227**.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 010 | Header «Observaciones y recomendaciones» y estética oscura (`bg-slate-900`) de las tarjetas | Un solo título por sección; tarjetas claras coherentes con el resto |
| 014 | Mantener `bg-slate-900` en el panel | Ídem |
| 019 | Badge AMD «sobre tarjeta oscura» | Badge ámbar claro sobre tarjeta blanca |
| 017 | RF1 «sin selector de `min_calls` en `FilterRangeBar` — decisión cerrada» | Selector «Mín. llamadas» en rango y semana |

## Datos de entrada

*   Lint actual: 7 warnings `only-export-components` (`OverviewKpis:4`, `DailyTrendChart:21`, `HourlyTrendChart:22`, `GatewaysTable:8,23,28`, `DailyCompareChart:22`).
*   Formateadores duplicados listados en RF3; implementaciones verificadas como idénticas antes de unificar.

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Rediseño de gráficos o de la paleta; modo oscuro.
*   Unificar `healthTone` (duplicado en `CrossRankingTable`/`SegmentRankingTable`) y los formateadores internos de los tooltips.
*   KPIs con delta vs período anterior (spec siguiente del plan).
*   Backend, `/data`, dependencias.

## Criterios de Finalización

*   Docs `spec/039-spec-visual-hierarchy/{spec,plan,task}.md`; `task.md` en `[x]`.
*   `npm test` = **227**; `tsc -b`, `build` en verde; **lint 0 warnings / 0 errores**; `pytest -q` = **167**; `/data` intacto; sin dependencias nuevas.
*   Revisión visual en Chrome:
    *   Recomendaciones con tarjetas claras, badge y un solo título.
    *   Índice fijo que salta a cada sección sin taparla.
    *   «Mín. llamadas» 100 en la campaña 91 cambia los rankings: el volumen mínimo aplicado es 100.
    *   Los 4 modos sin errores de consola.
*   Commit de cierre en español.
