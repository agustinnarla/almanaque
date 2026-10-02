# Plan de implementación — Spec 046

## Contexto
- `backend/routers/campaigns.py:119` `campaign_routing` ya trae las filas `(fecha, device)` con `get_daily_device_rows` (`backend/repositories/campaigns_repo.py:127`) y solo devuelve el resumen del detector.
- `frontend/src/hooks/useRoutingChanges.ts` consume ese endpoint y descarta `days`.
- `frontend/src/lib/chartPalette.ts` tiene 2 slots; los slots 1–5 de la paleta de referencia pasan el validador sobre `#ffffff` (CVD ΔE 9.1, visión normal 19.6; contraste en WARN → leyenda con texto).
- `frontend/src/modes/RangeMode.tsx`, sección `sec-tendencias`: `DailyTrendChart` + tabla de gateways.

## Pasos
1. **Docs** `spec/046-spec-trunk-volume/{spec,plan,task}.md`.
2. **Backend** `routers/campaigns.py` → agrega `volume` a la respuesta (filas ordenadas, sin `machine_answers`).
3. **Tipos/API** `types/api.ts` (`TrunkVolumeRow`, `RoutingResponse.volume`); `useRoutingChanges` devuelve `volume`.
4. **Lib** `lib/trunkVolume.ts` (`buildTrunkVolume`, `TRUNK_CHART_TOP`); `chartPalette.ts` (`TRUNK_COLORS`, `OTHER_TRUNK_COLOR`); `exporters.ts` (`trunkVolumeRows`).
5. **UI** `components/overview/TrunkVolumeChart.tsx` y su uso en `RangeMode.tsx`.
6. **Tests** `backend/test_routing.py`; `lib/__tests__/trunkVolume.test.ts`; `components/overview/__tests__/TrunkVolumeChart.test.tsx`; exporters; mocks de `useRoutingChanges`.
7. **Verificación**: `/cerrar-spec 046` (pytest 182 · npm test · tsc · lint · build · baseline) · smoke real · revisión en Chrome · `task.md` en `[x]`.
