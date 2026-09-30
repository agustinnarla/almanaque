# Plan de implementación — Spec 035

## Contexto

- `mapRangeDiagnostics` (App.tsx:189-225): `rootCauses` = congestión + burn sin tope; `buildWorstHour`/`buildWorstDevice` solo se usan en CampaignsCompareMode (App.tsx:896-899).
- `composeCrossNegatives(backendEvents, reservedEvents)` (lib/crossDiagnostics.ts): reserva los destacados y completa con backend hasta `NEGATIVE_DRIVERS_MAX = 5`; ya importado en App.tsx y con tests propios.
- Los builders de Spec 032 ya soportan modo sin campaña («del período»).

## Pasos

1. **Docs** `spec/035-spec-range-worst/{spec,plan,task}.md`.
2. **`App.tsx` → `mapRangeDiagnostics`**:
    - Construir `worstHour = buildWorstHour(hourly)` y `worstDevice = buildWorstDevice(devices)`.
    - `rootCauses = composeCrossNegatives(causasBackend, [worstHour, worstDevice])`.
3. **Tests** en `ExportButtons.test.tsx` (único archivo con mocks de overview + diagnostics completos en modo rango):
    - Texto de peor hora/dispositivo en «Causas negativas».
    - CSV índice 1 (`rango_35_2026-09-01_2026-09-15_diagnosticos.csv`) con filas `Negativa` de tipo `WORST_HOUR`/`WORST_DEVICE`.
4. **Verificación**: `npm test` · `npx tsc -b` · `npm run lint` · `npm run build` · `pytest -q` (164) · smoke real · mtimes `/data` · `package.json` sin dependencias · `task.md` en `[x]`.
