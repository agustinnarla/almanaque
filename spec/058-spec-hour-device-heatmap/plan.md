# Plan de implementación — Spec 058

## Contexto
- `backend/routers/campaigns.py` (rutas por campaña) y `backend/repositories/campaigns_repo.py` (consultas agrupadas, por ejemplo `get_daily_device_rows`).
- `frontend/src/modes/RangeMode.tsx`, sección `sec-horaria`: `HourlyAggregateChart`.
- `frontend/src/lib/chartPalette.ts`: paletas claro/oscuro; la paleta de referencia de `dataviz` define la rampa secuencial azul (pasos 100–700).
- `frontend/src/components/charts/ChartCard.tsx`: tarjeta con «Ver tabla».

## Pasos
1. **Rama** `feat/058-hour-device-heatmap` + docs.
2. **Backend** `get_hour_device_rows` + `GET /{c}/heatmap`; tests.
3. **Frontend**
   - `HEATMAP_MIN_CELL_CALLS` y `sequential` en las paletas;
   - `lib/heatmap.ts`;
   - API, hook `useHeatmap` y `heatmapRows`;
   - `HourDeviceHeatmap`;
   - el mapa en `RangeMode`;
   - la regla en el modal.
4. **Tests** pytest y vitest.
5. **Verificación** smoke real · `/cerrar-spec 058` → PR → CI → squash merge.
