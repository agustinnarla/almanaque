# Spec 04: Granularidad Horaria y Tendencia Intradía

## Usuario

Desarrollador junior / frontend del dashboard.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous]:** Durante el procesamiento, el sistema deberá extraer la hora (0–23) de la columna **`INICIO`** y asignarla a la columna `hora` en todos los registros (tras el filtro `INICIO.hour < 20` de Spec 001, las horas efectivas son 0–19).
    *   *Por qué:* Para habilitar la curva de rendimiento intradía anclada al inicio de la llamada, coherente con el filtro horario existente.
*   **RF2 [State-driven]:** El agrupamiento del motor de métricas y la Primary Key de la base de datos tendrán granularidad horaria: **`(fecha, hora, campaign, base)`**.
    *   *Por qué:* Para poder consultar y re-ingresar métricas por bloque horario sin colisiones de PK.
*   **RF3 [Ubiquitous]:** El sistema expondrá `GET /api/campaigns/{name}/hourly-trend?start_date=&end_date=` que devuelva métricas consolidadas **por hora** (0–32 orden ascendente… en la práctica 0–19) para graficar la curva intradía.
    *   *Por qué:* Para el gráfico de tendencia por hora del dashboard.
*   **RF4 [Unwanted behavior]:** Si el rango no tiene datos o la campaña no existe, `hourly-trend` responderá **HTTP 200** y `[]`.
    *   *Por qué:* Consistencia con RF4 de Spec 002 y RF5 de Spec 003.
*   **RF5 [Ubiquitous]:** Las respuestas de `/api/metrics` y `/api/patterns` incluirán el campo **`hora`** en cada fila. Las alertas de `/api/patterns` pasan a ser por **(fecha, hora, campaign, base)** — semántica horaria.
    *   *Por qué:* La dimensión nueva debe estar en los contratos ya existentes; las alertas siguen la misma PK que el resto de la DB.

## Agregación multi-día (hourly-trend)

Para cada hora en el rango:

*   `total_calls = SUM(...)`, `agent_answers = SUM(...)`, `machine_answers = SUM(...)`
*   `agent_answer_rate = Σagent_answers / (Σtotal_calls − Σmachine_answers)`; si denominador ≤ 0 → `null`.
*   **Prohibido** promediar tasas diarias/horarias ya calculadas.

## Contrato JSON

### `GET /api/campaigns/{name}/hourly-trend?start_date=&end_date=`
```json
[
  {
    "hora": 9,
    "total_calls": 500,
    "agent_answers": 60,
    "machine_answers": 100,
    "agent_answer_rate": 0.1538
  }
]
```
Orden: `hora` ascendente (0, 1, 2…). Sin datos → `[]`.

### Modificaciones Spec 002/003
*   `/api/metrics`: cada fila agrega **`"hora": 9`**.
*   `/api/patterns`: cada alerta agrega **`"hora": 9`** (evaluación por hora).

## Esquema / Migración

*   PK: `(fecha, hora, campaign, base)`; columna `hora INTEGER NOT NULL`.
*   SQLite no permite `ALTER` de PK → función en código **`migrate_recreate_hourly(conn)`**: recrea `daily_campaign_metrics` con el nuevo esquema. **No se borra el archivo `.db` a mano.**
*   Tras la migración, **re-ingesta obligatoria** de todo `/data` con el pipeline de Spec 001.
*   **Excepción a Spec 003:** queda permitida la recreación de la tabla en código por cambio de PK, siempre seguida de re-ingesta; sigue prohibido eliminar `callcenter_metrics.db` como paso manual y sigue prohibido tocar `/data`.

## Fuera de Alcance

*   Franjas de turnos (Mañana/Tarde/Noche).
*   ~~Segmentación por dispositivo~~ → **incorporada en Spec 005** (`device` en PK y contratos).
*   Granularidad de minutos/segundos (mínimo: hora).
*   Borrar el archivo SQLite a mano.

## Criterios de Finalización

*   PK de 4 columnas activa en la DB; datos de `/data` re-ingresados con `hora` poblada desde `INICIO`.
*   `hourly-trend` responde lista ordenada por hora con contadores sumados y rate = Σ/Σ; rango vacío → `200 []`.
*   `/api/metrics` y `/api/patterns` incluyen `hora`; patterns evalúa por hora.
*   Ningún `groupby` usa el nombre `CAMPAÑA` (solo `campaign`).
*   `pytest` en verde (Spec 01–04).
