# Spec 055: Control de cobertura de datos

## Usuario

Analista / supervisor del call center. Cuando las campañas no tienen cargados los mismos días, el dashboard no lo dice. Pasó en septiembre: la 35 estaba cargada hasta el 30/09 y la 38, la 91 y la 92 hasta el 15/09. Se descubrió al comparar campañas, porque los totales no cerraban. Tampoco se ve si a una campaña le falta un día en el medio.

Hoy las 4 campañas tienen los 22 días hábiles del 01 al 30/09, pero cada carga nueva puede volver a desalinearlas. Es el ítem 8 de la segunda ronda.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — cálculo]:** `frontend/src/lib/coverage.ts`, función pura `buildCoverage(catalog)`. Usa los datos que ya trae el catálogo (`/api/campaigns`: `dates` por campaña); no cambia el backend.
    *   **Período de referencia:** del primer día con datos de cualquier campaña al último (`lastDay`).
    *   **Faltantes de cada campaña:** los días hábiles (lunes a viernes) entre su primer día y `lastDay` que no están en sus `dates`.
    *   **Atrasada:** una campaña está atrasada si su último día es anterior a `lastDay`.
    *   **Al día:** cuando ninguna campaña está atrasada ni tiene faltantes.
    *   Devuelve `{ firstDay, lastDay, complete, campaigns: [{ campaign, segment, firstDay, lastDay, days, missing, behind }] }`, con las campañas en el orden del catálogo.
    *   No conoce los feriados: un día hábil sin datos puede ser feriado, y la interfaz lo aclara.
*   **RF2 [UI — aviso general]:** `CoverageNotice`, debajo de las pestañas de modo y visible en todos los modos.
    *   **Al día:** una línea discreta: «Datos al día: 4 campañas del 01/09 al 30/09 (22 días hábiles).»
    *   **Con problemas:** aviso en ámbar con ícono, por ejemplo: «Cobertura incompleta: 38 llega hasta el 15/09 · 92: falta el 08/09.». Hasta 3 fechas por campaña; si hay más, «y N más».
    *   **«Ver detalle»** (`aria-expanded`) abre una tabla: Campaña · Segmento · Desde · Hasta · Días · Faltan. La tabla aclara que un día hábil sin datos puede ser feriado.
    *   No se imprime.
*   **RF3 [UI — rango con huecos]:** en Campaña completa y Por semana, si el rango elegido incluye días hábiles sin datos de esa campaña, la línea de contexto suma el badge «Faltan N días: 08/09, …» (ámbar). En semanas se suma al badge «Parcial» de la Spec 039.
*   **RF4 [UI — comparar campañas]:** en Comparar campañas, si dentro del rango una campaña tiene días hábiles sin datos que la otra sí tiene, aparece un aviso: «La campaña 38 no tiene datos de 11 días hábiles del rango (16/09 → 30/09); sus totales cubren menos días que los de la 35.»
*   **RF5 [Unwanted behavior — aislamiento]:**
    *   Sin cambios de backend, endpoints, cálculos ni `/data`.
    *   Sin librerías nuevas; la cobertura de tests no baja.
*   **RF6 [Testing]:**
    *   vitest de `buildCoverage`: al día; atrasada; hueco en el medio; fines de semana ignorados; catálogo vacío.
    *   vitest de `rangeMissingDays` (días hábiles sin datos de un rango) y del texto del aviso.
    *   vitest de `CoverageNotice` (línea al día; aviso con detalle), del badge en `RangeMode` y del aviso en Comparar campañas.

## Specs superadas por esta revisión

Ninguna. Aditiva. El badge «Parcial» de la Spec 039 se mantiene.

## Datos de entrada

`GET /api/campaigns` (catálogo), sin cambios. Hoy: 35, 38, 91 y 92 con los 22 días hábiles del 01 al 30/09, así que el aviso debe decir «Datos al día».

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Calendario de feriados.
*   Avisos por horas faltantes dentro de un día.
*   Avisar al cargar la ingesta.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/055-spec-data-coverage/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Con el catálogo real: «Datos al día: 4 campañas del 01/09 al 30/09 (22 días hábiles).»
*   Tests con el caso histórico (38 hasta el 15/09) y con un hueco en el medio.
*   `run_checks.py` en verde con cobertura; CI en verde; squash merge.
