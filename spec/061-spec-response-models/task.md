# Tareas — Spec 061

## 1. Docs
- [x] Rama `refactor/061-response-models`
- [x] spec.md, plan.md, task.md

## 2. Contrato
- [x] `backend/schemas.py` a partir del inventario de 194 respuestas reales
- [x] `response_model` en las 21 rutas (`exclude_unset` en recomendaciones)

## 3. Verificación y cierre
- [x] Tests de contrato (incluido que el test falla sin modelos)
- [x] Foto de referencia idéntica: 194/194
- [x] `/cerrar-spec 061` en verde (pytest 228 · 99,02% · vitest 407 · tsc · lint 0/0 · build · baseline); piso del backend → 99
- [ ] PR con CI en verde y squash merge
