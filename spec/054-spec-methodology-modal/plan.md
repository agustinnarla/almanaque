# Plan de implementación — Spec 054

## Contexto
- Umbrales del backend: `backend/config.py`. Los del frontend: `frontend/src/lib/rangeThresholds.ts`. Etiquetas del health: `frontend/src/components/common/healthStyle.ts:18-29`, con `0` y `-25` escritos a mano.
- Encabezado: `frontend/src/App.tsx` (título + `ThemeToggle`).
- Routers: `backend/routers/` (`campaigns`, `metrics`, `patterns`).

## Pasos
1. **Rama** `feat/054-methodology-modal` + docs.
2. **Backend** `routers/methodology.py` con `GET /api/methodology`, registrado en `main_api.py`; test.
3. **Frontend**
   - `healthStyle.ts`: constantes `HEALTH_HEALTHY_MIN` y `HEALTH_ACCEPTABLE_MIN`.
   - Tipo `Methodology`, `api/methodology.ts` y `hooks/useMethodology.ts` (pide al abrir).
   - `components/methodology/MethodologyModal.tsx`: diálogo, pestañas y secciones.
   - `MethodologyButton.tsx` en el encabezado.
4. **Tests** pytest y vitest.
5. **Verificación** `/cerrar-spec 054` → PR → CI → squash merge.
