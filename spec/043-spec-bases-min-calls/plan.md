# Plan de implementación — Spec 043

## Contexto
- `campaigns_repo.get_ranking` ordena por AA desc, sin volumen mínimo; `routers/campaigns.py` `bases-ranking` no tiene `min_calls`.
- Front: `api/rangeExtras.fetchBasesRanking`, `hooks/useRangeRankings`, `components/overview/BasesRankingTable`, `lib/rankings.mergeBaseRankings`/`compareRows`, `components/overview/CrossRankingTable`, `lib/exporters.basesRankingRows`.

## Pasos
1. **Docs.**
2. **Backend**: `get_ranking(..., min_calls)` con `ranked` y el nuevo orden; endpoint con `min_calls`; tests.
3. **Front — datos**: `ranked?` en `BaseRankingRow`/`CrossRankingRow`; `fetchBasesRanking` con `minCalls`; merge y orden por `ranked`.
4. **Front — UI**: separador y filas grises en `BasesRankingTable`; atenuado en `CrossRankingTable`; subtítulo; CSV.
5. **Tests.**
6. **Verificación**:
   - `/cerrar-spec 043`.
   - Smoke de la 91 con 50 y con 200.
   - Chrome.
   - Commit + push.
