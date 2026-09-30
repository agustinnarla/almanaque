# Plan 02: Arquitectura de la API y Detección de Patrones

## 1. Módulos del Sistema (Backend)

*   **`main_api` (`backend/main_api.py`)**: App FastAPI, CORS, `include_router` de los dos endpoints. *(RF3)*.
*   **`config` (`backend/config.py`)**: `AGENT_ANSWER_THRESHOLD = 0.15`. *(RF2)*.
*   **`routers/metrics.py` y `routers/patterns.py`**: Controladores; reciben `start_date`/`end_date` como `date`, consultan el repo/devuelven JSON. *(RF3, RF5)*.
*   **`services/pattern_detector.py`**: Lógica pura: tasa float 0–1, exclusión de denominador 0, filtro por umbral. *(RF1, RF2)*.
*   **`repositories/metrics_repo.py`**: SELECT por rango sobre `daily_campaign_metrics`, granularidad día+campaña; `[]` si no hay filas. *(RF4, RF5)*.
*   **`db_manager` (Spec 01, ajustado)**: `get_connection` ya acepta ruta; se agrega **dependency FastAPI** `get_db_connection` sobreridable en tests con `:memory:`.

## 2. Contrato de Datos (Endpoints)

Ver `spec.md` → Contrato JSON. Resumen:

| Endpoint | Granularidad | Campos clave |
|---|---|---|
| `GET /api/metrics` | `fecha` + `base` | `total_calls`, `agent_answers`, `machine_answers`, `avg_wait_time_sec`, `avg_abandon_time_sec` |
| `GET /api/patterns` | `fecha` + `base` (solo alertas) | `agent_answer_rate` (float 0–1), `pattern_alert` |

## 3. Decisiones Técnicas Justificadas

*   **Decisión A: FastAPI (stack aprobado).** Validación nativa con Pydantic (`date` → 422 automático) y Swagger. *Descartado Flask:* requiere libs extra para validación estricta.
*   **Decisión B: Umbral en `config.py`.** Un solo número (`0.15`) sin tocar algoritmos. *Descartado env var:* sin despliegues múltiples, complejidad innecesaria. *Descartado hardcodear* dentro del detector.
*   **Decisión C: Granularidad diaria (no agregado por rango).** Cada fila de `daily_campaign_metrics` ya es un promedio correcto del día; no se promedian promedios entre días. La tasa se calcula **fila a fila**. El agregado multi-día queda fuera de alcance (el frontend puede sumar contadores si lo necesita).
*   **Decisión D: Exclusión de denominador 0 en el detector, no como rate 0%.** Evita falsos positivos de "mal rendimiento" cuando no hubo intentos humanos.
*   **Decisión E: Inyección de DB por dependency de FastAPI.** `Depends(get_db_connection)`; en tests se override con `:memory:` + `init_db` + seed, sin tocar `callcenter_metrics.db` real.

## 4. Estrategia de Tests (Testing)

`pytest` + `fastapi.testclient.TestClient`; DB `:memory:` por inyección; nunca `/data`.

*   **RF4:** `GET /api/metrics` rango sin datos → 200 y `[]`.
*   **RF5:** seed de 2 fechas; rango que incluye solo una → solo esa fila; parámetro fecha inválido → 422.
*   **RF1/RF2 unitario (`pattern_detector`):** rate 0.10 → alerta; 0.20 → no; denominador 0 → excluida de la lista.
*   **RF2/RF3 HTTP:** `GET /api/patterns` con seed que mezcla bajo/umbral/sin intentos → solo la campaña-día bajo umbral, con `pattern_alert: true` y rate float 0–1.
*   **Regresión Spec 01:** los tests existentes de ingesta deben seguir en verde.
