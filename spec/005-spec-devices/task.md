# Task 05: Implementación de Dispositivo y Estados Críticos

## 1. Migración y Almacenamiento
- [x] Actualizar `CREATE TABLE` en `db_manager.py`: `device TEXT NOT NULL DEFAULT 'DESCONOCIDO'`, `busy_calls INTEGER NOT NULL`, `congestion_calls INTEGER NOT NULL` y `PRIMARY KEY (fecha, hora, campaign, base, device)`.
- [x] Crear `migrate_recreate_device(conn)`: si la PK no es la de 5 columnas, DROP + CREATE (no borrar el `.db` a mano). Ejecutar desde `init_db`.
- [x] Actualizar `replace_day` para insertar `device`, `busy_calls`, `congestion_calls` (DELETE por `fecha` sigue igual).

## 2. Motor de Ingesta
- [x] En `data_cleaner.py`: crear `device` desde `Dispositivo` (trim + upper; nulo/vacío o columna ausente → `"DESCONOCIDO"` + alerta en español si falta la columna).
- [x] Normalizar `ESTADO` a mayúsculas de forma defensiva.
- [x] En `metrics_engine.py`: añadir `device` al groupby (5 dimensiones con `campaign` en inglés) y acumular `busy_calls` y `congestion_calls`.

## 3. Capa de Consulta y API
- [x] En `campaigns_repo.py`: `get_device_metrics(campaign, start, end)` con SUM por device, tasas Σ/Σ protegidas contra denom 0 → `null`, orden `total_calls` DESC.
- [x] En `routers/campaigns.py`: `GET /{campaign_name}/devices` con `start_date`/`end_date` tipo `date`.
- [x] En `metrics_repo.py`: incluir `device` en SELECT y ordenar por fecha, hora, campaign, base, device.
- [x] En `pattern_detector.py`: incluir `device` en cada alerta.

## 4. Testing y Re-ingesta
- [x] `test_processor.py`: normalización de `Dispositivo` (espacios/mixto → upper; nulo → DESCONOCIDO; columna ausente → DESCONOCIDO); conteo de BUSY/CONGESTION; salida con `device` y contadores.
- [x] `test_db.py`: PK de 5 columnas; migración idempotente; seeds con `device`/`busy`/`congestion`.
- [x] `test_api.py`: seeds actualizados; `metrics` y `patterns` incluyen `device`; HTTP `/devices` 200 con contrato y orden desc; rango vacío → `[]`.
- [x] Ejecutar `pytest` completo (001–005) y dejar en verde.
- [x] Re-ingesta de todo `/data` con `python backend/main.py`.
- [x] Smoke: `/devices`, `/metrics`, `/patterns` de la campaña 35.

## Nota de dominio (para docs/tests)
- BUSY = línea del llamado ocupada; CONGESTION = saturación de red (antenas/conmutadores). Ambos ⊂ rejected_calls.
