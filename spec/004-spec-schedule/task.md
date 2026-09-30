# Task 04: Implementación de Granularidad Horaria

## 1. Migración y Esquema
- [x] Actualizar `CREATE TABLE` en `db_manager.py`: `hora INTEGER NOT NULL` y `PRIMARY KEY (fecha, hora, campaign, base)`.
- [x] Crear `migrate_recreate_hourly(conn)`: si la tabla existente no tiene la PK de 4 columnas (o falta `hora`), `DROP TABLE` + `CREATE` con el nuevo esquema. **No borrar el archivo `.db` a mano.**
- [x] Ejecutar la migración desde `init_db` / `get_db_connection` y al inicio de `main.py`.
- [x] Confirmar que `replace_day` sigue haciendo `DELETE` solo por `fecha` (limpia todas las horas del día).

## 2. Motor de Procesamiento
- [x] En `data_cleaner.py`: tras convertir `INICIO` y filtrar `< 20`, asignar `hora = INICIO.dt.hour` (int). No usar columna `CAMPAÑA`.
- [x] En `metrics_engine.py`: `groupby(['FECHA', 'HORA', 'campaign', 'BASE'])`; persistir `hora` en la salida (minúscula para DB).

## 3. Repositorios y Rutas
- [x] En `campaigns_repo.py`: `get_hourly_trend(campaign, start, end)` con `SUM` de contadores por `hora`, rate = Σagent / (Σtotal − Σmachine) (null si denom ≤ 0), orden `hora ASC`.
- [x] En `routers/campaigns.py`: `GET /{campaign_name}/hourly-trend` con `start_date`/`end_date`; sin datos → `[]`.
- [x] En `metrics_repo.py`: incluir `hora` en SELECT y `ORDER BY fecha, hora, campaign, base`.
- [x] En `pattern_detector.py`: incluir `hora` en cada alerta.

## 4. Testing
- [x] `test_processor.py`: `INICIO` 10:35 → `hora == 10`; salida de `compute_metrics` tiene `hora`; dos horas mismo día/base → 2 filas.
- [x] `test_db.py`: PK de 4 columnas; migración deja columna `hora`; seeds con `hora`.
- [x] `test_api.py`: seeds con `hora`; `metrics` y `patterns` incluyen `hora`; `hourly-trend` suma dos días en la misma hora con rate Σ/Σ; rango vacío → 200 `[]`; orden ascendente.
- [x] Actualizar contratos existentes de 002/003 en los tests para incluir `hora`.
- [x] Ejecutar `pytest` completo (001–004) y dejar en verde.
- [x] Re-ingesta de **todo** `/data` (`35_01-09.xls` y `35_02-09.xls`) con `python backend/main.py`.
- [x] Smoke: `hourly-trend` y `compare` de la campaña 35.

## Nota
- [x] Spec 003: añadir nota de excepción (recreación de tabla por cambio de PK + re-ingesta; no borrar `.db` a mano).
