# Spec 03: Filtrado por Campaña (Ingesta, Esquema y Endpoints Analíticos)

## Usuario

Desarrollador junior / frontend interno del dashboard.

## Requisitos Funcionales (EARS)

*   **RF1 [Event-driven]:** Cuando el sistema ingeste un archivo Excel, el motor de limpieza deberá extraer el nombre de la campaña del prefijo del nombre del archivo (convención `NombreCampaña_resto.xls`, todo antes del primer `_`) y asignarlo a la columna `campaign` en todos los registros. Si el nombre no contiene `_`, usará el valor fallback `"Sin Campaña"`.
    *   *Por qué:* Para agrupar y filtrar múltiples bases bajo una única entidad comercial sin tocar los archivos de `/data` (el usuario renombra al subir).
*   **RF2 [State-driven]:** Mientras se consulte `GET /api/campaigns/{name}/summary`, el sistema deberá sumarizar en el rango `start_date`–`end_date`: `total_calls`, `agent_answers`, `machine_answers`, `rejected_calls` (= llamadas sin `CONEXION` válida, es decir no conectadas: no humano y no contestador con fecha de conexión) y `agent_answer_rate` de todas las bases de esa campaña.
    *   *Por qué:* Para la tarjeta principal del dashboard con la vista consolidada de la campaña.
*   **RF3 [Ubiquitous]:** `GET /api/campaigns/{name}/compare?date_a=&date_b=` deberá retornar las métricas de cada día y el `deltas` (variación porcentual) de cada indicador. Si un día no tiene registros, su objeto será `null` y `deltas` será `null`. Si un indicador base es 0 o no hay ambos días, su delta es `null`.
    *   *Por qué:* Para medir el impacto de ajustes entre dos jornadas sin romper la API con días faltantes.
*   **RF4 [Ubiquitous]:** `GET /api/campaigns/{name}/bases-ranking?start_date=&end_date=` deberá listar las bases de la campaña ordenadas descendentemente por `agent_answer_rate = agent_answers / (total_calls - machine_answers)`, excluyendo las bases con denominador ≤ 0.
    *   *Por qué:* Para priorizar o pausar bases con criterio matemático comparable al de Spec 002.
*   **RF5 [Unwanted behavior]:** Si `name` no corresponde a ninguna campaña o el rango está vacío, los tres endpoints deberán responder **HTTP 200** con estructura vacía (`[]`, o `null` en la parte que aplique de `compare`).
    *   *Por qué:* Consistencia con RF4 de Spec 002 (estado "Sin Datos" manejable en React).

## Contrato de la Base de Datos

*   Columna nueva: `campaign TEXT NOT NULL DEFAULT 'Sin Campaña'`.
*   **PK:** `(fecha, campaign, base)`.
*   Migración: `ALTER TABLE` sobre la DB existente + re-ingesta con el pipeline de Spec 001. **Prohibido** borrar el archivo `.db` ni modificar `/data`.
    *   *Excepción (Spec 004):* ante un cambio de Primary Key que SQLite no pueda aplicar con `ALTER`, se permite **recrear la tabla en código** (`DROP`+`CREATE`) siempre que siga una **re-ingesta obligatoria** de `/data`. Sigue prohibido eliminar `callcenter_metrics.db` como paso manual y sigue prohibido tocar `/data`.

## Contrato JSON

Claves en **inglés** (alineado a Spec 002).

### `GET /api/campaigns/{name}/summary?start_date=&end_date=`
```json
{
  "campaign": "35",
  "total_calls": 1000,
  "agent_answers": 150,
  "machine_answers": 200,
  "rejected_calls": 650,
  "agent_answer_rate": 0.214
}
```
`agent_answer_rate = agent_answers / (total_calls - machine_answers)`; si denominador ≤ 0 → `null`.

### `GET /api/campaigns/{name}/compare?date_a=YYYY-MM-DD&date_b=YYYY-MM-DD`
```json
{
  "campaign": "35",
  "date_a": { "fecha": "...", "total_calls": 0, "agent_answers": 0, "machine_answers": 0, "rejected_calls": 0, "agent_answer_rate": 0.1 },
  "date_b": null,
  "deltas": null
}
```
Si ambos días existen, `deltas` es un objeto con el % de variación (`(b - a) / a * 100`, float) por cada métrica numérica; `null` cuando `a` es 0 o el rate es `null`.

### `GET /api/campaigns/{name}/bases-ranking?start_date=&end_date=`
```json
[
  { "base": "80", "agent_answer_rate": 0.097 }
]
```
Orden: rate desc, desempate `base` asc. Sin denominador ≤ 0.

### Modificación Spec 002
`/api/metrics` y `/api/patterns`: cada fila agrega **`"campaign": "..."`**.

## Fuera de Alcance

*   Comparación entre campañas distintas.
*   Desglose intra-diario por horas (granularidad mínima sigue siendo fecha + campaña + base).
*   Renombrar o modificar archivos en `/data`.
*   Borrar/regenerar el archivo SQLite a mano.

## Criterios de Finalización

*   Esquema con `campaign` y PK de 3 columnas; datos existentes migrados por `ALTER` + re-ingesta.
*   `35_01-09.xls` (o cualquier `Prefijo_...xls`) ingesta como `campaign = "Prefijo"`; sin `_` → `"Sin Campaña"`.
*   Los 3 endpoints nuevos responden 200 con los contratos; rango/campaña vacíos → estructuras vacías; compare con día faltante → `null`.
*   `/api/metrics` y `/api/patterns` incluyen `campaign`.
*   `pytest` en verde (Spec 01 + 02 + 03).
