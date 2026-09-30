# Plan de implementación — Spec 034

## Contexto

- `App.tsx:477` grid `lg:grid-cols-3` de «Rankings del rango» vs «Rankings comparados» apilado (`grid items-start gap-8`, App.tsx:1089).
- `BasesRankingTable`/`SegmentRankingTable`: `overflow-hidden rounded-lg` + `table-fixed` con anchos % sin `min-w`.
- CSV de la sección (App.tsx:433) sin `flex-wrap` (Alertas 525 y Rankings comparados 1055 sí lo tienen).

## Pasos

1. **Docs** `spec/034-spec-range-rankings-stack/{spec,plan,task}.md`.
2. **`App.tsx`**: quitar `lg:grid-cols-3` del grid de Rankings del rango; sumar `flex-wrap` al contenedor de los 3 CSV.
3. **`BasesRankingTable.tsx`**: wrapper `overflow-x-auto`, tabla `min-w-[480px]`.
4. **`SegmentRankingTable.tsx`**: wrapper `overflow-x-auto`, tabla `min-w-[560px]`.
5. **Tests**: asserts nuevos en los 2 tests de tablas + test de grid apilado en `ModeTabs.test.tsx`.
6. **Verificación**: `npm test` · `npx tsc -b` · `npm run lint` · `npm run build` · `pytest -q` (164) · mtimes `/data` · `package.json` sin dependencias · `task.md` en `[x]`.
