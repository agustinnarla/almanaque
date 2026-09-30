# Plan 11: Redefinición de Agent Answer + Recalibración

## 1. Bug fix y fórmula (`backend/metrics_engine.py`)
*   Agregar `AGENT_SUBSTATE = "AGENT"`.
*   Precomputar `is_agent = (ESTADO == ANSWER_STATE) & (SUB_ESTADO == AGENT_SUBSTATE)` (con `fillna(False)`).
*   Reemplazar el agregado roto `"ESTADO" + "SUB_ESTADO"` por suma de la máscara `is_agent` (columna auxiliar en `working` o lambda sobre frame completo).
*   `is_human_connected = is_agent & is_connected` (wait solo AGENT).
*   `machine_answers`, `busy_calls`, `congestion_calls` sin cambio.

## 2. Normalización (`backend/data_cleaner.py`)
*   Tras `cleaned["ESTADO"] = ...str.upper()`, aplicar lo mismo a `SUB_ESTADO`: `.str.upper().str.strip()` (hoy solo `astype("string")`).

## 3. Umbrales (`backend/config.py`)
*   `AGENT_ANSWER_THRESHOLD = 0.06`
*   `DIAG_PEAK_THRESHOLD = 0.075`
*   `DIAG_BASE_DROP_THRESHOLD = -0.015`
*   `DIAG_BASE_DROP_WARNING = -0.0075`
*   `DIAG_BASE_IMPROVEMENT_SUCCESS = 0.015`
*   `DIAG_BASE_IMPROVEMENT_WARNING = 0.0075`

## 4. Tests backend
*   `test_processor.py`:
    *   Fixtures que simulan humana → `SUB_ESTADO = "AGENT"` (donde antes era `None` y contaba como agent).
    *   Casos nuevos: `QUEUED` y vacío **no** cuentan en `agent_answers` ni en wait; `AGENT` sí.
    *   Verificar que los 8 tests fallidos pasan.
*   Revisar `test_api.py`, `test_diagnostics.py`, `test_health.py`, `test_recommendations.py`, `test_db.py` si fallan por fixtures o aserciones de rate.
*   No cambiar tests que solo inyectan rates sintéticos en engines puros.

## 5. Frontend
*   `healthStyle.ts`: cortes `>= 0`, `>= -25`, si no Crítico.
*   `Badge.test.tsx`: actualizar aserciones (−15.77 → Aceptable; añadir −26.8 → Crítico; −10 sigue Aceptable; −25.01 → Crítico).

## 6. Verificación y re-ingesta
*   `.venv/Scripts/python -m pytest -q` → 0 failed.
*   `cd frontend && npm test && npx tsc -b && npm run lint && npm run build`.
*   Re-ingesta: `.venv/Scripts/python backend/main.py` (usa `replace_day` sobre `/data`).
*   Smoke: AA campaign 35 día 01 ≈ 0.0704, día 02 ≈ 0.0548; ≥1 `peak_hours` en `GET .../diagnostics`; `GET /api/patterns` solo bajo 0.06.
*   Confirmar mtime de `/data` intacto.
*   Actualizar `task.md` `[x]`.
