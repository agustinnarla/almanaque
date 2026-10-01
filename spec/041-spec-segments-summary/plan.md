# Plan de implementación — Spec 041

## Contexto
- `campaigns_repo.list_campaigns` arma el catálogo; `config.py` concentra las constantes de negocio.
- `CampaignSelect.tsx` lista las opciones planas; `FilterCrossCampaignBar.tsx` usa el mismo catálogo para A y B.
- `lib/catalog.ts: defaultCrossValues` elige B = `catalog[1]`.
- Los modos ya tienen todo lo que el resumen necesita:
  - `RangeMode`: `overview.summary`, `rangeDiag`, `recommendations.data`.
  - `CompareMode`: `data.summary`, `data.root_causes`, `data.positive_drivers`, recomendaciones.
  - `CampaignsCompareMode`: `data.summary`, `crossNegatives`, `crossPositives`, recomendaciones.

## Pasos
1. **Docs** `spec/041-spec-segments-summary/{spec,plan,task}.md`.
2. **Backend**: `CAMPAIGN_SEGMENTS`/`DEFAULT_SEGMENT`; `segment` en `list_campaigns`; tests.
3. **Datos front**:
   - `segment` en `CampaignCatalogEntry` y en las fixtures.
   - `catalog.ts`: `segmentOf`, `segmentPeers`, `sameSegment`, y `defaultCrossValues` por segmento.
4. **Selectores**: `CampaignSelect` con `<optgroup>`; `FilterCrossCampaignBar` con B restringido y reajuste al cambiar A.
5. **Resumen**:
   - `lib/executiveSummary.ts` (3 builders + `firstSentence`).
   - `hooks/useSegmentPeers.ts`.
   - `components/Insights/ExecutiveSummary.tsx`.
   - Integración en los 3 archivos de modo + enlace «Resumen» en el índice.
   - Segmento en la línea de contexto.
6. **Tests** nuevos y ajustes.
7. **Verificación**:
   - `/cerrar-spec 041`.
   - Chrome con la 35 y la 91, y Comparar campañas con A = 91.
   - Commit + push.
