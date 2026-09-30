# Task 11: Redefinición de Agent Answer + Recalibración

## 1. Spec
- [x] Escribir `spec.md` (RF1–RF7, specs superadas, criterios).
- [x] Escribir `plan.md` (6 secciones).
- [x] Escribir `task.md` (este archivo).

## 2. Backend — bug + fórmula
- [x] `metrics_engine.py`: fix `"ESTADO"+"SUB_ESTADO"` → máscara `is_agent`.
- [x] `metrics_engine.py`: `AGENT_SUBSTATE` + wait = `is_agent & is_connected`.
- [x] `data_cleaner.py`: normalizar `SUB_ESTADO` upper+strip.

## 3. Backend — umbrales
- [x] `config.py`: 6 constantes de RF5.

## 4. Backend — tests
- [x] `test_processor.py`: fixtures `SUB="AGENT"` donde simula humana; casos QUEUED/vacío.
- [x] Ajustar otros `test_*.py` (patterns seed, diagnostics umbrales, health score fixture).
- [x] `pytest -q` → 0 failed (**122 passed**).

## 5. Frontend
- [x] `healthStyle.ts` bandas ≥0 / ≥−25 / <−25.
- [x] `Badge.test.tsx` actualizado.
- [x] `npm test` (20) + `npx tsc -b` + `npm run lint` + `npm run build` en verde.

## 6. Re-ingesta y smoke
- [x] `python backend/main.py` → 2/2 archivos, sin KeyError; `/data` mtime intacto.
- [x] Smoke campaña 35: AA 01 = **0.0704**, AA 02 = **0.0548**; `peak_hours` = **4** (horas 9–12); `patterns` solo rates < 0.06; health GW39 −7.76 Aceptable, GW20 −26.8 Crítico.
- [x] Marcar items `[x]`.
