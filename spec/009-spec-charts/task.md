# Task 09: Gráficos y Tabla Comparativa

## 1. Preparación
- [x] RF1: verificar badge Congestión (Opción A) sin regresión en Spec 008.
- [x] Tipos `HourlyTrendPoint` + `fetchHourlyTrend` en el cliente API.

## 2. Hook y componentes
- [x] `useHourlyTrend.ts` (doble fetch en paralelo, abort, deps estables).
- [x] `GatewaysTable.tsx` con precedencia **Saturado > Aliviado > Normal** y variación en pp (`delta × 100`).
- [x] `HourlyTrendChart.tsx` (barras A atenuado / B sólido; línea A discontinua / B continua; dual Y).

## 3. Integración
- [x] Nivel 4 en `App.tsx` (grid 12: chart 8 + table 4; apilado en mobile).
- [x] Loading / error / empty-states en español.

## 4. Tests y cierre
- [x] Vitest: `GatewaysTable` (precedencia, empty) y `HourlyTrendChart` (datos, empty).
- [x] `npm test` + `tsc -b` + `npm run lint` + `pytest -q` en verde.
- [x] Smoke 35 (2026-09-01 / 2026-09-02): gráfico dual + GW37 **Saturado**.
- [x] Layout: sin scroll horizontal en `GatewaysTable` (col 7/5, `px-2`, headers TRONCAL/CONG. A/CONG. B/VAR./ESTADO) y dots `{ r: 3 }` en líneas del gráfico.
- [x] Marcar items `[x]`.
