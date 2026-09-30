# Plan 05: Dimensión de Dispositivo y Estados Técnicos

## 1. Módulos Modificados (Ingesta y DB)

*   **`data_cleaner`**: 
    *   `device` desde `Dispositivo` (si la columna falta → toda la fila con `"DESCONOCIDO"` + alerta en español). Normalización: `str.strip().str.upper()`, vacíos/nulos → `"DESCONOCIDO"`.
    *   `ESTADO` a mayúsculas de forma defensiva antes de contar.
*   **`metrics_engine`**: 
    *   `groupby(['FECHA', 'hora', 'campaign', 'BASE', 'device'])`.
    *   Contadores: `busy_calls` = ESTADO==BUSY; `congestion_calls` = ESTADO==CONGESTION.
    *   Salida con `device`, `busy_calls`, `congestion_calls` en minúscula para DB.
*   **`db_manager`**: 
    *   `CREATE TABLE` con `device TEXT NOT NULL DEFAULT 'DESCONOCIDO'`, `busy_calls INTEGER NOT NULL`, `congestion_calls INTEGER NOT NULL`.
    *   PK `(fecha, hora, campaign, base, device)`.
    *   `migrate_recreate_device(conn)`: si la PK no es la de 5 columnas → DROP + CREATE (patrón Spec 004).
    *   `init_db` ejecuta la migración; `replace_day` sigue con `DELETE` por `fecha` e inserta las columnas nuevas.

## 2. Repositorios y Endpoints

*   **`campaigns_repo.get_device_metrics(campaign, start, end)`**: `SUM` por `device`; tasas Σ/Σ con protección de denominador 0 → `null`; `ORDER BY total_calls DESC`.
*   **`routers/campaigns.py`**: `GET /{campaign_name}/devices` con `start_date`/`end_date` tipo `date`.
*   **`metrics_repo`**: SELECT agrega `device`; `ORDER BY fecha, hora, campaign, base, device`.
*   **`pattern_detector`**: propaga `device` en cada alerta.

## 3. Contrato JSON

Ver `spec.md`. Impacto:

| Endpoint | Cambio |
|---|---|
| `/api/metrics` | + `device` |
| `/api/patterns` | + `device`; alertas por device |
| `.../devices` | nuevo; orden `total_calls` DESC |

## 4. Decisiones Técnicas Justificadas

*   **Decisión A: `device` = columna `Dispositivo` (gateways).** El usuario eligió troncal/gateway; `TIPO` queda fuera de alcance para futuro.
*   **Decisión B: busy/congestion ⊂ rejected.** No se cambia la fórmula de `rejected_calls` de Spec 003; solo se expone el desglose para el front.
*   **Decisión C: Recrear tabla en código.** Misma razón que 004: SQLite no permite ALTER de PK; recrear + re-ingesta es idempotente.
*   **Decisión D: Fallback `"DESCONOCIDO"` si falta la columna.** RF1 de 001 ya usa este patrón para no frenar la ingesta.
*   **Decisión E: Orden `total_calls` DESC.** Útil para gráfico de barras del dashboard.

## 5. Estrategia de Tests (Testing)

*   **Cleaner:** `Dispositivo` con espacios/mixto → mayúsculas; nulo → `DESCONOCIDO`; columna ausente → `DESCONOCIDO`.
*   **Metrics:** BUSY y CONGESTION se contabilizan; groupby incluye `device`; busy⊂rejected (busy_calls ≤ rejected en el mismo grupo cuando se calcula).
*   **DB:** PK de 5 columnas; migración idempotente; `replace_day` limpia todas las devices de la fecha.
*   **HTTP `/devices`:** contrato JSON, orden desc, rango vacío → `[]`.
*   **Contrato:** `metrics` y `patterns` incluyen `device`.
*   **Regresión:** suites 001–004 en verde (actualizar seeds con `device`/`busy`/`congestion`).
