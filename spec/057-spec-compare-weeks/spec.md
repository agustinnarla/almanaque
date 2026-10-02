# Spec 057: Comparar semanas

## Usuario

Agustin, analista. Hoy se puede ver una semana («Por semana»), comparar dos días o comparar dos campañas en el mismo rango, pero no comparar **una semana contra otra** de la misma campaña. Por ejemplo, para saber si la semana 39 rindió mejor que la 38 y por qué. Decisión del usuario (2026-10-02): una pestaña nueva, «Comparar semanas».

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — backend con dos rangos]:** `GET /api/campaigns/compare-campaigns`, `/diagnostics` y `/recommendations` aceptan `start_date_b` y `end_date_b`, opcionales.
    *   Sin ellos, el lado B usa el mismo rango que el A, como hasta ahora.
    *   Con ellos, el lado A se calcula con `campaign_a` en `[start_date, end_date]` y el lado B con `campaign_b` en `[start_date_b, end_date_b]`. Esto vale para los totales, las bases, los gateways, las series por hora y por día, los dispositivos y las recomendaciones.
    *   La respuesta suma `start_date_b` y `end_date_b`. Los campos actuales no cambian.
    *   *Por qué:* comparar semanas es la misma comparación A contra B con un rango distinto de cada lado. Se reusan las causas, la mezcla de bases, la congestión y las recomendaciones, sin duplicar lógica.
*   **RF2 [UI — pestaña]:** «Comparar semanas» se suma después de «Por semana».
    *   El filtro tiene campaña, Semana A, Semana B y mínimo de llamadas. Las opciones salen de las semanas de la campaña elegida (`buildWeekOptions`); las parciales se marcan «· parcial».
    *   Por defecto, la Semana B es la última completa y la A, la completa anterior (`defaultWeekPair`).
    *   «Comparar» queda deshabilitado si A y B son la misma semana.
*   **RF3 [UI — contenido]:** `WeeksCompareMode`, con las secciones Resumen · Indicadores · Diagnóstico · Recomendaciones · Por hora y gateways · Bases · Serie por día. Cada sección reusa un componente que ya existe:
    *   **Resumen:** `compareSummaryItems`, con las etiquetas de las semanas: «AA 6,9% → 7,4% (+0,5 pp) entre Semana 38 y Semana 39».
    *   **Indicadores:** `KpiGrid` con «Semana A / Semana B».
    *   **Diagnóstico:** causas negativas y positivas de A contra B (`DiagnosticsFeed`).
    *   **Recomendaciones:** las de la Semana B.
    *   **Por hora:** `HourlyTrendChart` con «Semana 38» y «Semana 39».
    *   **Gateways y bases:** `GatewaysTable` y `BasesCompareTable`.
    *   **Serie por día:** `WeekdayCompareChart` alinea por día de la semana (Lun…Vie), con las fechas de cada semana en la tabla y en el tooltip.
    *   Cada sección tiene su CSV, con el prefijo `semanas_{c}_{inicioA}_vs_{inicioB}_`.
*   **RF4 [UI — semanas desparejas]:** si alguna de las dos semanas es parcial, o tienen distinta cantidad de días con datos, aparece un aviso: «La Semana 40 tiene 3 días con datos y la Semana 39, 5: los totales no son comparables; las tasas sí.»
*   **RF5 [Unwanted behavior — aislamiento]:**
    *   «Comparar campañas» y el resto de los modos no cambian: sin los parámetros nuevos, la API responde igual.
    *   Sin cambios en `/data` ni en el esquema; sin librerías nuevas.
    *   La cobertura no baja.
*   **RF6 [Testing]:**
    *   pytest: la misma campaña con dos semanas da totales distintos a cada lado; sin `*_b`, la respuesta es igual a la de antes; diagnóstico y recomendaciones usan el rango B.
    *   vitest:
        *   `defaultWeekPair`;
        *   la alineación por día de la semana y su tabla;
        *   los parámetros de la API;
        *   la pestaña nueva y sus valores por defecto;
        *   el botón deshabilitado con la misma semana;
        *   el aviso de semanas desparejas;
        *   el contenido con datos mockeados.

## Specs superadas por esta revisión

Ninguna. Aditiva: los parámetros nuevos son opcionales.

## Datos de entrada

`daily_campaign_metrics`, sin cambios. Semanas de septiembre: S36 (4 días, parcial), S37 a S39 (5 días cada una) y S40 (3 días, parcial). Por defecto: S38 contra S39.

## Contrato JSON

Respuesta de `compare-campaigns` (y de `/diagnostics` y `/recommendations`) con `start_date_b` y `end_date_b` además de los campos actuales.

## Fuera de Alcance

*   Rankings y alertas de patrones comparados por semana (cada semana ya los tiene en «Por semana»).
*   Comparar semanas de **distintas** campañas.
*   Comparar más de dos semanas.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/057-spec-compare-weeks/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke con la API real: campaña 35, S38 contra S39, con totales y AA de cada semana iguales a los de `/summary` de cada rango.
*   `run_checks.py` en verde con cobertura; CI en verde; squash merge.
