# Task 21: Delta dual en Tasa de contacto

## 1. Docs
- [x] `spec.md`, `plan.md`, `task.md`.

## 2. StatCard
- [x] Props `deltaSuffix`, `deltaSecondary`, `deltaSecondarySuffix`.
- [x] Render dual `+X.XX pp (+Y.YY%)`; color por primario.

## 3. KpiGrid extraído
- [x] `frontend/src/components/dashboard/KpiGrid.tsx`.
- [x] `App.tsx` importa el componente; sin duplicados.
- [x] Tasa de contacto dual; quitar label relativo/abs.

## 4. Tests
- [x] `StatCard.test.tsx`: dual, solo pp, solo secundario, regresión.
- [x] `KpiGrid.test.tsx`: dual + empty-state.

## 5. Verificación y cierre
- [x] `pytest -q` 143 · `npm test` + `tsc` + `lint` + `build` verdes.
- [x] Smoke lógica: `+1.36 pp (+20.75%)` en fixtures KpiGrid/StatCard.
- [x] `/data` mtime intacto.
- [x] Marcar items `[x]`.
