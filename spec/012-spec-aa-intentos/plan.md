# Plan 12: Agent Answer sobre intentos totales

## 1. Configuración (`backend/config.py`)
*   RF4: los 6 umbrales de la tabla de la spec (0.05, 0.06, −0.012, −0.006, 0.012, 0.006).
*   Resto de constantes intactas.

## 2. Repositorio (`backend/repositories/campaigns_repo.py`)
*   `_rate(agent_answers, total_calls, machine_answers)`:
    *   `denominator = total_calls` (ignorar `machine_answers` en la división; se puede dejar el parámetro o limpiar call sites).
    *   `denominator <= 0` → `None`.
*   Todos los call sites de `_rate` ya pasan `total`; no cambian firmas si se ignora el 3er arg.

## 3. Patrones (`backend/services/pattern_detector.py`)
*   `denominator = int(row["total_calls"])`; `<= 0` → skip; `rate = agents / denominator`.

## 4. Frontend
*   Sin cambios de código (bandas health iguales; gráficos usan el campo del API).

## 5. Tests backend
*   `test_api.py`: seeds/rates — recalcular expectativas con denom = total (ej. `38/290` → `38/290` si machines=0 en seed; si machines>0, usar total).
*   `test_recommendations.py`: fixture `_device` → `rate = agent_answers / total_calls`.
*   `test_pattern_detector` / tests de patterns: denom total; caso total=0 excluido.
*   `test_diagnostics` / `test_health`: solo si hardcodean división con machines.

## 6. Docs
*   Escribir `spec/012-spec-aa-intentos/{spec,plan,task}.md`.
*   Task con items `[x]` al cerrar.

## 7. Verificación
*   `.venv/Scripts/python -m pytest -q`
*   Smoke summary + patterns + recommendations campaign 35.
*   `cd frontend && npm test && npx tsc -b && npm run lint && npm run build`
*   `stat` mtime `/data`.

## Flujo
1. Docs Spec 012
2. config → _rate → pattern_detector
3. tests → pytest
4. smoke → frontend suite → task [x]
