# Plan 03: Arquitectura Analítica de Campañas

## 1. Módulos Modificados (Ingesta y DB)

*   **`data_cleaner`**: extraer prefijo del nombre de archivo (`stem.split("_", 1)[0]` si hay `_`, si no `"Sin Campaña"`), inyectar columna `campaign` en el DataFrame. *(RF1)*.
*   **`metrics_engine`**: `groupby` pasa a `["FECHA", "campaign", "BASE"]`; salidas con `campaign`. *(RF1)*.
*   **`db_manager`**: columna `campaign TEXT NOT NULL DEFAULT 'Sin Campaña'`; PK `(fecha, campaign, base)` en `CREATE`; función `migrate_add_campaign(conn)` con `ALTER TABLE ... ADD COLUMN` (ignorar si ya existe). `replace_day` borra por `fecha` (todo el día, todas las campañas). *(Migración)*.

## 2. Nuevos Módulos (Capa Analítica)

*   **`repositories/campaigns_repo.py`**: `get_summary`, `get_day_metrics` (para compare), `get_ranking` — SQL sobre `daily_campaign_metrics` filtrando `campaign = ?` y fechas. Si denominador ≤ 0, rate = `None`. *(RF2–RF5)*.
*   **`routers/campaigns.py`**: prefijo `/api/campaigns/{campaign_name}` con `/summary`, `/compare`, `/bases-ranking`. *(RF2–RF5)*.

## 3. Ajuste Spec 002 (contratos existentes)

*   `metrics_repo.fetch_metrics`: incluir `campaign` en el SELECT y en cada fila.
*   `pattern_detector.evaluate_campaigns`: propagar `campaign` al objeto de alerta.

## 4. Contratos JSON

Ver `spec.md`. Resumen de formas vacías:

| Endpoint | Campaña/rango vacío |
|---|---|
| `/summary` | 200 + campos en `null`/0 o 404-free: usar objeto con `null`s y `campaign` |
| `/compare` | `date_a`/`date_b`/`deltas` pueden ser `null` |
| `/bases-ranking` | `[]` |

Decisión operativa: **`summary` sin datos → 200 con todos los totales en 0, rates en `null`** (más fácil para la tarjeta que `[]`).

## 5. Decisiones Técnicas Justificadas

*   **Decisión A: PK de 3 columnas.** Misma `base` puede existir bajo campañas distintas sin chocar.
*   **Decisión B: Migración `ALTER` + re-ingesta.** El pipeline de 001 es idempotente por fecha; no se borra el `.db` ni `/data`.
*   **Decisión C: Fallback `"Sin Campaña"`.** El código nunca asume que el archivo ya fue renombrado; evita romper groupby/PK.
*   **Decisión D: Claves JSON en inglés.** Continuidad con Spec 002.
*   **Decisión E: Compare con `null`s y deltas `null` si falta un día o la base es 0.** Evita falsos positivos infinitos y 404.
*   **Decisión F: Ranking reutiliza fórmula y exclusión de Spec 002 RF2.** Un solo criterio de “Tasa de Contacto Humano” en toda la app.

## 6. Estrategia de Tests (Testing)

*   **Unidad cleaner:** nombre `35_01-09.xls` → `campaign == "35"`; `01-09.xls` → `"Sin Campaña"`.
*   **Unidad metrics:** groupby triple mantiene campaign en la salida.
*   **DB:** `migrate_add_campaign` idempotente; PK de 3 columnas acepta misma base en dos campañas.
*   **HTTP summary:** seed multi-base misma campaña → suma correcta; campaña inexistente → zeros/`null`s 200.
*   **HTTP compare:** ambos días → deltas float; un día faltante → `null`; rate base 0 → delta `null`.
*   **HTTP ranking:** excluye denominador 0; ordena desc por rate.
*   **HTTP 002:** filas de metrics y patterns contienen `campaign`.
*   **Regresión:** suites 001 y 002 en verde.
