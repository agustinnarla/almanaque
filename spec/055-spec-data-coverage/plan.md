# Plan de implementación — Spec 055

## Contexto
- `GET /api/campaigns` ya devuelve `first_day`, `last_day`, `days` y `dates` por campaña (`frontend/src/types/api.ts:232`).
- `frontend/src/App.tsx`: encabezado + `ModeTabs`; el catálogo llega a los 3 modos.
- `frontend/src/modes/RangeMode.tsx:211`: línea de contexto con el badge «Parcial» (Spec 039).
- `frontend/src/modes/CampaignsCompareMode.tsx:218`: línea de contexto de la comparación.
- `frontend/src/lib/dates.ts`: `formatDayLabel` (DD/MM).

## Pasos
1. **Rama** `feat/055-data-coverage` + docs.
2. **Lib** `lib/coverage.ts`: `businessDays`, `buildCoverage`, `rangeMissingDays` y `coverageSummary` (texto del aviso).
3. **UI** `components/common/CoverageNotice.tsx` en `App.tsx`; badge en `RangeMode`; aviso en `CampaignsCompareMode`.
4. **Tests** lib, componente y modos.
5. **Verificación** catálogo real · `/cerrar-spec 055` → PR → CI → squash merge.
