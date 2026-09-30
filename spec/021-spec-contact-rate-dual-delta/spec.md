# Spec 021: Tasa de contacto con delta dual (pp + relativo)

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). En «Comparar 2 días» la tarjeta «Tasa de contacto» solo muestra uno de los dos deltas (relativo **o** absoluto); se necesita ver **ambos** en una línea: puntos porcentuales y variación relativa.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — `StatCard` con delta dual opcional]:** `StatCard` aceptará props opcionales **retrocompatibles**:
    *   `deltaSuffix?: string | null` — sufijo del delta primario. Default: `'%'` si `deltaIsPercent` es `true`; `''` si es `false` (comportamiento actual de congestión/total intacto). Si se pasa `'pp'`, el valor se formatea `+1.36 pp`.
    *   `deltaSecondary?: number | null` — segundo delta en paréntesis, formateado con `deltaSecondarySuffix` (default `'%'`), 2 decimales y signo.
    *   **Render** (con primario presente): `‹flecha› +1.36 pp (+20.75%) ‹deltaLabel?›`.
    *   Si `delta == null` y hay `deltaSecondary` → se muestra solo el secundario (defensivo).
    *   Si ambos `null` → sin línea de delta (actual).
    *   Color / `data-good` / `data-bad` → signo del **primario**; si no hay primario, del secundario.
    *   Las otras tarjetas (Total, Congestión, Health) **no** pasan las props nuevas → presentación **idéntica** a hoy.

*   **RF2 [UI — KpiGrid «Tasa de contacto» dual]:** Al extraer `KpiGrid` de `App.tsx` a `frontend/src/components/dashboard/KpiGrid.tsx`, la tarjeta 2 quedará:
    *   `value`: `rate_a → rate_b` sin cambio (`formatRate`).
    *   `delta = delta_rate × 100` (pp), `deltaIsPercent={false}`, `deltaSuffix="pp"`.
    *   `deltaSecondary = delta_percentage`.
    *   **Sin** `deltaLabel` («relativo»/«abs.» se elimina por redundante).
    *   Si `delta_rate` es `null` → primario `null`; si `delta_percentage` también `null` → sin delta.
    *   Total, Congestión y Health en `KpiGrid` **sin cambios de props**.

*   **RF3 [Testing]:**
    *   `vitest` `StatCard`: dual `+1.36 pp (+20.75%)`; solo `pp` sin secundario; solo secundario; color por primario; regresión de los tests actuales (signo, `goodWhenNegative`, `null`).
    *   `vitest` `KpiGrid`: fixture `delta_rate=0.0136`, `delta_percentage=20.75` → aserción del texto dual en «Tasa de contacto»; `summary: null` → empty-state.
    *   Regresión: `npm test`, `npx tsc -b`, `npm run lint`, `npm run build`; `pytest -q` **143** (sin tocar backend).

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 008 | RF4 ítem 2 (presentación de «Tasa de contacto») | Dual `+X.XX pp (+Y.YY%)`; campos del `summary` y otras 3 KPI intactos |

## Datos de entrada

*   `SummaryKpi` ya expone `delta_rate` (fracción) y `delta_percentage` (%) — `campaigns_repo.build_compare_diagnostics`.
*   Sin cambios de API ni esquema.

## Contrato JSON

Sin cambios de endpoints. Solo props de React (`StatCard`, `KpiGrid`).

## Fuera de Alcance

*   Backend, esquema, `/data`.
*   Otras 3 tarjetas de `KpiGrid`; modo rango (`OverviewKpis`); semántica de congestión (invertida) y health score.
*   Renombrar tipos o hooks.

## Criterios de Finalización

*   Docs `spec/plan/task`; `task.md` en `[x]`.
*   `KpiGrid` en archivo propio, importado por `App.tsx` (CompareMode).
*   Tarjeta «Tasa de contacto» smoke compare 01 vs 02: formato `+X.XX pp (+Y.YY%)` con datos reales.
*   `npm test` + `tsc -b` + `lint` + `build` en verde; `pytest -q` 143.
*   `/data` mtimes intactos.
