# Plan 08: Dashboard Frontend

## 1. Setup
*   `npm create vite@latest frontend -- --template react-ts` (desde la raíz del repo).
*   Tailwind CSS (v4 preferida si el template lo permite; si no, v3 con `tailwind.config.js`).
*   Deps: `lucide-react`, `recharts`. Cliente: **fetch**.
*   `vite.config.ts`: `server.proxy['/api'] = 'http://localhost:8000'`.

## 2. Tipos y API
*   `src/types/api.ts`: `CompareDiagnosticsResponse`, `SummaryKpi`, `RootCause`, `PositiveDriver`.
*   `src/api/campaigns.ts`: `fetchCompareDiagnostics(params)` con `fetch` + manejo de error.
*   `src/hooks/useCompareDiagnostics.ts`: `{ data, loading, error, reload }`.

## 3. Componentes
| Archio | Rol |
|---|---|
| `FilterBar.tsx` | campaña, fechas, min_calls, botón Comparar (defaults Spec) |
| `StatCard.tsx` | título ES, valor, delta con flecha/colores |
| `Badge.tsx` | severidad / salud de congestión |
| `InsightCard.tsx` | tarjeta de causa/positivo |
| `DiagnosticsFeed.tsx` | split: Causas negativas / Factores de mejora |
| `App.tsx` | ensambla FilterBar + 4 StatCard + Feed |

## 4. Decisiones
*   **fetch** (sin axios).
*   KPI solo desde `summary` del compare (RF6 Spec 007).
*   Badge congestión: umbrales de presentación 0.05 / 0.15 en el front.
*   Backend canónico **puerto 8000**.
*   Vitest + Testing Library para `StatCard` y `Badge`.

## 5. Tests
*   Vitest: signo de delta, colores de severidad.
*   Regresión `pytest` del backend.
