# Task 06: Health Score, Rankings y Diagnósticos

## 1. Config y helper
- [x] Agregar en `config.py`: `HEALTH_WEIGHT_BUSY`, `HEALTH_WEIGHT_CONGESTION`, `DIAG_CONGESTION_THRESHOLD`, `DIAG_BUSY_THRESHOLD`, `DIAG_PEAK_THRESHOLD`.
- [x] Crear `services/health.py` con `compute_health_score` puro (None si algún rate es None; `round(..., 2)`).

## 2. Repositorio
- [x] `campaigns_repo.get_device_rankings(campaign, start, end, min_calls, limit)`: SUM por device, HAVING min_calls, tasas, score, filtrar null, best desc / worst asc.
- [x] `campaigns_repo.get_hourly_rankings(...)`: ídem agrupado por `hora` (campo `hora`, desempate `hora`).
- [x] `campaigns_repo.get_campaign_diagnostics(campaign, start, end, min_calls)`: 3 listas con umbrales de config y `message` en español.

## 3. Endpoints
- [x] `routers/campaigns.py`: `GET /devices/ranking`, `GET /hours/ranking` (`min_calls` y `limit` con `ge=1`).
- [x] `routers/campaigns.py`: `GET /diagnostics` (`min_calls` con `ge=1`).
- [x] Sin datos / sin hallazgos → 200 con listas `[]` (y claves del objeto presentes).

## 4. Testing y cierre
- [x] Tests unitarios de `compute_health_score` (fórmula, null, redondeo).
- [x] Tests API rankings: orden, `min_calls`, `limit`, contrato, vacío 200.
- [x] Tests API diagnostics: congestión, burn, peak; volumen chico ignorado; 3 listas vacías.
- [x] `pytest` completo en verde (001–006).
- [x] Re-ingesta `/data` si hizo falta (sin cambio de esquema no debería) y smoke de los 3 endpoints en campaña 35.
- [x] Marcar este task `[x]`.
