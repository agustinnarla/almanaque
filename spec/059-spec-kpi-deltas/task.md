# Tareas — Spec 059

## 1. Docs
- [x] Rama `feat/059-kpi-deltas`
- [x] spec.md, plan.md, task.md

## 2. Lógica
- [x] `previousRange`, `kpiDeltas` y `usePreviousSummary`

## 3. Interfaz
- [x] `StatCard` (neutral, título del delta, mini línea) y `Sparkline`
- [x] `OverviewKpis` con variaciones y nota sin datos; uso en `RangeMode`
- [x] Regla en el modal de metodología

## 4. Verificación y cierre
- [x] Tests vitest
- [x] Smoke con la API real (35 · S39 vs S38): AA 6,85% → 10,08% (+3,23 pp); llamadas 13.517 → 9.451 (−30,08%); todo septiembre → agosto sin datos (nota)
- [x] `/cerrar-spec 059` en verde (pytest 219 · vitest 407 · líneas 97,09% / ramas 83,9% · tsc · lint 0/0 · build · baseline)
- [ ] PR con CI en verde y squash merge
