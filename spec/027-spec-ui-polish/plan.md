# Plan 27: Pulido UI/UX de Rankings y Alertas de patrones

## 1. Docs
*   `spec/027-spec-ui-polish/{spec,plan,task}.md`.

## 2. `components/common/ExportCsvButton.tsx`
*   Prop opcional `label?: string` (default `'CSV'`) → `{label}` dentro del botón; `data-testid`, clases y `filename/headers/rows` intactos.

## 3. `components/overview/BasesRankingTable.tsx`
*   Columnas `# | Base | AA %` (rank al inicio; `w-[15%] | w-[50%] | w-[35%]`).
*   Fila `index === 0` → `bg-emerald-50`; todas las filas `hover:bg-slate-50 transition-colors`.
*   `<caption className="sr-only">Ranking de bases por Agent Answer</caption>`.

## 4. `components/overview/SegmentRankingTable.tsx`
*   `RankingBlock`: `h3` → `h4` (mismo estilo).
*   `healthColor(value)` → `{className, data}`: `≥0` emerald (`data-good`), `≥−10` amber, `<−10` red (`data-bad`); se aplica `font-semibold` + color al `td` de Health.
*   En «Mejores» (`title === 'Mejores'`): fila `index === 0` → `bg-emerald-50`; `hover:bg-slate-50` en todas.
*   `<caption>` sr-only por tabla (`Ranking de mejores dispositivos`… según `kind` + título).
*   Eliminar el `<p>` final con «Volumen mínimo…» (y su aserción en el test).

## 5. `components/Insights/PatternsPanel.tsx`
*   Bloque día:
    *   `h3` «Alertas por día» + `Badge`/chip ámbar con el `total`.
    *   Lista de barras: por fila `flex items-center gap-2` → fecha (`w-16 text-xs font-medium`, `title` con ISO) · barra `h-4 flex-1 rounded bg-slate-100` con `div` interior `bg-amber-400` y `style={{ width: '${pct}%' }}` (pct = `alerts / maxAlerts * 100`) · conteo `w-8 text-right font-mono text-xs`.
    *   `data-testid="pattern-day-row"` en cada `li`.
*   `formatDayLabel(iso)` = `new Intl.DateTimeFormat('es-AR', {day:'2-digit', month:'2-digit'}).format(new Date(`${iso}T00:00:00`))`.
*   `h3` combos → «Combinaciones más problemáticas» + `p` subtítulo «Combinaciones bajo el umbral de Agent Answer (5%)».
*   Tabla combos: quitar `AlertTriangle` de cada celda (queda solo en el encabezado `h3`), 4 columnas con **Share %** (`alerts / total`, `text-right`, barra fina de fondo con `width` inline) → `Base | Dispositivo | Alertas | Share % | Peor AA %` (5 columnas, ajustar anchos); fila `index === 0` → `bg-amber-50`.
*   `AlertTriangle` (o `Siren`) en el `h3` de la sección de App (RF1), no por fila.

## 6. `App.tsx` — solo RangeMode
*   **Rankings** (`App.tsx:342-414`):
    *   Header: `<h2 className="flex items-center gap-2 …"><Trophy className="h-4 w-4 text-indigo-600" aria-hidden />Rankings del rango</h2>` + `p.mb-3` debajo con descripción + `volumen mínimo {min} llamadas · top {limit}` (leído de `rankings.devices ?? {min_calls_applied: 50, limit_applied: 5}`).
    *   Fila de acciones junto al `h2` (patrón `RecommendationsPanel:95-101`): 3 `ExportCsvButton` con `label="Bases"|"Dispositivos"|"Horas"` en ese orden → DOM `[3][4][5]`.
    *   Grid `grid gap-6 lg:grid-cols-3 items-start`; cada tarjeta: `<div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">` con `h3` interno (`Bases por AA %` / `Dispositivos` / `Horas`); tablas **sin** botón interno (ya movido) y **sin** `mb-2 flex justify-between`.
*   **Patrones** (`App.tsx:416-455`):
    *   Header con `AlertTriangle` + `h2` + `p` «Combinaciones bajo el umbral del 5% de Agent Answer».
    *   Mantener los 2 CSV a la derecha (`label="Por día"|"Combinaciones"`) → DOM `[6][7]` intactos.
*   Quitar imports ahora no usados si los hay; verificar `DEFAULT_MIN_CALLS`/`RANKING_LIMIT` (solo se eliminan si dejan de usarse).

## 7. Tests
*   `overview/__tests__/BasesRankingTable.test.tsx`: celdas `cells[0]='#1'`, `cells[1]='34'`, `cells[2]='44.95%'` (y `#3` en la fila 3).
*   `overview/__tests__/SegmentRankingTable.test.tsx`: quitar la línea de «Volumen mínimo 50 llamadas»; conservar `Mejores`/`Peores`/`3.38`/`-25.67`; añadir aserción `data-good`/`data-bad`.
*   `Insights/__tests__/PatternsPanel.test.tsx`: `dayRows[0]` con `title='2026-09-01'` y `toHaveTextContent('01/09')` + `3`; `getByText('Alertas por día')` + chip del total (4); combos conservan `80`/`GW20`/`2` + aserción de Share.
*   `common/__tests__/ExportCsvButton.test.tsx`: nuevo caso `label` («Bases» renderizado, default «CSV»).
*   `__tests__/ExportButtons.test.tsx` y `ModeTabs.test.tsx`: sin cambios (orden 11/5/7 intacto) → solo re-ejecutar.

## 8. Verificación
1.  `npx vitest run` (≥127), `npx tsc -b`, `npm run lint`, `npm run build`.
2.  `.venv/Scripts/python -m pytest -q` = **156**.
3.  Smoke visual/real (backend 8000, campaña 35, 2026-09-01 → 2026-09-15): secciones con encabezados iconados, health coloreado, barras con `01/09`, share visible, pie único.
4.  mtimes `/data` intactos; `package.json` sin dependencias nuevas; `task.md` `[x]`.
