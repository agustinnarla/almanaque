# Task 03: Implementación de Filtrado por Campaña

## 1. Ingesta y Base de Datos
- [x] Actualizar `CREATE TABLE` en `db_manager.py`: columna `campaign TEXT NOT NULL DEFAULT 'Sin Campaña'` y PK `(fecha, campaign, base)`.
- [x] Crear `migrate_add_campaign(conn)`: `ALTER TABLE daily_campaign_metrics ADD COLUMN campaign TEXT NOT NULL DEFAULT 'Sin Campaña'` si la columna no existe (no borrar el `.db`).
- [x] Llamar migración al abrir la conexión de `get_db_connection` y al inicio de `main.py`.
- [x] Modificar `data_cleaner.py`: extraer prefijo del nombre de archivo (hasta el primer `_`; si no hay `_` → `"Sin Campaña"`) y poblar `campaign` en todos los registros. **No modificar nada en `/data`.**
- [x] Modificar `metrics_engine.py`: agrupar por `FECHA`, `campaign`, `BASE`; incluir `campaign` en la salida.
- [x] Ajustar `replace_day` si hace falta (borrar por `fecha` completo sigue siendo correcto).

## 2. Repositorios y Lógica
- [x] Crear `backend/repositories/campaigns_repo.py`.
- [x] `get_summary(conn, name, start, end)` → totales + `rejected_calls` + `agent_answer_rate` (denom ≤ 0 → `None`).
- [x] `get_day_metrics(conn, name, day)` → fila de un día o `None`.
- [x] `compute_day_metrics(rows)` → dict de métricas del día (o `None`).
- [x] `compute_deltas(day_a, day_b)` → deltas % o `None` si falta un día o base 0.
- [x] `get_ranking(conn, name, start, end)` → lista ordenada rate desc, `base` asc; excluye denom ≤ 0.
- [x] `fetch_metrics` de `metrics_repo`: incluir `campaign` en SELECT y filas.
- [x] `pattern_detector`: propagar `campaign` en las alertas.

## 3. Routers y Endpoints
- [x] Crear `backend/routers/campaigns.py` con prefijo `/api/campaigns/{campaign_name}`.
- [x] `GET /summary` con `start_date`/`end_date` tipo `date`.
- [x] `GET /compare` con `date_a`/`date_b` tipo `date`.
- [x] `GET /bases-ranking` con `start_date`/`end_date`.
- [x] Registrar el router en `backend/main_api.py`.

## 4. Testing
- [x] `test_processor.py`: `load_and_clean` con path fake `35_01-09.xls` → `campaign == "35"`; `01-09.xls` → `"Sin Campaña"`.
- [x] `test_processor.py`: `compute_metrics` conserva `campaign` en la salida.
- [x] `test_db.py`: migración idempotente; insertar misma `base` en dos campañas distintas sin chocar PK.
- [x] `test_api.py`: summary suma multi-base de una campaña; campaña inexistente → 200 con zeros/`null`.
- [x] `test_api.py`: compare con ambos días → deltas; día faltante → `null`.
- [x] `test_api.py`: ranking excluye denom 0 y ordena desc.
- [x] `test_api.py`: metrics y patterns incluyen `campaign`.
- [x] Ejecutar `pytest` completo (001+002+003) y dejar en verde.
- [x] Re-ingesta con `main.py` (archivo actual queda `"Sin Campaña"` hasta renombrarlo a `35_01-09.xls`).
