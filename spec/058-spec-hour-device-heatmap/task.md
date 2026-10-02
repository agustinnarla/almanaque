# Tareas — Spec 058

## 1. Docs
- [x] Rama `feat/058-hour-device-heatmap`
- [x] spec.md, plan.md, task.md

## 2. Backend
- [x] `GET /api/campaigns/{c}/heatmap` + tests

## 3. Frontend
- [x] `lib/heatmap.ts` + rampa secuencial claro/oscuro
- [x] API, hook y CSV
- [x] `HourDeviceHeatmap` en «Por hora» (selector, leyenda, tooltip, tabla)
- [x] Regla en el modal de metodología
- [x] Tests vitest

## 4. Verificación y cierre
- [x] Smoke con la API real (35): 5 troncales (8 ocultas por < 1%), 4 celdas sin color (IPLAN2 9, 15, 16 y 17 h), IPLAN 9 h AA 14,28%
- [x] `/cerrar-spec 058` en verde (pytest 219 · 98,04% · vitest 393 · líneas 97% / ramas 83,65% · tsc · lint 0/0 · build · baseline); piso de líneas → 97
- [ ] PR con CI en verde y squash merge
