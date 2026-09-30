# Task 13: Serie diaria de Agent Answer (endpoint /daily)

## 1. Docs
- [x] Escribir `spec.md` (RF1–RF4, contrato, criterios).
- [x] Escribir `plan.md`.
- [x] Escribir `task.md` (este archivo).

## 2. Backend — repo
- [x] `campaigns_repo.get_daily_trend`: `GROUP BY fecha` + `_rate`, orden asc.

## 3. Backend — router
- [x] `routers/campaigns.py`: `GET /{campaign_name}/daily` con `start_date` / `end_date`.

## 4. Backend — tests
- [x] Contrato exacto + orden asc + rates seed (01 → 38/290, 02 → 50/100).
- [x] `start=end` → 1 fila.
- [x] Rango vacío → `[]`.
- [x] Campaña inexistente → `[]`.
- [x] Fecha inválida → 422.

## 5. Verificación y cierre
- [x] `pytest -q` en verde (**128 passed**: 123 existentes + 5 nuevos).
- [x] Smoke campaña 35: daily 01 = **0.0576**, 02 = **0.0441** (idéntico a summary por día).
- [x] `/data` mtime intacto (1790080283 / 1790080255).
- [x] Marcar items `[x]`.
