# Spec 034: «Rankings del rango» apilado a lo ancho

## Usuario

Analista / supervisor del call center (usuario interno). En el modo **Campaña completa** la sección «Rankings del rango» sigue en `grid lg:grid-cols-3`: las 3 tarjetas (Bases / Dispositivos / Horas) ocupan un tercio del ancho y las tablas de 4-5 columnas (`table-fixed` con anchos %) quedan estranguladas. «Rankings comparados» ya se apiló a lo ancho en Spec 031 RF3; el modo rango quedó desalineado.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — grid apilado]:** en `App.tsx`, la sección `aria-label="Rankings del rango"` pasa de `grid items-start gap-8 lg:grid-cols-3` a **`grid items-start gap-8`** (1 columna a lo ancho, igual que «Rankings comparados»). El contenedor de los 3 botones CSV de la sección suma **`flex-wrap`** (ya lo tienen Alertas de patrones y Rankings comparados).
*   **RF2 [UI — scroll horizontal en las tablas]:** al estar a lo ancho, las tablas ganan ancho mínimo y scroll de cortesía:
    *   `BasesRankingTable`: wrapper `overflow-hidden` → **`overflow-x-auto`**; tabla `w-full table-fixed` → **`w-full min-w-[480px] table-fixed`** (4 columnas).
    *   `SegmentRankingTable`: wrapper `overflow-hidden` → **`overflow-x-auto`**; tabla → **`min-w-[560px]`** (5 columnas).
*   **RF3 [Unwanted behavior — aislamiento]:** columnas, datos, orden, `data-testid`, estados vacíos/loading/error, subtítulos por tarjeta, `gap-8`/`p-5`, exportadores, hooks, CompareMode, CampaignsCompareMode y backend **íntegros**; **cero** endpoints nuevos (`pytest` = **164**) y sin librerías nuevas.
*   **RF4 [Testing]:**
    *   `BasesRankingTable.test.tsx` / `SegmentRankingTable.test.tsx`: assert de wrapper `overflow-x-auto` y `min-w-` en la tabla.
    *   `ModeTabs.test.tsx`: dentro de `aria-label="Rankings del rango"` el grid **no** tiene `lg:grid-cols-3`.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Fuera de Alcance

*   Cambios de datos, columnas o CSV.
*   Rediseño de contenido (barras/chips); solo se replica el patrón apilado ya aprobado.
*   Backend, `/data`, dependencias.

## Criterios de Finalización

*   Docs `spec/034-spec-range-rankings-stack/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke: campaña 35 (01→15/09) con las 3 tarjetas apiladas a lo ancho, tablas cómodas y scroll si la ventana es angosta, CSV con `flex-wrap`.
*   Sin regresiones: `pytest -q` = **164**; `npm test` + `tsc` + `lint` + `build` en verde; `/data` mtimes intactos; `package.json` sin dependencias nuevas.
