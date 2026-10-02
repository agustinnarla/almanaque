# Tareas — Spec 055

## 1. Docs
- [x] Rama `feat/055-data-coverage`
- [x] spec.md, plan.md, task.md

## 2. Lógica
- [x] `lib/coverage.ts` (`buildCoverage`, `rangeMissingDays`, texto del aviso)

## 3. Interfaz
- [x] `CoverageNotice` en todos los modos
- [x] Badge «Faltan N días» en Campaña completa / Por semana
- [x] Aviso en Comparar campañas

## 4. Verificación y cierre
- [x] Tests (al día, atrasada, hueco, fines de semana, vacío, componentes)
- [x] Catálogo real: «Datos al día: 4 campañas del 01/09 al 30/09 (22 días hábiles).»
- [x] `/cerrar-spec 055` en verde (pytest 214 · 98,02% · vitest 365 · líneas 96,8% / ramas 83,05% · tsc · lint 0/0 · build · baseline); piso de ramas → 83
- [x] PR #8 con CI en verde (Backend 32s · Frontend 54s · Título 4s) y squash merge
