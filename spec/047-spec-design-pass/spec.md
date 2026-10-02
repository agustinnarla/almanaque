# Spec 047: Pasada de diseño (dataviz)

## Usuario

Analista / supervisor del call center. Revisé la interfaz contra las reglas de la skill `dataviz` y encontré varios incumplimientos:

*   El Agent Answer, que es la métrica principal, se ve como una tarjeta más entre cuatro iguales.
*   Al volver a analizar, toda la página se reemplaza por bloques grises de carga y salta.
*   Las tablas usan fuente monoespaciada para los números.
*   Los gráficos no tienen vista de tabla: los valores solo se leen con el mouse o descargando el CSV.
*   Las barras miden 28 px, cuando el máximo es 24. Los tooltips ponen el nombre antes que el valor.
*   La leyenda de Recharts pinta el texto con el color de la serie.
*   No hay modo oscuro.

Decisión del usuario: los tipos de diagnóstico (`BASE_DEGRADATION`, etc.) **quedan en inglés**. Revisión sin Chrome: la valida el usuario.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — cifra principal]:** `StatCard` acepta `hero`.
    *   Con `hero`, el valor se muestra en `text-5xl font-semibold`, con cifras proporcionales.
    *   Los títulos de todas las tarjetas pasan a mayúscula inicial (sin `uppercase tracking-wide`).
    *   En `OverviewKpis` y `KpiGrid`, «Tasa de contacto» es la primera tarjeta y la única `hero` de la vista.
*   **RF2 [State-driven — recarga sin parpadeo]:** `useApiResource` expone `refreshing`: carga en curso **y** datos previos disponibles.
    *   Mientras `refreshing`, los modos muestran los datos anteriores atenuados (`opacity-50`, `aria-busy`) en vez del esqueleto.
    *   El esqueleto queda solo para la primera carga.
    *   Los hooks que envuelven `useApiResource` propagan `refreshing`.
*   **RF3 [Ubiquitous — números]:** todas las celdas numéricas usan la fuente del sistema con `tabular-nums`, sin `font-mono`.
*   **RF4 [Ubiquitous — vista de tabla]:** `ChartCard` (título, subtítulo, acción, tabla) envuelve los 5 gráficos: serie diaria, horaria del rango, diaria comparada, horaria comparada y volumen por troncal.
    *   Un botón «Ver tabla» / «Ver gráfico» (`aria-pressed`) alterna entre el gráfico y una `DataTable`.
    *   La tabla reusa las filas de los exportadores CSV (`CsvTable`).
    *   Para troncales, la tabla es la vista pivote: día × troncal + Total.
*   **RF5 [Ubiquitous — marcas]:**
    *   Barras de 24 px como máximo.
    *   Los puntos de las líneas llevan un anillo de 2 px del color de la superficie.
    *   Tooltip: valor primero, en negrita; el nombre de la serie después; clave de línea en vez de punto.
    *   Leyenda: texto con tinta neutra, no con el color de la serie.
    *   Separación de las barras apiladas del color de la superficie.
*   **RF6 [State-driven — modo oscuro]:**
    *   Con `prefers-color-scheme: dark`, o con el tema elegido «Oscuro», la app usa una paleta oscura.
    *   La paleta oscura invierte las escalas de Tailwind en uso (slate, red, amber, indigo, emerald, sky, rose, violet; 50↔950 … 400↔600) y lleva `white` a la superficie oscura (slate-900). Solo aplica en pantalla; la impresión sigue en claro.
    *   Los gráficos usan los pasos oscuros validados de la paleta: `#3987e5`, `#d95926`, `#199e70`, `#c98500`, `#d55181`. Validados sobre `#0f172a`: CVD ΔE 8.4, visión normal 19.3, contraste ≥ 3:1. El gris de «Otras» y la tinta de los ejes también tienen su versión oscura.
    *   Un selector «Sistema / Claro / Oscuro» en el encabezado guarda la preferencia en `localStorage` (con try/catch) y la aplica como `data-theme` en `<html>`.
*   **RF7 [Unwanted behavior — aislamiento]:**
    *   Sin cambios de backend, endpoints, CSV ni `/data`.
    *   `pytest` = **182**.
    *   Sin librerías nuevas: los íconos de lucide y Recharts ya están.
*   **RF8 [Testing]:**
    *   vitest de `StatCard` hero, `ChartCard` (alternar tabla/gráfico), `DataTable`, la pivote de troncales, `useApiResource.refreshing`, el tema (preferencia, `data-theme`, almacenamiento que falla) y la paleta clara/oscura.
    *   Ajuste de los tests existentes al nuevo orden de las tarjetas.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 042 | Colores fijos de los gráficos | Pasan a depender del tema (claro/oscuro) |
| Orden de KPIs (Overview/Compare) | «Total de llamadas» primero | La tasa de contacto pasa a ser la cifra principal |

## Datos de entrada

Sin cambios: los mismos endpoints.

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Traducir los tipos de diagnóstico (decisión del usuario).
*   KPIs con delta vs el período anterior (ítem 6 del plan).
*   Textura para impresión o modo de alto contraste.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/047-spec-design-pass/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Palette: `validate_palette.js` en verde para los slots claros (`#ffffff`) y oscuros (`#0f172a`).
*   `pytest -q` = **182**; `npm test` + `tsc` + `lint` + `build` en verde; `/data` intacto; `package.json` sin dependencias nuevas.
*   Revisión visual pendiente del usuario: modo claro, modo oscuro, «Ver tabla», recarga sin parpadeo.
