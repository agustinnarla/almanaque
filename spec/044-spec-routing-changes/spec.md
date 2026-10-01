# Spec 044: Detector de cambios de ruteo

## Usuario

Analista / supervisor del call center. En la campaña 35 el reparto entre troncales cambió y el dashboard no lo dice:

*   Hasta el 08/09 el volumen se repartía en 3–4 troncales (GW20, GW37, GW39, IPLAN2).
*   **Desde el 09/09 sale ~100% por IPLAN**, donde ~50% de las llamadas las atiende un contestador.
*   El AA subió de ~6% a 9–14% en ese período: no se puede saber si es mejor gestión o solo otra troncal.

Es el ítem 1 de la segunda ronda de mejoras. Decisión sobre la pregunta abierta: se muestra como **contexto** (severidad INFO, redacción neutral), no como alerta.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — concentración diaria]:** `services/routing_detector.py`, función pura `detect_routing(day_rows)`:
    *   Por día: `top_device`, `top_share` (share de la troncal con más llamadas) y `active_trunks` (troncales con share ≥ 10%).
    *   Un día es «concentrado» si `top_share ≥ ROUTING_CONCENTRATION_SHARE` (**0.8**); se ignoran los días con menos de `ROUTING_MIN_DAY_CALLS` (**50**) llamadas.
    *   Un día aislado cuyo estado difiere del de sus dos vecinos toma el de ellos (evita falsos cambios por un día raro).
*   **RF2 [State-driven — cambios]:** cada transición entre tramos distintos emite `{type: "ROUTING_CHANGE", severity: "INFO", date, entity, message}` en español, con la troncal dominante, su share, cuántas troncales activas había antes, y, si la dominante tiene ≥ 40% de contestadores, ese dato.
*   **RF3 [Ubiquitous — endpoint]:** `GET /api/campaigns/{c}/routing?start_date&end_date` → `{days: [{fecha, total_calls, top_device, top_share, active_trunks, concentrated}], changes: [...]}`. Rango vacío → listas vacías, HTTP 200.
*   **RF4 [UI — resumen]:** en Campaña completa y Por semana, el Resumen suma una línea «Cambio detectado» (ícono `Route`) con el cambio más reciente del rango, vía `useRoutingChanges`. Sin cambios, no se muestra.
*   **RF5 [Unwanted behavior — aislamiento]:** sin cambios en otros endpoints, esquema ni `/data`; sin librerías nuevas.
*   **RF6 [Testing]:** pytest del detector (cambio simple, día aislado, días de bajo volumen, sin cambio, mensaje con contestadores) y del endpoint; vitest de `rangeSummaryItems` con la línea nueva.

## Specs superadas

Ninguna. Aditiva.

## Contrato JSON

Nuevo `GET /api/campaigns/{c}/routing` (RF3).

## Fuera de Alcance

*   Gráfico por troncal y mapa de calor (specs siguientes). Alertas por cambio de volumen.

## Criterios de Finalización

*   Smoke real, campaña 35 01→30/09: **un** cambio, el 09/09, hacia IPLAN (~100%). La 91 y la 92 sin cambios o con los que arrojen sus datos.
*   `/cerrar-spec 044` en verde; commit en español + push.
