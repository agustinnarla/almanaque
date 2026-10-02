# Plan de implementación — Spec 052

## Contexto
- `backend/main.py:44` `run_pipeline`: escanea, lee `FECHA` de **todos** los archivos (`_read_dates`), agrupa por `(campaña, fecha)` y hace `replace_day` por grupo.
- `backend/db_manager.py:36` `init_db`: crea `daily_campaign_metrics` y corre migraciones.
- `backend/main.py:95` `__main__`: `data_dir` y `db_path` posicionales.
- Skill `/ingesta` y README: «procesa todos los archivos cada vez».

## Pasos
1. **Rama** `feat/052-incremental-ingestion` + docs.
2. **DB** `db_manager.py`: `CREATE TABLE IF NOT EXISTS ingested_files` en `init_db`; `load_ingested_files`, `record_ingested_file`, `forget_ingested_file`.
3. **Pipeline** `main.py`: firma (size, mtime_ns), clasificación nuevo/modificado/eliminado/sin cambios, días afectados, recarga por día con todos sus archivos, registro y avisos; `--full` con argparse.
4. **Tests** `backend/test_pipeline_incremental.py`.
5. **Docs** README (Ingesta) y `.claude/skills/ingesta/SKILL.md`.
6. **Verificación** corrida real sobre una copia de la DB en el scratchpad · `/cerrar-spec 052` → PR → CI → squash merge.
