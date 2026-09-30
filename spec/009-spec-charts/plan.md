# Plan 09: Gráficos y Tabla Comparativa

## 1. RF1 (verificación, sin código)
*   Confirmar que `StatCard` + `healthStyle.congestionTrend*` ya implementan Opción A (Spec 008). No tocar salvo regresión.

## 2. Tipos y cliente API
*   `frontend/src/types/api.ts`: `HourlyTrendPoint { hora, total_calls, agent_answers, machine_answers, agent_answer_rate }`.
*   `frontend/src/api/campaigns.ts`: `fetchHourlyTrend(campaign, date, signal)` → `GET .../hourly-trend?start_date=date&end_date=date`.

## 3. Hook
*   `src/hooks/useHourlyTrend.ts`: dispara **en paralelo** las dos fechas; expone `{ pointsA, pointsB, loading, error, reload }` con abort en cleanup; deps primitivas (igual patrón que Spec 008, sin bucle de renders).

## 4. Componentes nuevos (`src/components/dashboard/`)
*   **`HourlyTrendChart.tsx`**
    *   Merge por `hora` (unión ordenada): `totalA/B`, `rateA/B` (`×100` para eje derecho; `null` → `null` en línea).
    *   Recharts `ComposedChart` + `ResponsiveContainer` (alto fijo p.ej. 320).
    *   `Bar` A `slate-300`, `Bar` B `indigo-500`; `Line` A `strokeDasharray`, B continua; dos `YAxis`.
    *   Tooltip custom ES; empty `[]` → parrafo empty-state.
*   **`GatewaysTable.tsx`**
    *   Props: `rows: GatewayComparison[] | null`.
    *   Helper `gatewayStatus(row)`: **Saturado** (`b ≥ 0.05`) > **Aliviado** (`b < 0.05 && delta ≤ -0.02`) > **Normal**.
    *   Formato: rates `%` 2 dec.; variación `(delta * 100).toFixed(2)` pp con signo; `font-mono` a la derecha.
    *   Badges Tailwind; `null`/`[]` → empty-state.

## 5. Integración `App.tsx`
*   Nivel 4 bajo `DiagnosticsFeed`: grid `lg:grid-cols-12` → chart `lg:col-span-8`, table `lg:col-span-4` (apilado &lt; md).
*   Hooks: reutilizar filtros de `FilterBar` (campaña + ambas fechas).
*   Skeletons simples en carga; mensajes de error en español.

## 6. Tests (Vitest)
*   `GatewaysTable.test.tsx`: filas; precedencia Saturado > Aliviado; `null` → empty; formato pp.
*   `HourlyTrendChart.test.tsx`: render con fixture; `[]` → empty-state.
*   Regresión: `npm test`, `tsc -b`, `npm run lint`, `.venv/Scripts/python -m pytest -q`.

## 7. Cierre
*   Smoke visual 01/09–02/09 (GW37 Saturado; gráfico dual día).
*   Marcar `task.md` `[x]`; actualizar spec/plan/task si hay micro-ajustes de implementación.
