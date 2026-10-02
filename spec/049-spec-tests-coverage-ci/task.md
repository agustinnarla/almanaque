# Tareas — Spec 049

## 1. Docs
- [x] Rama `ci/049-tests-coverage`
- [x] spec.md, plan.md, task.md

## 2. Cobertura
- [x] `@vitest/coverage-v8` + `pytest-cov` (versiones fijas)
- [x] Config de cobertura (vite + `.coveragerc`) y `.gitignore`

## 3. Tests nuevos
- [x] Frontend: api, hooks, `ChartTooltip`, recarga y error en los modos
- [x] Backend: migraciones, `get_db_connection`, `replace_day`, scanner, errores del pipeline
- [x] Umbrales en el piso alcanzado (vitest 95/81/95/96; pytest 98)

## 4. CI y flujo
- [x] `.github/workflows/ci.yml` (backend, frontend, título del PR)
- [x] `run_checks.py` con cobertura; `/cerrar-spec` espera al CI; docs

## 5. Verificación y cierre
- [x] `/cerrar-spec 049` en verde (pytest 203 · cobertura 98,04% · vitest 328 · cobertura líneas 96,24% / ramas 81,92% · tsc · lint 0/0 · build · baseline)
- [x] PR #2 con CI en verde (Backend 31s · Frontend 1m35s · Título del PR 6s) y squash merge
