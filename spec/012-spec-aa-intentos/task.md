# Task 12: Agent Answer sobre intentos totales

## 1. Docs
- [x] Escribir `spec.md` (RF1–RF6, specs superadas, criterios).
- [x] Escribir `plan.md`.
- [x] Escribir `task.md` (este archivo).

## 2. Backend — config
- [x] `config.py`: 6 umbrales RF4 (0.05, 0.06, −0.012, −0.006, 0.012, 0.006).

## 3. Backend — fórmula
- [x] `campaigns_repo._rate`: denominador `total_calls`.
- [x] `pattern_detector`: denominador `total_calls`.

## 4. Backend — tests
- [x] Ajustar expectativas de rates en `test_api.py` (summary, hourly, devices, health, patterns, ranking, peak).
- [x] Fixture `_device` en `test_recommendations.py` (denom = total_calls).
- [x] Tests de patterns con denom total / total=0.
- [x] `test_diagnostics.py`: umbrales de base drop/improvement actualizados.

## 5. Verificación y cierre
- [x] `pytest -q` en verde (123).
- [x] Smoke campaign 35: AA 01 = **0.0576**, 02 = **0.0441**; peak_hours 9–12 (≥0.06); patterns solo rates < 0.05; recommendations 5 tipos (PACING GW20, AMD GW20 único, VOLUME_DELTA, ROUTING GW39, SCHEDULE 12).
- [x] Frontend suite en verde: vitest 20, tsc, lint, build.
- [x] `/data` mtime intacto (1790080283 / 1790080255).
- [x] Marcar items `[x]`.
