# Tareas — Spec 051

## 1. Docs
- [x] Rama `feat/051-attendable-answer-rate`
- [x] spec.md, plan.md, task.md

## 2. Backend
- [x] `_attendable_rate` + campo en `/summary` y `/devices`
- [x] Tests pytest

## 3. Frontend
- [x] Tipos + tarjeta «AA sobre atendibles» (hero de 2 filas + 2×2)
- [x] Columna «AA atend. %» en Gateways del rango
- [x] CSV de KPIs y gateways
- [x] Tests vitest

## 4. Verificación y cierre
- [x] Smoke con la API real: 35 11,42% · 38 8,00% · 91 5,08% · 92 3,78%; IPLAN 15,92% · GW37 7,27% · GW20 4,08% · GW39 6,16% · IPLAN2 4,43%
- [x] `/cerrar-spec 051` en verde (pytest 204 · 98,05% · vitest 341 · líneas 96,44% / ramas 82,24% · tsc · lint 0/0 · build · baseline)
- [x] PR #4 con CI en verde (Backend 32s · Frontend 46s · Título 5s) y squash merge
