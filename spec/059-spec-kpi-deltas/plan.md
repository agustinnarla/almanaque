# Plan de implementación — Spec 059

## Contexto
- `frontend/src/components/overview/OverviewKpis.tsx`: 5 tarjetas sin variación (Spec 051).
- `frontend/src/components/common/StatCard.tsx`: ya soporta `delta`, `deltaSuffix`, `goodWhenNegative` y `deltaLabel` (Comparar 2 días); falta un modo neutro y un espacio para la mini línea.
- `frontend/src/modes/RangeMode.tsx`: `overview.summary` y `overview.daily` ya cargados; `api/overview.ts` tiene `fetchSummary`.

## Pasos
1. **Rama** `feat/059-kpi-deltas` + docs.
2. **Lib** `lib/previousPeriod.ts` (`previousRange`, `kpiDeltas`).
3. **Hook** `usePreviousSummary`.
4. **UI**
   - `StatCard`: `neutral`, `deltaTitle` y `trend`;
   - `components/common/Sparkline.tsx`;
   - `OverviewKpis` con deltas y mini línea;
   - el uso en `RangeMode`;
   - la regla en el modal.
5. **Tests** vitest; mocks del hook en los tests de modos.
6. **Verificación** smoke real · `/cerrar-spec 059` → PR → CI (3/3 en el último commit) → squash merge.
