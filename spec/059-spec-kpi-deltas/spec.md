# Spec 059: Indicadores con variación vs el período anterior

## Usuario

Analista / supervisor del call center. Los indicadores de Campaña completa y Por semana muestran el valor del período, pero no si mejoró o empeoró. Para saber si 10,08% de AA es bueno hoy hay que cambiar de pestaña o hacer la cuenta a mano. Tampoco se ve la forma de la serie diaria sin bajar hasta el gráfico. Es el ítem 6 de la segunda ronda de mejoras.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — período anterior]:** `frontend/src/lib/previousPeriod.ts`, `previousRange(from, to)`: el tramo del **mismo largo en días** que termina el día anterior a `from`.
    *   **Por semana:** la semana anterior (lunes a domingo).
    *   **Campaña completa:** por ejemplo, 15/09 → 30/09 da 30/08 → 14/09.
*   **RF2 [Ubiquitous — variaciones]:** `kpiDeltas(summary, previous)` compara contra el resumen del período anterior:
    *   **AA y AA sobre atendibles:** en puntos porcentuales (pp).
    *   **Total de llamadas:** % de cambio.
    *   **Contestadores y no contesta:** variación de su participación en pp.
    *   **Sin datos:** si el período anterior no tiene llamadas, no hay variaciones (`null`).
*   **RF3 [Ubiquitous — datos]:** el hook `usePreviousSummary(campaign, from, to)` pide `/summary` del período anterior. Sin cambios de backend.
*   **RF4 [UI — tarjetas]:** cada tarjeta de `OverviewKpis` muestra su variación con flecha y signo, y el texto «vs semana anterior» o «vs período anterior». El rango anterior aparece en el `title`.
    *   **Color según el significado:**
        *   AA y AA sobre atendibles: verde si suben, rojo si bajan.
        *   Contestadores y no contesta: verde si bajan.
        *   Total de llamadas: neutro (`StatCard` acepta `neutral`), porque más o menos volumen no es bueno ni malo en sí.
    *   **Sin datos del período anterior:** una nota «Sin datos del período anterior (01/08 → 31/08)», en lugar de variaciones.
*   **RF5 [UI — mini línea]:** la tarjeta principal (AA) suma una mini línea del AA diario del rango, `Sparkline` en SVG y sin Recharts, siguiendo las reglas de `dataviz`:
    *   la línea en el gris de baja prioridad y el último día destacado con el color de la serie;
    *   `aria-label` con el primer y el último valor.
    *   Con menos de 2 días no se muestra.
*   **RF6 [Ubiquitous — metodología]:** el modal «¿Cómo se calcula?» explica el período anterior en la pestaña «Métricas».
*   **RF7 [Unwanted behavior — aislamiento]:** sin cambios en el backend, en otros modos, en los CSV ni en `/data`; sin librerías nuevas; la cobertura no baja.
*   **RF8 [Testing]:**
    *   vitest de `previousRange` (semana; rango; cambio de mes) y de `kpiDeltas` (pp, %, sin datos);
    *   `Sparkline` (puntos, último destacado, `null` y vacío);
    *   `StatCard` neutral;
    *   `OverviewKpis` con y sin período anterior;
    *   `usePreviousSummary`;
    *   la regla en el modal.

## Specs superadas por esta revisión

Ninguna. Aditiva: las tarjetas de Comparar 2 días y Comparar campañas ya tenían deltas y no cambian.

## Datos de entrada

`/api/campaigns/{c}/summary` del rango y del período anterior; serie diaria ya cargada. Campaña 35, Por semana S39 (21–27/09) contra S38: AA 6,85% → 10,08% (**+3,23 pp**); llamadas 13.517 → 9.451 (−30,1%).

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Elegir con qué período comparar (por ejemplo, el mismo mes del año anterior).
*   Deltas en Comparar 2 días y Comparar campañas (ya los tienen).
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/059-spec-kpi-deltas/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke con la API real: 35, S39 contra S38: +3,23 pp de AA y −30,1% de llamadas.
*   `run_checks.py` en verde con cobertura; CI en verde (3/3 en el último commit); squash merge.
