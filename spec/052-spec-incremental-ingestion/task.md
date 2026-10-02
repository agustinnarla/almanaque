# Tareas — Spec 052

## 1. Docs
- [x] Rama `feat/052-incremental-ingestion`
- [x] spec.md, plan.md, task.md

## 2. Backend
- [x] Tabla `ingested_files` y helpers en `db_manager.py`
- [x] `run_pipeline` incremental + `--full`
- [x] Tests `test_pipeline_incremental.py`

## 3. Docs
- [x] README y skill `/ingesta`

## 4. Verificación y cierre
- [x] Corrida real sobre una copia de la DB: 104/104 archivos, 88 días; 2.ª corrida «al día» en 0,86 s. Totales iguales salvo 38·01/09 (−1), 91·03/09 (−2) y 92·03/09 (−10): llamadas repetidas que la base real arrastra de antes de la Spec 045; la copia es la correcta.
- [x] `/cerrar-spec 052` en verde (pytest 212 · 98,01% · vitest 341 · tsc · lint 0/0 · build · baseline)
- [x] PR #5 con CI en verde (Backend 25s · Frontend 59s · Título 5s) y squash merge
