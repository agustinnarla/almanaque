# Task 34: «Rankings del rango» apilado a lo ancho

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. App.tsx
- [x] Grid de Rankings del rango sin `lg:grid-cols-3` (`grid items-start gap-8`).
- [x] Contenedor de los 3 CSV con `flex-wrap`.

## 3. Tablas
- [x] `BasesRankingTable`: `overflow-x-auto` + `min-w-[480px]`.
- [x] `SegmentRankingTable`: `overflow-x-auto` + `min-w-[560px]`.

## 4. Tests
- [x] Asserts de wrapper/`min-w` en ambos tests de tablas.
- [x] `ModeTabs.test.tsx`: grid sin `lg:grid-cols-3` dentro de `Rankings del rango`.
- [x] Regresión: `pytest -q` (164) · `npm test` · `npx tsc -b` · `npm run lint` · `npm run build`.

## 5. Verificación y cierre
- [x] Smoke: 3 tarjetas apiladas a lo ancho, scroll en pantallas angostas, CSV con `flex-wrap`.
- [x] mtimes `/data` intactos; `package.json` sin dependencias nuevas.
- [x] Marcar items `[x]`.
