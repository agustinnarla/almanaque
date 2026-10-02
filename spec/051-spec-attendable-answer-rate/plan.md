# Plan de implementación — Spec 051

## Contexto
- `backend/repositories/campaigns_repo.py:73` `_rate`: denominador `total_calls` (Spec 012).
- `get_summary` (`:98`) arma el resumen con `_row_to_day`; `get_device_metrics` (`:303`) da las filas de gateways del rango.
- `frontend/src/components/overview/OverviewKpis.tsx`: hero + 3 tarjetas; `GatewaysRangeTable.tsx`: Troncal, Intentos, AA, Ocupado, Congestión.
- `frontend/src/lib/exporters.ts`: `kpiRangeRows`, `gatewaysRangeRows`.

## Pasos
1. **Rama** `feat/051-attendable-answer-rate` + docs.
2. **Backend** `_attendable_rate` + campo en `get_summary` y `get_device_metrics`; tests.
3. **Tipos** `CampaignSummary` y `DeviceRangeRow` con `attendable_answer_rate`.
4. **UI** `StatCard` con `className`; `OverviewKpis` (hero de 2 filas + 2×2); columna en `GatewaysRangeTable`.
5. **CSV** `kpiRangeRows` y `gatewaysRangeRows`.
6. **Tests** vitest + ajuste de fixtures.
7. **Verificación** smoke con la API real · `/cerrar-spec 051` → PR → CI → squash merge.
