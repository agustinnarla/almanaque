# Plan 06: Health Score, Rankings y Diagnósticos

## 1. Config y helper puro

*   **`config.py`**: `HEALTH_WEIGHT_BUSY = 0.5`, `HEALTH_WEIGHT_CONGESTION = 1.5`, `DIAG_CONGESTION_THRESHOLD = 0.05`, `DIAG_BUSY_THRESHOLD = 0.35`, `DIAG_PEAK_THRESHOLD = 0.15`.
*   **`services/health.py`** (o `metrics_engine`): `compute_health_score(agent_rate, busy_rate, congestion_rate) -> float | None` — devuelve `None` si algún rate es `None`; si no, `round((a − b·wb − c·wc) * 100, 2)`.

## 2. Repositorio (`campaigns_repo`)

*   Query base: `SUM(total/agent/machine/busy/congestion)` `GROUP BY device` | `GROUP BY hora` + `HAVING SUM(total_calls) >= :min_calls`.
*   Tasas Σ/Σ con protección denom 0 → `None` (reutilizar `_rate` / `_fraction`).
*   Calcular `health_score`; **filtrar `None`** para rankings.
*   Ordenar y cortar top-k / bottom-k con `limit`.
*   `get_campaign_diagnostics`: mismas agregaciones + `min_calls`; aplicar umbrales; `message` en español (f-string con tasa en %).

## 3. Endpoints (`routers/campaigns.py`)

| Ruta | Params |
|---|---|
| `GET /{campaign_name}/devices/ranking` | `start_date`, `end_date`, `min_calls=50 ge=1`, `limit=5 ge=1` |
| `GET /{campaign_name}/hours/ranking` | idem |
| `GET /{campaign_name}/diagnostics` | `start_date`, `end_date`, `min_calls=50 ge=1` |

Respuestas: ver contratos en `spec.md`. Sin datos → listas `[]`, HTTP 200.

## 4. Decisiones Técnicas

*   **Decisión A: top-k con `limit` (default 5).** Mejor para el front que payloads duplicados; solapamiento permitido si `len ≤ 1` (o ambos top/bottom del mismo array).
*   **Decisión B: score solo en agregados device / hour.** RF1 reescrito para evitar el cruce 5×10 que nadie pidió.
*   **Decisión C: umbrales y pesos en `config.py`.** Consistencia con `AGENT_ANSWER_THRESHOLD`; sin literales mágicos en el detector.
*   **Decisión D: excluir `health_score: null` de rankings.** No hay orden total con `null`.
*   **Decisión E: `min_calls` también en diagnostics.** “Volumen representativo” = mismo filtro de RF2.

## 5. Tests

*   **Unit `health`:** fórmula a mano; algun rate `None` → `None`; redondeo 2 decimales.
*   **API rankings:** fixtures con scores conocidos; `min_calls` descarta volumen chico; `limit` corta listas; rango vacío → `best/worst` `[]`.
*   **API diagnostics:** congestion ≥5%, busy hora ≥35%, peak ≥15%; hora con poco volumen no alerta; vacío → 3 listas `[]`.
*   **Regresión:** suites 001–005 sin cambios de contrato.
