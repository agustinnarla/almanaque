# Spec 042: Gráficos sin doble eje, paleta validada y diseño responsive

## Usuario

Analista / supervisor del call center (usuario interno). Es la segunda parte del pedido de diseño (2026-10-01):

1.  **Los 4 gráficos de tendencia usan doble eje Y**: barras de llamadas a la izquierda y línea de AA % a la derecha, en `DailyTrendChart`, `HourlyAggregateChart`, `HourlyTrendChart` y `DailyCompareChart`. Dos escalas en un mismo plano invitan a leer cruces que no significan nada: es el error n.º 1 que marca la guía de visualización.
2.  **Colores sin sistema.** Cada gráfico define los suyos (`#6366f1`, `#059669`, grises). En las comparaciones, la serie A va en gris «atenuado» aunque las dos campañas tienen el mismo peso.
3.  **Tablas y filtros no responsive.**
    *   5 tablas (`BasesCompareTable`, `GatewaysTable`, `GatewaysRangeTable` y las de `PatternsPanel`/`PatternsComparePanel`) no tienen scroll horizontal y se aprietan en pantallas angostas.
    *   Las barras de filtros de 5–7 campos no hacen wrap.
    *   Las 4 pestañas de modo desbordan en celular.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — un eje por gráfico]:** Nuevo `components/charts/RateVolumeChart.tsx`, compartido por los 4 gráficos. Dibuja **dos paneles apilados que comparten el eje X**:
    *   **Arriba:** Agent Answer % (líneas, eje «AA %»).
    *   **Abajo:** llamadas (barras, eje «Llamadas»).
    *   Cada panel tiene **un solo eje Y**. Los paneles se sincronizan con `syncId`: al pasar el mouse por un día u hora, los dos muestran su tooltip.
    *   Los 4 componentes conservan sus props, títulos, `data-testid`, estados vacíos y helpers de datos (`lib/chartData.ts`).
*   **RF2 [Ubiquitous — paleta]:** Nuevo `lib/chartPalette.ts`, con la paleta categórica de referencia validada con `validate_palette.js` sobre la tarjeta blanca (`#ffffff`).
    *   **Serie A / única** = azul `#2a78d6`, **serie B** = naranja `#eb6834`. Pasa los 5 controles: CVD ΔE 24.7, visión normal ΔE 33.6, contraste ≥ 3:1.
    *   El color sigue a la entidad: la campaña o el día A es azul en las líneas y en las barras.
    *   Tinta de ejes `#898781`, grilla horizontal discreta `#e1e0d9`, línea base `#c3c2b7`.
*   **RF3 [Ubiquitous — marcas]:**
    *   Líneas de 2 px con puntos de 8 px (`r=4`).
    *   Barras con extremo redondeado de 4 px y 2 px de separación entre barras agrupadas.
    *   **Leyenda solo con 2 series** (con una, el título ya nombra la serie).
    *   Tooltip con la etiqueta del eje («Hora 9», «01/09») y los valores formateados: `5.94%` para la tasa, `35.413` para las llamadas.
    *   Los subtítulos dejan de decir «barras/línea» y «atenuado/sólido»: pasan a «Tasa de contacto % (arriba) y llamadas (abajo)…».
*   **RF4 [UI — responsive]:**
    *   Las secciones «gráfico + tabla de gateways», que iban en dos columnas `lg:grid-cols-12` (7/5) en los 3 modos, pasan a **apiladas a lo ancho**, como los rankings en la Spec 034. Con el ancho mínimo, la tabla scrolleaba incluso en escritorio, y el gráfico de dos paneles se lee mejor a lo ancho.
    *   Las 5 tablas sin scroll suman un contenedor `overflow-x-auto` y un `min-w-[…]` en la tabla.
    *   Las 4 barras de filtros pasan a `md:flex-wrap`, con un ancho mínimo por campo (`min-w-[9rem]` en los campos que crecen).
    *   Las pestañas de modo usan `flex-wrap`, así no desbordan en 360 px.
*   **RF5 [Unwanted behavior — aislamiento]:** Sin cambios de backend (pytest **172**), de datos, de los CSV ni de los textos fuera de los subtítulos de los gráficos. Sin librerías nuevas: se sigue usando Recharts.
*   **RF6 [Testing]:**
    *   Los mocks de `recharts` en los 4 tests de gráficos suman `CartesianGrid`.
    *   La aserción «atenuado» del gráfico diario comparado se reemplaza por el subtítulo nuevo.
    *   Nuevo `RateVolumeChart.test.tsx`, con 2 tests:
        *   Siempre 2 paneles, cada uno con un solo eje Y.
        *   La leyenda aparece solo con 2 series.
    *   Nuevo `chartPalette.test.ts` (1): los colores son los validados y la serie única usa el slot 1.
    *   Tests de tablas: el contenedor tiene `overflow-x-auto`.
    *   Regresión con `/cerrar-spec 042`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 009 | Gráfico combinado barras + línea con doble eje | Dos paneles con un eje cada uno |
| 016 / 023 | Estilo «A atenuado / B sólido» de las series comparadas | Paleta categórica: A azul, B naranja |

## Datos de entrada

*   Validación de la paleta (`validate_palette.js "#2a78d6,#eb6834" --mode light --surface "#ffffff"`): **ALL CHECKS PASS**.

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Modo oscuro (la app no lo tiene).
*   Mapa de calor hora × dispositivo (spec propia).
*   Cambiar la librería de gráficos.

## Criterios de Finalización

*   Docs `spec/042-spec-responsive-palette/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Ningún gráfico con `yAxisId="right"`, y ningún hex de color fuera de `lib/chartPalette.ts` en los gráficos (grep).
*   Chrome:
    *   Los 4 gráficos con 2 paneles alineados y colores de la paleta.
    *   Vista angosta (~400 px) sin desbordes de página, con tablas con scroll propio y pestañas en 2 filas.
    *   Consola sin errores.
*   `/cerrar-spec 042` en verde (pytest 172, vitest con los nuevos, lint 0/0).
*   Commit en español + push.
