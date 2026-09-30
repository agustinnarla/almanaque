# Task 02: Implementación de API y Detección de Patrones

## Preparación
- [x] Instalar dependencias de la API en el venv (`pip install fastapi uvicorn pydantic httpx`).

## Módulo: Configuración (`backend/config.py`)
- [x] Crear archivo con constantes globales.
- [x] Definir `AGENT_ANSWER_THRESHOLD = 0.15`.

## Ajuste: Inyección de DB (`backend/db_manager.py`)
- [x] Mantener `get_connection(db_path)` parametrizable (ya existe).
- [x] Agregar dependency FastAPI `get_db_connection` que abra `DEFAULT_DB_PATH`, ejecute `init_db` y cierre al final (o reutilice dependiendo del patrón de cierre simple).
- [x] Asegurar que los tests puedan hacer `app.dependency_overrides[get_db_connection] = <conexión :memory:>`.

## Módulo: Repositorio (`backend/repositories/metrics_repo.py`)
- [x] Función `fetch_metrics(conn, start_date, end_date) -> list[dict]`.
- [x] `SELECT` de `daily_campaign_metrics` donde `fecha` entre `start_date` y `end_date` (inclusive), ordenado por `fecha`, `base`.
- [x] Retornar lista de diccionarios con claves del contrato JSON; `[]` si no hay filas.

## Módulo: Servicio de Patrones (`backend/services/pattern_detector.py`)
- [x] Función `evaluate_campaigns(rows: list[dict]) -> list[dict]`.
- [x] Para cada fila: `denominator = total_calls - machine_answers`; **si `denominator <= 0` → excluir** de la salida.
- [x] `agent_answer_rate = agent_answers / denominator` (float 0–1).
- [x] Incluir solo si `agent_answer_rate < AGENT_ANSWER_THRESHOLD`, con campos `fecha`, `base`, `agent_answer_rate`, `pattern_alert: True`.

## Módulo: Controladores (`backend/routers/metrics.py`, `backend/routers/patterns.py`)
- [x] Ambos routers: parámetros de query `start_date: date`, `end_date: date` (inválidos → 422 de FastAPI).
- [x] `GET /api/metrics`: dependency de conexión → `fetch_metrics` → JSON array.
- [x] `GET /api/patterns`: mismo fetch → `evaluate_campaigns` → JSON array.

## Módulo: Orquestador (`backend/main_api.py`)
- [x] `app = FastAPI()`.
- [x] CORS middleware permitiendo `http://localhost:5173` y `http://localhost:3000`.
- [x] `include_router` de metrics y patterns.
- [x] Documentar arranque: `uvicorn main_api:app --app-dir backend --reload` (desde la raíz del proyecto).

## Testing (`backend/test_api.py`)
- [x] Fixture: app + `TestClient` + DB `:memory:` con `init_db` y seed controlado; limpiar overrides al final.
- [x] RF4: `GET /api/metrics` rango vacío → 200 y `[]`.
- [x] RF5: rango con una de dos fechas → solo esa; `start_date=invalido` → 422.
- [x] Unit `pattern_detector`: 10% alerta; 20% no alerta; denominador 0 excluida.
- [x] HTTP `GET /api/patterns`: solo campañas-día bajo umbral con `pattern_alert == true` y `agent_answer_rate` float.
- [x] Ejecutar `pytest` completo (Spec 01 + 02) y dejar en verde.
