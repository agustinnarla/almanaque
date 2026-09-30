# Plan de implementación — Spec 038

## Contexto
- Defaults fijos en `frontend/src/modes/defaults.ts` (`DEFAULT_FILTERS`, `DEFAULT_RANGE`, `DEFAULT_CROSS`, `DEFAULT_WEEK_RANGE`, `CROSS_START_DATE`, `CROSS_END_DATE`) usados por `modes/RangeMode.tsx`, `modes/CompareMode.tsx`, `modes/CampaignsCompareMode.tsx`.
- `lib/weeks.ts`: `WEEK_OPTIONS` (3 semanas a mano), `DEFAULT_WEEK`, `findWeekByStart(start)`; lo usan `FilterWeekBar.tsx:4,21,54` y `RangeMode` (cabecera de semana).
- Campaña como `<input type="text">` en `FilterRangeBar.tsx:34`, `FilterWeekBar.tsx:38`, `FilterBar.tsx:37`, `FilterCrossCampaignBar.tsx:43,53`; «Rango fijo» en `FilterCrossCampaignBar.tsx:75`.
- Backend: `routers/campaigns.py` (prefijo `/api/campaigns`) no tiene listado; tests de API con `TestClient` + DB `:memory:` (`test_api.py:11-49`, `seed_metrics`).
- Tests de `App` mockean hooks por ruta: se agrega el mock de `useCampaigns`.

## Pasos
1. **Docs** `spec/038-spec-data-driven-filters/{spec,plan,task}.md`.
2. **Backend** (RF1): `campaigns_repo.list_campaigns` + `@router.get("")` en `routers/campaigns.py`; 3 tests en `test_api.py`.
3. **Tipos / API / hook**: `CampaignCatalogEntry` en `types/api.ts`; `fetchCampaigns` en `api/campaigns.ts`; `hooks/useCampaigns.ts` sobre `useApiResource`.
4. **Lógica pura**:
   - `lib/weeks.ts` → `buildWeekOptions`, `defaultWeek`, `findWeekByStart(weeks, start)`, `WORKING_DAYS_PER_WEEK`.
   - `lib/catalog.ts` → `campaignEntry`, `catalogBounds`, `defaultRangeValues`, `defaultCompareValues`, `defaultCrossValues`, `defaultWeekValues`.
   - Tests `weeks.test.ts` (4) y `catalog.test.ts` (4).
5. **Componentes**: `CampaignSelect.tsx`; las 4 barras reciben `catalog`; `FilterCrossCampaignBar` suma Desde/Hasta; `FilterWeekBar` calcula semanas por campaña.
6. **Modos**: reciben `catalog`, estado inicial con `useState(() => default…(catalog))`; `RangeMode` calcula las semanas de la campaña; `CampaignsCompareMode` usa `cross.from/to`; `defaults.ts` queda con `DEFAULT_MIN_CALLS` y `RANKING_LIMIT`.
7. **App.tsx** (RF6): `useCampaigns` + estados cargando/error/vacío; modos montados solo con catálogo.
8. **Ajuste de tests existentes** (RF8) + 2 tests nuevos en `ModeTabs.test.tsx`.
9. **Verificación**:
   - `/cerrar-spec 038` (pytest 167 · npm test 216 · tsc · lint · build · baseline).
   - `grep` sin fechas fijas.
   - `curl /api/campaigns` real.
   - Revisión visual en Chrome de los 4 modos.
   - Commit.
