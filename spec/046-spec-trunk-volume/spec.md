# Spec 046: Volumen diario por troncal

## Usuario

Analista / supervisor del call center. La Spec 044 dice en el Resumen que desde el 09/09 las campañas 35 y 38 salen 100% por IPLAN, pero no hay forma de **verlo**: la serie diaria muestra solo el total y la tabla de gateways suma todo el rango. Tampoco se ve que el volumen diario de la 35 cayó de 3–4 mil a 1,5–2 mil llamadas.

Es el ítem 2 de la segunda ronda de mejoras.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — datos]:** `GET /api/campaigns/{c}/routing` suma el campo `volume`: una fila por `(fecha, device)` con `total_calls`, ordenada por fecha y troncal, para **todos** los días del rango (también los de poco volumen que el detector ignora). Reusa `get_daily_device_rows`; `days` y `changes` no cambian.
*   **RF2 [Ubiquitous — agrupado]:** `frontend/src/lib/trunkVolume.ts`, función pura `buildTrunkVolume(rows, top = TRUNK_CHART_TOP)`:
    *   `TRUNK_CHART_TOP = 5`: las 5 troncales con más llamadas en el rango, ordenadas de mayor a menor; el resto se suma en «Otras» (solo si tiene llamadas).
    *   Devuelve `{trunks: [{name, total, share}], days: [{fecha, label, total, <troncal>: llamadas}]}`, con 0 donde una troncal no tuvo llamadas ese día. Entrada vacía → listas vacías.
    *   *Por qué:* la 91 y la 92 usan ~30 troncales; más de 5 colores no se distinguen.
*   **RF3 [UI — gráfico]:** `TrunkVolumeChart` en la sección «Tendencia diaria» de Campaña completa y Por semana, debajo de la serie diaria: barras apiladas por día (un solo eje: llamadas).
    *   Colores: slots 1–5 de la paleta categórica validada (`TRUNK_COLORS` en `chartPalette.ts`, mismo orden fijo) y gris neutro para «Otras». El color sigue al orden de volumen dentro del rango.
    *   Leyenda con cada troncal y su share del rango («IPLAN · 68%»): identidad no solo por color (3 slots quedan bajo 3:1 de contraste, regla de alivio).
    *   Tooltip por día: llamadas por troncal y total. Exporta CSV `{prefijo}_{c}_{desde}_{hasta}_troncales.csv` (fecha, troncal, llamadas).
    *   Sin datos: mensaje «No hay volumen por troncal para el rango seleccionado.» y sin botón de CSV.
*   **RF4 [Unwanted behavior — aislamiento]:** sin cambios en esquema, otros endpoints, otros modos ni `/data`; una sola llamada a la API (`useRoutingChanges` devuelve también `volume`); sin librerías nuevas.
*   **RF5 [Testing]:**
    *   pytest: el endpoint de ruteo devuelve `volume` completo, incluso días bajo el mínimo del detector.
    *   vitest: `buildTrunkVolume` (top N + «Otras», ceros, vacío); `TrunkVolumeChart` (leyenda con shares, colores en orden, vacío); `trunkVolumeRows` del CSV.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Specs superadas por esta revisión

Ninguna. Spec aditiva (extiende el contrato de la 044 sin romperlo).

## Datos de entrada

*   `daily_campaign_metrics` vía `get_daily_device_rows`. Campaña 35, 01→30/09: IPLAN 40.755, GW37 6.133, GW20 5.610, GW39 5.577, IPLAN2 1.555; el resto (8 troncales) suma 635 → «Otras».

## Contrato JSON

```json
{"days": [...], "changes": [...],
 "volume": [{"fecha": "2026-09-01", "device": "GW20", "total_calls": 812}]}
```

## Fuera de Alcance

*   Mapa de calor hora × dispositivo (ítem 3). Marca de días con poco volumen (ítem 5). Colores estables por troncal entre rangos distintos.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/046-spec-trunk-volume/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke real, campaña 35 01→30/09: troncales IPLAN, GW37, GW20, GW39, IPLAN2 + Otras (635); desde el 09/09 la barra es casi toda IPLAN.
*   `pytest -q` = **182**; `npm test` + `tsc` + `lint` + `build` en verde; `/data` intacto; `package.json` sin dependencias nuevas.
