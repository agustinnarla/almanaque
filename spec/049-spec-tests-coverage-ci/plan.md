# Plan de implementación — Spec 049

## Contexto
- `frontend/vite.config.ts:13`: `test` sin `coverage`; `frontend/package.json:11` `"test": "vitest run"`.
- `pytest.ini`: `testpaths = backend`, sin cobertura. `requirements.txt` sin `pytest-cov`.
- `.claude/skills/cerrar-spec/scripts/run_checks.py`: corre `pytest -q` y `npm test`.
- No hay `.github/workflows/`.
- Huecos: `frontend/src/api/*` (0%), `frontend/src/hooks/use*.ts` (0%), `components/charts/ChartTooltip.tsx` (0%); `backend/db_manager.py:46-51,71,100,113-118,128,130`, `backend/main.py:36-37,73-76,83`, `backend/file_scanner.py:10-11`.

## Pasos
1. **Rama** `ci/049-tests-coverage` + docs.
2. **Dependencias** `@vitest/coverage-v8@5.0.1` (dev, exacta) y `pytest-cov==7.1.0`.
3. **Config** `vite.config.ts` (coverage + thresholds), script `test:coverage`, `.coveragerc`, `.gitignore`.
4. **Tests frontend** `src/api/__tests__/`, `src/hooks/__tests__/`, `components/charts/__tests__/ChartTooltip.test.tsx`, recarga y error en los modos.
5. **Tests backend** `backend/test_db.py`, `backend/test_pipeline_multi_file.py`.
6. **Umbrales** medir y fijar el piso.
7. **CI** `.github/workflows/ci.yml` (backend, frontend, título del PR).
8. **Flujo** `run_checks.py` con cobertura; `cerrar-spec` espera al CI; docs.
9. **Verificación** `/cerrar-spec 049` → PR → CI verde → squash merge.
