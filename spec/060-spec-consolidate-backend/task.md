# Tareas — Spec 060

## 1. Docs
- [x] Rama `refactor/060-consolidate-backend`
- [x] spec.md, plan.md, task.md
- [x] Foto de referencia antes del cambio (194 respuestas, todas 200)

## 2. Refactor
- [x] Sin funciones por día; Comparar 2 días con los helpers de rango
- [x] `_rate` con dos parámetros
- [x] `init_db` una sola vez por proceso

## 3. Verificación y cierre
- [x] Test de inicialización única (+ casos borde de `_rate`, `_fraction`, `compute_deltas` y migración sin `device`)
- [x] Foto de referencia idéntica: 194/194 respuestas byte por byte
- [x] `/cerrar-spec 060` en verde (pytest 224 · 98,98% · vitest 407 · tsc · lint 0/0 · build · baseline); `campaigns_repo.py` 1.245 → 1.079 líneas
- [x] PR #13 con CI en verde (Backend 33s · Frontend 1m2s · Título 7s) y squash merge
