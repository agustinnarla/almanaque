# Tareas — Spec 046

## 1. Docs
- [x] spec.md, plan.md, task.md

## 2. Backend
- [x] `volume` en `GET /api/campaigns/{c}/routing`
- [x] Test del endpoint con días bajo el mínimo

## 3. Frontend
- [x] Tipos y `useRoutingChanges` con `volume`
- [x] `buildTrunkVolume` + `TRUNK_COLORS` + `trunkVolumeRows`
- [x] `TrunkVolumeChart` en Campaña completa / Por semana
- [x] Tests vitest

## 4. Verificación y cierre
- [x] `/cerrar-spec 046` en verde (pytest 182 · vitest 254 · tsc · lint 0/0 · build · baseline)
- [x] Smoke real campaña 35 01→30/09 (IPLAN 40.755, GW37, GW20, GW39, IPLAN2 + Otras 635; 100% IPLAN desde el 09/09)
- [ ] Revisión en Chrome (pendiente: queda para la spec de diseño)
- [x] Commit en español + push
