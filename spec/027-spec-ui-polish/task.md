# Task 27: Pulido UI/UX de Rankings y Alertas de patrones

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. ExportCsvButton
- [x] Prop opcional `label` (default `'CSV'`).

## 3. BasesRankingTable
- [x] Columnas `# | Base | AA %`, fila líder `bg-emerald-50`, `hover`, `<caption>`.

## 4. SegmentRankingTable
- [x] `h3 → h4`, `health_score` coloreado (`data-good`/`data-bad`), fila líder, `hover`, `<caption>`, sin pie duplicado.

## 5. PatternsPanel
- [x] Barras horizontales por día, fecha `Intl` (`01/09` vía `formatToParts`, ISO en `title`), encabezado sin `({total})` + chip de total, columna Share % con barra, fila #1 ámbar, sin `AlertTriangle` por fila.

## 6. App.tsx — RangeMode
- [x] Headers con icono (`Trophy`/`AlertTriangle`) + párrafo debajo (incluye volumen mínimo y top).
- [x] Fila única de 3 CSV en Rankings (`label` Bases/Dispositivos/Horas, orden `[3][4][5]`) + 2 CSV de Patrones con `label` (`[6][7]`).
- [x] Grid `lg:grid-cols-3 items-start` con tarjetas de cabecera propia; sin botones CSV internos ni bordes duplicados.

## 7. Tests
- [x] Actualizar `BasesRankingTable`, `SegmentRankingTable`, `PatternsPanel`.
- [x] Nuevo caso de `label` en `ExportCsvButton.test.tsx`.
- [x] Re-ejecutar `ModeTabs` / `ExportButtons` sin cambios (orden 11/5/7 intacto).

## 8. Verificación y cierre
- [x] `npx vitest run` = **129** (26 archivos) + `npx tsc -b` = 0 + `npm run lint` = 0 errores (solo warnings preexistentes) + `npm run build` OK.
- [x] `pytest -q` = **156**.
- [x] Smoke real de datos (campaña 35): 3 bases (34/76/80), IPLAN health 3.38 / IPLAN2 −14.02 (umbrales de color aplicados), 363 patrones crudos; secciones con encabezados iconados, barras con fecha `01/09`, share visible, pie único.
- [x] mtimes `/data` intactos (22/22); `package.json` sin dependencias nuevas (6 deps / 12 devDeps).
- [x] Marcar items `[x]`.
