# Spec 058: Mapa de calor hora × troncal

## Usuario

Analista / supervisor del call center. La tendencia por hora suma todas las troncales, y la tabla de gateways suma todas las horas, así que hoy no se ve cómo rinde cada troncal a cada hora. Con los datos reales de la campaña 35 (01→30/09):
*   IPLAN tiene un AA de **14,3%, 13,6% y 11,4% entre las 9 y las 11 h**, y después cae a 5–6%.
*   GW37 y GW39 son parejas a lo largo del día.

Saberlo cambia a qué troncal conviene mandar el volumen de la mañana. Es el ítem 3 de la segunda ronda de mejoras.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — datos]:**
    *   `GET /api/campaigns/{c}/heatmap?start_date&end_date` devuelve una fila por `(device, hora)` con `total_calls`, `agent_answers` y `machine_answers`, ordenada por troncal y hora.
    *   Un rango sin datos devuelve `[]`.
*   **RF2 [Ubiquitous — armado]:** `frontend/src/lib/heatmap.ts`, función pura `buildHeatmap(rows, metric)`:
    *   **Filas:** las troncales con `total_calls ≥ HIGHLIGHT_MIN_SHARE` (1%, de la Spec 053) del volumen del rango, de mayor a menor volumen. Devuelve cuántas quedaron afuera.
    *   **Columnas:** las horas con datos, en orden.
    *   **Métrica:** `aa` (agentes ÷ llamadas) o `attendable` (agentes ÷ (llamadas − contestadores)).
    *   **Celdas sin color:** con menos de `HEATMAP_MIN_CELL_CALLS = 50` llamadas (en `rangeThresholds.ts`), la celda queda sin color y no entra en la escala.
    *   **Escala:** del mínimo al máximo de las celdas con color, dividida en 6 tramos (`heatBin`).
*   **RF3 [UI — mapa]:** `HourDeviceHeatmap`, en la sección «Por hora» de Campaña completa y Por semana, debajo de la tendencia horaria.
    *   **Selector de métrica:** «AA» / «AA sobre atendibles» (`aria-pressed`).
    *   **Color:** escala secuencial de un solo tono, el azul de la paleta de referencia. En modo oscuro, los valores bajos se acercan a la superficie.
    *   **Detalle de cada celda:** al pasar el mouse o con foco de teclado (`tabIndex` + `aria-label`) muestra troncal, hora, valor, agentes y llamadas. Las celdas sin color muestran «·» y dicen «pocas llamadas».
    *   **Leyenda:** la escala con los valores mínimo y máximo, la clave de «·» y la cantidad de troncales que no se muestran por tener menos del 1%.
    *   **Tabla y CSV:** «Ver tabla» (Troncal · Hora · Llamadas · Agentes · AA % · AA atend. %) y CSV `{prefijo}_{c}_{desde}_{hasta}_heatmap.csv`.
    *   **Sin datos:** «No hay datos por hora y troncal para el rango seleccionado.»
*   **RF4 [Ubiquitous — metodología]:** la pestaña «Ruteo y volumen» del modal «¿Cómo se calcula?» explica la regla, con los valores de las constantes.
*   **RF5 [Unwanted behavior — aislamiento]:**
    *   Sin cambios de esquema, otros endpoints ni `/data`.
    *   Sin librerías nuevas: el mapa es una grilla HTML con Tailwind, sin Recharts.
    *   La cobertura no baja.
*   **RF6 [Testing]:**
    *   pytest: el endpoint agrupa por troncal y hora; rango vacío.
    *   vitest:
        *   `buildHeatmap`: filtro del 1%, celdas chicas, dominio y métrica de atendibles;
        *   `heatBin`;
        *   el componente: escala, selector, celdas sin color, tabla, vacío y foco;
        *   la regla en el modal.

## Specs superadas por esta revisión

Ninguna. Aditiva.

## Datos de entrada

`daily_campaign_metrics`. Campaña 35, 01→30/09: 5 troncales con el 1% o más (IPLAN, GW37, GW20, GW39 e IPLAN2), horas de 9 a 17, 45 celdas; 4 tienen menos de 50 llamadas, todas de IPLAN2. AA entre 1,8% y 14,3%. Campaña 91: 22 troncales, de 9 a 19 h.

## Contrato JSON

```json
GET /api/campaigns/35/heatmap?start_date=2026-09-01&end_date=2026-09-30
[{"device": "GW20", "hora": 9, "total_calls": 712, "agent_answers": 22, "machine_answers": 81}, ...]
```

## Fuera de Alcance

*   Mapa de calor por base o por día.
*   Elegir la troncal desde el mapa para filtrar el resto del dashboard.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/058-spec-hour-device-heatmap/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke con la API real (35): IPLAN 9 h ≈ 14,3%; 5 troncales; 4 celdas sin color.
*   `run_checks.py` en verde con cobertura; CI en verde; squash merge.
