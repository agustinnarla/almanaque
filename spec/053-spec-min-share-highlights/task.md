# Tareas — Spec 053

## 1. Docs
- [x] Rama `fix/053-min-share-highlights`
- [x] spec.md, plan.md, task.md

## 2. Lógica
- [x] `HIGHLIGHT_MIN_SHARE` + filtro en los 4 builders

## 3. Verificación y cierre
- [x] Tests con valores reales (35: IPLAN 7,80% · 91: SPX_GSM19_GW19_4G peor, GW35 mejor · hora < 1% excluida)
- [x] `/cerrar-spec 053` en verde (pytest 212 · 98,01% · vitest 345 · líneas 96,44% / ramas 82,17% · tsc · lint 0/0 · build · baseline)
- [ ] PR con CI en verde y squash merge
