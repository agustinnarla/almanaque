# Tareas — Spec 050

## 1. Docs
- [x] Rama `feat/050-low-volume-days`
- [x] spec.md, plan.md, task.md

## 2. Lógica
- [x] `lowVolumeDays` + constantes; `mapDailyPoints` con `lowVolume`
- [x] `buildBestDay` excluye los días de poco volumen

## 3. Interfaz
- [x] `RateVolumeChart` con `lowVolumeKey` (barra atenuada, punto hueco, tooltip)
- [x] `DailyTrendChart`: nota y columna «Poco volumen» en la tabla

## 4. Verificación y cierre
- [x] Tests nuevos con los valores reales
- [x] `/cerrar-spec 050` en verde (pytest 203 · 98,04% · vitest 340 · líneas 96,44% / ramas 82,23% · tsc · lint 0/0 · build · baseline); pisos vitest → 95/82/96/96
- [ ] PR con CI en verde y squash merge
