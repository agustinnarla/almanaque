# Plan de implementación — Spec 053

## Contexto
- `frontend/src/lib/rangeDiagnostics.ts`: `buildBestHour` (:186), `buildBestDevice` (:221), `buildWorstHour` (:256) y `buildWorstDevice` (:291) filtran solo con `total_calls ≥ 50`.
- Se usan en `mapRangeDiagnostics` (:373-383), que sirve a Campaña completa y Por semana, y en `modes/CampaignsCompareMode.tsx:146-162`.

## Pasos
1. **Rama** `fix/053-min-share-highlights` + docs.
2. **Constante** `HIGHLIGHT_MIN_SHARE = 0.01` en `rangeThresholds.ts`.
3. **Filtro común** `meetsMinShare(rows)` en `rangeDiagnostics.ts`, aplicado en los 4 builders.
4. **Tests** con valores reales (35, 91) y una hora bajo el 1%.
5. **Verificación** `/cerrar-spec 053` → PR → CI → squash merge.
