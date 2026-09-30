# Plan 25: Exportación CSV y reporte PDF

## 1. Docs
*   `spec/025-spec-export/{spec,plan,task}.md`.

## 2. Serializador CSV
*   `frontend/src/lib/csv.ts`: `CsvCell`, `toCsv` (BOM `﻿`, `;`, CRLF, escape RFC 4180, coma decimal flotantes), `downloadCsv` (Blob + createObjectURL + `<a download>` + revoke).

## 3. Builders de sección
*   `frontend/src/lib/exporters.ts`: `CsvTable`; `kpiRangeRows`, `kpiCompareRows`, `diagnosticRows`, `recommendationRows`, `dailyRows`, `hourlyRows`, `dailyCompareRows` (merge por fecha), `hourlyCompareRows` (merge por hora), `gatewaysRangeRows`, `gatewaysCompareRows`, `basesCompareRows`. Tasas % 2 decimales, deltas pp, encabezados ES.

## 4. Componentes
*   `components/common/ExportCsvButton.tsx`: props `filename/headers/rows`, icono `Download`, estilo secundario indigo, `data-testid="export-csv"`, `print:hidden`.
*   `components/common/PrintButton.tsx`: icono `Printer`, `window.print()`, `data-testid="print-report"`, `print:hidden`.
*   `headerAction?: ReactNode` opcional en `DailyTrendChart`, `HourlyAggregateChart`, `HourlyTrendChart`, `DailyCompareChart`, `RecommendationsPanel` (junto a su `h2`, sin tocar textos).

## 5. App.tsx — 3 modos
*   `print:hidden` en `<header>` y `ModeTabs`; `print:hidden` en las raíces de los 3 filtros.
*   Envolver `h2` existentes en fila flex con `ExportCsvButton` (KPIs, diagnóstico, recomendaciones, gateways, bases según RF3).
*   CompareMode: envolver feed/panel en secciones con `h2` «Diagnóstico»/«Recomendaciones» + botones.
*   `PrintButton` al inicio de cada success block.
*   Filenames según patrón RF3.

## 6. CSS print
*   `index.css`: bloque `@media print` con `print-color-adjust: exact` y ocultamiento de `header`/tabs como refuerzo.

## 7. Tests
*   `lib/__tests__/csv.test.ts`, `lib/__tests__/exporters.test.ts`, `components/common/__tests__/{ExportCsvButton,PrintButton}.test.tsx`.
*   `ModeTabs.test.tsx`: asentar botones CSV + print en tab campañas.
*   Regresión: `npm test`, `tsc -b`, `lint`, `build`, `pytest -q` (156).

## 8. Verificación
1.  Smoke manual de descarga CSV en los 3 modos + impresión.
2.  `pytest -q` 156 verdes.
3.  mtimes `/data` = snapshot.
4.  `task.md [x]`.

## Flujo
Docs → csv.ts → exporters.ts → componentes → headerAction en gráficos → App.tsx → CSS → tests → smoke → pytest → mtimes → task [x].

## Fuera de alcance
Backend, engines, librerías nuevas, XLSX/PDF server-side, envío de reportes.
