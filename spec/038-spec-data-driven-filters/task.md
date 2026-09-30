# Task 38: Campañas y fechas desde los datos

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Backend
- [x] `campaigns_repo.list_campaigns` (orden numérico, `dates`, sin `1970-01-01`).
- [x] `GET /api/campaigns` en `routers/campaigns.py`.
- [x] 3 tests en `test_api.py` (pytest 167).

## 3. Frontend — datos
- [x] `CampaignCatalogEntry`, `fetchCampaigns`, `useCampaigns`.
- [x] `lib/weeks.ts` calculado (`buildWeekOptions`, `defaultWeek`, `findWeekByStart`) + 4 tests.
- [x] `lib/catalog.ts` (defaults de los 4 modos) + 4 tests.

## 4. Frontend — UI
- [x] `CampaignSelect` en las 4 barras de filtros.
- [x] `FilterCrossCampaignBar` con Desde/Hasta; `FilterWeekBar` con semanas por campaña.
- [x] Modos con estado inicial desde el catálogo; `defaults.ts` sin fechas ni campañas.
- [x] `App.tsx`: cargando / error / vacío + 2 tests.
- [x] Ajuste de tests existentes (mock `useCampaigns`, selects, fechas del modo comparar).

## 5. Verificación y cierre
- [x] `/cerrar-spec 038`: pytest 167 · npm test 216 · tsc · lint · build · baseline OK.
- [x] Sin fechas/campañas fijas en `modes/` y `lib/weeks.ts` (grep).
- [x] `GET /api/campaigns` real: 35, 38, 91, 92 con 11 días.
- [x] Revisión visual en Chrome de los 4 modos (criterios de la spec).
- [x] Commit de cierre en español.
- [x] Marcar items `[x]`.
