# Spec 025: Exportación CSV y reporte PDF (los 3 modos)

## Usuario

Analista / supervisor del call center (usuario interno). El dashboard (Specs 016/021/023/024) ya ofrece KPIs, diagnósticos, recomendaciones y tablas en 3 modos, pero **no se puede descargar nada**: los hallazgos hay que copiar a mano a Excel o capturar pantalla. Se necesita exportar **CSV** por sección y generar un **PDF** del reporte visible.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — serializador CSV (client-side)]:** `frontend/src/lib/csv.ts`
    *   `toCsv(headers: string[], rows: CsvCell[][]): string` → UTF-8 con **BOM** (`﻿`), separador **`;`**, fin de línea **CRLF**, escape RFC 4180 (celdas con `;`, `"` o salto de línea entre comillas dobles, `"` interno duplicado).
    *   `CsvCell = string | number | null | undefined`: `null`/`undefined` → celda vacía; números enteros sin decimales; flotantes con **coma decimal** (Excel-ES) redondeados a 6 decimales máximos.
    *   `downloadCsv(filename, headers, rows)` → `Blob` + `URL.createObjectURL` + `<a download>` + `revokeObjectURL`.
    *   *Por qué:* sin librerías nuevas (stack cerrado) y compatible con Excel en español.

*   **RF2 [State-driven — builders de sección]:** `frontend/src/lib/exporters.ts` con funciones **puras** `CsvTable { headers, rows }` que consumen los tipos existentes de `types/api.ts`:
    *   `kpiRangeRows(CampaignSummary)` · `kpiCompareRows(SummaryKpi)` (sirve para los 2 modos comparativos).
    *   `diagnosticRows(rootCauses, positiveDrivers)` · `recommendationRows(Recommendation[])`.
    *   `dailyRows` · `hourlyRows` (punto simple) · `dailyCompareRows(a, b)` · `hourlyCompareRows(a, b)` (merge por `fecha`/`hora`).
    *   `gatewaysRangeRows(DeviceRangeRow[])` · `gatewaysCompareRows(GatewayComparison[])` · `basesCompareRows(BaseComparison[])`.
    *   Tasas en **%** con 2 decimales (`5.94`); deltas en **pp** con 2 decimales; encabezados en **español**.

*   **RF3 [UI — botón CSV por sección, 3 modos]:** componente `ExportCsvButton` (`data-testid="export-csv"`), etiqueta «CSV», icono lucide `Download`, estilo secundario (borde indigo-300, texto indigo-700) para no competir con la acción primaria, clase `print:hidden`.
    *   **RangeMode** (6): Indicadores acumulados · Diagnóstico del rango · Recomendaciones del rango · Serie diaria (vía `headerAction` del gráfico) · Gateways del rango · Tendencia horaria (vía `headerAction`).
    *   **CompareMode** (5): Indicadores clave · Diagnóstico (pasa a sección con `h2` «Diagnóstico», consistente con los otros modos) · Recomendaciones (pasa a sección con `h2` «Recomendaciones») · Comparativa de gateways · Tendencia horaria A/B (vía `headerAction`).
    *   **CampaignsCompareMode** (7): Indicadores clave · Diagnóstico · Recomendaciones · Comparativa de gateways · Comparativa de bases · Tendencia horaria A/B · Serie diaria comparada (los 2 últimos vía `headerAction`).
    *   Los gráficos `DailyTrendChart`, `HourlyAggregateChart`, `HourlyTrendChart`, `DailyCompareChart` y `RecommendationsPanel` ganan prop opcional **`headerAction?: ReactNode`** renderizado junto a su `h2` existente (sin cambiar textos ni defaults).
    *   Naming: `rango_{campaña}_{desde}_{hasta}_{sección}.csv`, `comparar_{campaña}_{fechaA}_{fechaB}_{sección}.csv`, `campanas_{A}_vs_{B}_{sección}.csv`; secciones en `kpis|diagnosticos|recomendaciones|daily|hourly|gateways|bases`.
    *   Los botones viven **solo dentro del success block** (nada que exportar sin datos).

*   **RF4 [State-driven — reporte PDF vía impresión]:** componente `PrintButton` (`data-testid="print-report"`), etiqueta «Imprimir / PDF», icono `Printer`, invoca `window.print()`; uno por modo dentro del success block.
    *   CSS `@media print` en `index.css`: ocultar `header`, tabs de modo, filtros y botones (clases `print:hidden` en esos elementos); `print-color-adjust: exact` para conservar colores de badges/cards.
    *   *Por qué:* PDF nativo del navegador → cero dependencias nuevas (stack cerrado); el usuario elige «Guardar como PDF» en el diálogo.

*   **RF5 [Unwanted behavior — aislamiento]:**
    *   Sin cambios de backend: **cero** endpoints nuevos, contratos de Specs 001-024 intactos, engines intocados.
    *   Sin librerías nuevas en `package.json` / venv.
    *   Botones y chrome de navegación **no aparecen** en la impresión.

*   **RF6 [Testing]:**
    *   `vitest`: `csv.test.ts` (BOM, `;`, CRLF, escape, coma decimal, null, `downloadCsv` con `URL.createObjectURL` spypeado) · `exporters.test.ts` (encabezados, % 2 decimales, pp, merge diario/horario, nulos) · `ExportCsvButton.test.tsx` / `PrintButton.test.tsx` (click dispara `downloadCsv` / `window.print`) · `ModeTabs.test.tsx` asienta botones CSV + imprimir en el tab campañas.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build`; `pytest -q` sin tocar backend debe seguir en **156**.

## Specs superadas por esta revisión

Ninguna. Spec **aditiva de frontend**. Solo ajuste cosmético documentado: `CompareMode` pasa a envolver `DiagnosticsFeed`/`RecommendationsPanel` en secciones con `h2` propios (consistencia con Range/Campaigns; los `h2` internos de los paneles ya existían duplicados en RangeMode desde la Spec 016).

## Datos de entrada

*   Tipos de `frontend/src/types/api.ts`: `CampaignSummary`, `SummaryKpi`, `DiagnosticEvent`, `Recommendation`, `DailyTrendPoint`, `HourlyTrendPoint`, `DeviceRangeRow`, `GatewayComparison`, `BaseComparison` — todos ya poblados en memoria en `App.tsx` vía hooks (Spec 024 RF5).
*   Helpers reutilizables existentes: `formatRatePct` (`OverviewKpis`), estilos de botón de los filtros como referencia visual.
*   Sin datos nuevos de `/data`; sin llamadas nuevas al backend.

## Contrato JSON

**Sin endpoints nuevos.** No hay cambios de contrato: `pytest` debe pasar intacto con los 156 tests actuales.

## Fuera de Alcance

*   Backend, routers, engines, esquema DB, `/data`.
*   Export XLSX/PDF server-side, librerías nuevas (pandas-to-csv, jsPDF, etc.).
*   Email/envío de reportes, reportes programados, export de los modos A/B día-a-día con otros nombres de sección, personalización de columnas.

## Criterios de Finalización

*   Docs `spec/025-spec-export/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke manual: en cada modo, cada botón CSV descarga un archivo con las secciones correctas (abrir OK en Excel/LibreOffice); «Imprimir / PDF» abre diálogo sin filtros/tabs/botones impresos.
*   `pytest -q` en **156** (backend sin tocar); `npm test` + `tsc` + `lint` + `build` en verde.
*   `package.json` sin dependencias nuevas.
*   `/data` mtimes intactos.
