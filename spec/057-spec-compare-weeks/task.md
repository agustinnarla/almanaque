# Tareas — Spec 057

## 1. Docs
- [x] Rama `feat/057-compare-weeks`
- [x] spec.md, plan.md, task.md

## 2. Backend
- [x] Rango B opcional en `compare-campaigns` (+ diagnóstico y recomendaciones)
- [x] Tests pytest

## 3. Frontend
- [x] API y hooks con `startDateB` / `endDateB`
- [x] `defaultWeekPair`, `mergeDailyByWeekday`, `weekdayCompareRows`, aviso de semanas desparejas
- [x] `FilterWeeksCompareBar`, `WeekdayCompareChart`, `WeeksCompareMode` y pestaña
- [x] Tests vitest

## 4. Verificación y cierre
- [x] Smoke con la API real (35 · S38 vs S39): S38 13.517 llamadas, AA 6,85% · S39 9.451, AA 10,08% (+3,23 pp), iguales a /summary de cada semana
- [x] `/cerrar-spec 057` en verde (pytest 217 · 98,03% · vitest 381 · líneas 96,94% / ramas 83,7% · tsc · lint 0/0 · build · baseline); piso de sentencias → 96
- [x] PR #10 con CI en verde (Backend 31s · Frontend 1m0s · Título 3s) y squash merge
