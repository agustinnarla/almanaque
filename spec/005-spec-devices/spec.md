# Spec 05: Dimensión de Dispositivo (Gateway) y Estados Técnicos Críticos

## Usuario

Desarrollador junior / frontend del dashboard.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous]:** Durante el procesamiento, el sistema deberá normalizar la columna **`Dispositivo`** del Excel (trimming, mayúsculas, `"DESCONOCIDO"` ante nulo/vacío o columna ausente) y almacenarla como `device`.
    *   *Por qué:* Para desglosar el rendimiento por troncal/gateway de origen sin clasificaciones heurísticas por número.
*   **RF2 [Ubiquitous]:** El pipeline contará por grupo `busy_calls` (`ESTADO == 'BUSY'`) y `congestion_calls` (`ESTADO == 'CONGESTION'`), comparando `ESTADO` normalizado a mayúsculas.
    *   *Definición de negocio:* **BUSY** = la línea del llamado está **ocupada** (rechazo del lado del abonado). **CONGESTION** = **saturación de red**: no entran más llamadas de las que antenas o conmutadores pueden absorber (rechazo del lado de la infraestructura).
    *   *Relación:* ambos son **subconjunto de `rejected_calls`** (no son ANSWER ni contestador con conexión). El frontend **no debe sumarlos** como extras al total.
    *   *Por qué:* Separar "ocupado" (se reintenta con callback) de "red llena" (problema de capacidad) para decisiones operativas distintas.
*   **RF3 [State-driven]:** El agrupamiento y la Primary Key pasan a 5 dimensiones: **`(fecha, hora, campaign, base, device)`**.
    *   *Por qué:* Para persistir métricas por gateway sin colisiones de PK.
*   **RF4 [Ubiquitous]:** `GET /api/campaigns/{name}/devices?start_date=&end_date=` devuelve el desglose por `device` con contadores y tasas, ordenado por **`total_calls` descendente**.
    *   *Por qué:* Para el gráfico de barras por gateway y detectar saturación en troncales concretas.
*   **RF5 [Unwanted behavior]:** Campaña o rango sin registros → **HTTP 200** y `[]`.
    *   *Por qué:* Consistencia con RF4 de Spec 002 y RF5 de Spec 003.
*   **RF6 [Ubiquitous]:** `/api/metrics` y `/api/patterns` incluyen **`device`** en cada fila; las alertas de patterns son por **(fecha, hora, campaign, base, device)**.
    *   *Por qué:* Continuidad con el patrón de Specs 003 y 004 (la nueva dimensión vive también en los contratos ya publicados).

## Agregación multi-día (`/devices`)

*   `SUM` de contadores por `device`.
*   `agent_answer_rate = Σagent / (Σtotal − Σmachine)` (denom ≤ 0 → `null`).
*   `busy_rate = Σbusy / Σtotal` (Σtotal = 0 → `null`).
*   `congestion_rate = Σcongestion / Σtotal` (Σtotal = 0 → `null`).
*   **Prohibido** promediar tasas previas.

## Contrato JSON

### `GET /api/campaigns/{name}/devices?start_date=&end_date=`
```json
[
  {
    "device": "GW37",
    "total_calls": 1010,
    "agent_answers": 90,
    "machine_answers": 200,
    "busy_calls": 120,
    "congestion_calls": 30,
    "agent_answer_rate": 0.12,
    "busy_rate": 0.1188,
    "congestion_rate": 0.0297
  }
]
```
Orden: `total_calls` DESC. Sin datos → `[]`.

### Modificaciones Specs 002–004
*   `/api/metrics`: + `"device": "GW37"`.
*   `/api/patterns`: + `"device": "GW37"` (evaluación por device).

## Esquema / Migración

*   PK: `(fecha, hora, campaign, base, device)`; columnas `device TEXT NOT NULL DEFAULT 'DESCONOCIDO'`, `busy_calls INTEGER NOT NULL`, `congestion_calls INTEGER NOT NULL`.
*   **`migrate_recreate_device(conn)`**: recrea la tabla si la PK no es la de 5 columnas (mismo patrón que Spec 004; no borrar el `.db` a mano).
*   Re-ingesta obligatoria de todo `/data`.
*   Spec 004: el ítem “fuera de alcance: segmentación por dispositivo” queda **derogado** por esta spec.

## Fuera de Alcance

*   Clasificación heurística por prefijo del número discado.
*   Desglose de otros ESTADO (`NOANSWER`, `REJECTED`, `UNALLOCATED`, etc.) — siguen dentro de `rejected_calls` sin contar en busy/congestion.
*   Dimensión `TIPO` (NAC-CEL / FIJO) — posible hito futuro.

## Criterios de Finalización

*   PK de 5 columnas activa; `/data` re-ingresado con `device` y contadores.
*   `/devices` 200 con contrato y orden `total_calls` DESC; vacío → `[]`.
*   `/api/metrics` y `/api/patterns` incluyen `device`.
*   Tests prueban normalización de `Dispositivo`, conteo BUSY/CONGESTION y busy⊂rejected.
*   `pytest` en verde (Spec 01–05).
