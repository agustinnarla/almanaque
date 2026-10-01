# Task 42: Gráficos sin doble eje, paleta validada y responsive

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Gráficos
- [x] `lib/chartPalette.ts` (paleta validada) + test.
- [x] `RateVolumeChart` (2 paneles con un eje cada uno, syncId, tooltip, leyenda solo con 2 series) + tests.
- [x] Los 4 gráficos de tendencia delegan en `RateVolumeChart`; subtítulos nuevos.

## 3. Responsive
- [x] `overflow-x-auto` + `min-w` en las 5 tablas.
- [x] Filtros con `md:flex-wrap`; pestañas con `flex-wrap`.

## 4. Verificación y cierre
- [x] Tests ajustados (mocks, subtítulo) y `/cerrar-spec 042` en verde.
- [x] grep: sin `yAxisId="right"` ni hex fuera de la paleta en los gráficos.
- [x] Chrome: vista ancha y angosta (~400 px), consola sin errores.
- [x] Commit en español + push.
- [x] Marcar items `[x]`.
