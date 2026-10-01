# Task 41: Segmentos de negocio y resumen ejecutivo

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Backend
- [x] `CAMPAIGN_SEGMENTS` / `DEFAULT_SEGMENT` en `config.py`; `segment` en `/api/campaigns`.
- [x] Tests del catálogo con `segment` (+1).

## 3. Segmentos en el front
- [x] `segment` en el tipo y las fixtures; helpers de segmento en `catalog.ts`; `defaultCrossValues` por segmento.
- [x] `CampaignSelect` agrupado; Campaña B restringida al segmento de A.
- [x] Segmento en la línea de contexto del rango.

## 4. Resumen ejecutivo
- [x] `lib/executiveSummary.ts` + `useSegmentPeers` + `ExecutiveSummary`.
- [x] Integrado en los 4 modos + enlace «Resumen» en el índice.

## 5. Tests y verificación
- [x] Tests nuevos y ajustes de fixtures/índice.
- [x] `/cerrar-spec 041` en verde.
- [x] Chrome: selectores agrupados, A = 91 → B solo 92, resumen 35 y 91 con los valores esperados, consola sin errores.
- [x] Commit de cierre en español + push.
- [x] Marcar items `[x]`.
