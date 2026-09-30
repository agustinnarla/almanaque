# Spec 027: Pulido UI/UX de Rankings y Alertas de patrones

## Usuario

Analista / supervisor del call center (usuario interno), el mismo de la Spec 026. Las dos secciones nuevas funcionan y exportan, pero en la revisión de interfaz detectaron: encabezados que rompen el patrón del resto del dashboard, jerarquía de encabezados duplicada (`h3` bajo `h3`), la métrica clave (`health_score`) sin señal de color, tablas sin *hover* ni fila líder destacada, columna de fecha en ISO cruda, filas de alertas sin forma de escanear el pico de un vistazo, y 3 botones CSV dispersos dentro de las tarjetas. Este *spec* es **solo presentación**: mismos datos, mismos contratos, mismos 11 CSV.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — encabezados de sección]:** «Rankings del rango» y «Alertas de patrones» adoptan el patrón ya usado en `DiagnosticsFeed`/`RecommendationsPanel`/«Gateways del rango»: `h2` con icono `lucide` (`Trophy` y `AlertTriangle`) + párrafo `text-xs text-slate-500` **debajo**, en lugar del `flex justify-between` actual. El párrafo de Rankings informa una sola vez el umbral: «Mejores y peores segmentos por health score · volumen mínimo {min_calls_applied} llamadas · top {limit_applied}».
*   **RF2 [State-driven — layout de rankings]:** las 3 tablas pasan a `grid lg:grid-cols-3 items-start` con tarjetas de cabecera propia (`rounded-xl border bg-white shadow-sm` + `h3` con icono), eliminando el desbalance de alturas de `lg:col-span-4`. Los 3 `ExportCsvButton` (orden **Bases → Dispositivos → Horas**, con `label` opcional) se mueven a una única fila de acciones junto al encabezado de la sección → posiciones DOM `[3][4][5]` intactas.
*   **RF3 [State-driven — `BasesRankingTable`]:** columnas reordenadas a `# | Base | AA %`; fila líder destacada (`bg-emerald-50` + chip `#1`); `hover:bg-slate-50` en filas; `<caption>` accesible.
*   **RF4 [State-driven — `SegmentRankingTable`]:** bloques internos «Mejores»/«Peores» bajan de `h3` a `h4` (jerarquía `h2 > h3 > h4`); `health_score` coloreado con umbral absoluto — `≥ 0` emerald · `≥ −10` amber · `< −10` red — con `data-good`/`data-bad` para tests; fila #1 de «Mejores» destacada (`bg-emerald-50`); `hover` en filas; `<caption>` accesible; **se elimina el pie duplicado** «Volumen mínimo…» (pasa al encabezado de la sección, RF1).
*   **RF5 [State-driven — `PatternsPanel`]:**
    *   Resumen por día deja de ser tabla de 11 filas → **barras horizontales** (`div` con `width` proporcional al día máximo, color ámbar, sin librerías ni animaciones), `data-testid="pattern-day-row"` conservado.
    *   Fecha con `Intl.DateTimeFormat('es-AR', {day:'2-digit', month:'2-digit', year:'numeric'})` + `formatToParts` (día/mes solo) construida sobre `new Date(fecha + 'T00:00:00')` (sin desfase UTC); la ISO completa vive en `title`.
    *   Encabezado sin `({total})` crudo → chip ámbar con el total. La referencia al umbral «Combinaciones que cayeron bajo el umbral de Agent Answer (5%)» vive **una sola vez**, en el `p` del encabezado de la sección (RF1), no se duplica dentro del panel.
    *   Tabla de combinaciones: sin `AlertTriangle` por fila (ruido; el icono queda en el `h3` del bloque), fila #1 en `bg-amber-50`, nueva columna **Share %** = `alerts / total` con barra fina de fondo.
*   **RF6 [Unwanted behavior — aislamiento]:** cero cambios de backend, contratos, hooks, `lib/exporters.ts` o `lib/patterns.ts`; orden y cantidad de botones CSV intactos (11 en RangeMode); sin librerías nuevas; `pytest` en **156**; CompareMode y CampaignsCompareMode sin cambios.
*   **RF7 [Testing]:** actualizar `BasesRankingTable.test.tsx` (orden de celdas), `SegmentRankingTable.test.tsx` (sin aserción de pie), `PatternsPanel.test.tsx` (fecha local `01/09` vía `title` ISO, encabezado sin `(4)`, barras, share); nuevo caso de `label` en `ExportCsvButton.test.tsx`; `ModeTabs`/`ExportButtons` sin cambios de orden. Regresión completa: `vitest` + `tsc -b` + `lint` + `build` + `pytest -q`.

## Specs superadas por esta revisión

Supersede **parcialmente la UI** de la Spec 026 (RF1/RF2/RF4 de 026: layout, encabezados y pie de `SegmentRankingTable`). Los datos, contratos, builders CSV y hooks de la 026 quedan intactos; ningún requisito funcional de negocio se retira.

## Datos de entrada

*   Misma data viva que la 026: 3 bases (34: 44.95%, 76: 41.18%, 80: 5.70%); mejor IPLAN health 3.38 / peor GW37 −25.67; horas 16 (−3.72) mejor / 13 (−15.88) peor; 170 alertas de la campaña 35 en 11 días; top combo `80 × GW20` = 36.
*   `min_calls_applied` (50) y `limit_applied` (5) de `SegmentRankingResponse` — ahora visibles en el encabezado de la sección.
*   `AGENT_ANSWER_THRESHOLD` = 0.05 (backend, intocado) → referencia «5%» solo como texto de la UI.

## Contrato JSON

**Sin cambios.** `pytest` debe pasar intacto con los 156 tests actuales.

## Fuera de Alcance

*   Backend, routers, engines, esquema DB, `/data`, contratos y hooks.
*   Nuevas librerías (gráficas, icon sets, animación); `package.json` intacto.
*   `GET /api/metrics`, CompareMode, CampaignsCompareMode, paginación, cambios en los builders CSV o en `summarizePatterns`.
*   Páginas fuera de RangeMode; modo oscuro; i18n completo (solo fecha `Intl` en las tablas nuevas).

## Criterios de Finalización

*   Docs `spec/027-spec-ui-polish/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Encabezados con icono + párrafo debajo; jerarquía `h2 > h3 > h4` sin duplicados; `health_score` coloreado con `data-good`/`data-bad`; barras por día con fecha `01/09` (ISO en `title`); columna Share %; fila líder destacada en las 3 tablas; pie «Volumen mínimo…» visible **una sola vez** (header de sección).
*   11 botones CSV en RangeMode con el mismo orden de índices (`[3]` bases, `[6]`/`[7]` patterns) y `data-testid="export-csv"` intacto.
*   `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` en verde; `pytest -q` = **156**.
*   `package.json` sin dependencias nuevas; `/data` mtimes intactos.
