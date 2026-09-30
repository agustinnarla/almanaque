# Plan 21: Delta dual en Tasa de contacto

## 1. Docs
*   `spec/021-spec-contact-rate-dual-delta/{spec,plan,task}.md`.

## 2. `StatCard.tsx`
*   Agregar `deltaSuffix?: string | null`, `deltaSecondary?: number | null`, `deltaSecondarySuffix?: string`.
*   Helper de formato primario: si `deltaIsPercent` → `%` (o `deltaSuffix` si no es `null`/`undefined`); si `!deltaIsPercent` → `deltaSuffix ?? ''`.
*   Secundario: `(+X.XX%)` con `deltaSecondarySuffix ?? '%'`.
*   Signo/color: primario si existe, si no secundario.

## 3. Extraer `KpiGrid`
*   Nuevo `frontend/src/components/dashboard/KpiGrid.tsx` con el componente tal cual está en `App.tsx` (incluye empty-state de `summary: null` y helpers `formatNumber`/`formatRate`/`formatScore` necesarios — **sin** duplicar si ya están exportados; mover solo lo que uses).
*   `App.tsx`: importar `KpiGrid`; borrar la definición local de la función (mantener helpers de App si se usan en el footer/KPIs de rango — revisar usos).

## 4. Tarjeta Tasa de contacto
*   Dual pp + relativo; quitar `deltaLabel`.

## 5. Tests
*   Ampliar `StatCard.test.tsx`.
*   Nuevo `dashboard/__tests__/KpiGrid.test.tsx`.

## 6. Verificación
1.  `npm test` + `tsc -b` + `lint` + `build`.
2.  `pytest -q` → 143.
3.  Smoke: valores de ejemplo dual; congestión/total/health sin cambio.
4.  `/data` mtime; `task.md [x]`.

## Fuera de alcance
*   Backend, otras KPIs, OverviewKpis.
