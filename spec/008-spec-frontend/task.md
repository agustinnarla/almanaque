# Task 08: Dashboard Frontend

## 1. Inicialización
- [x] Crear Vite React-TS en `frontend/` y configurar Tailwind.
- [x] Proxy `/api` → `http://localhost:8000` en `vite.config.ts`.
- [x] Instalar `lucide-react`, `recharts`, deps de Vitest/Testing Library.

## 2. Capa de servicios y tipos
- [x] `src/types/api.ts` con el contrato de `compare/diagnostics` (incl. summary RF6).
- [x] `src/api/campaigns.ts` con `fetch` tipado.
- [x] `src/hooks/useCompareDiagnostics.ts` (`data`, `loading`, `error`).

## 3. Componentes
- [x] `StatCard.tsx`, `Badge.tsx`.
- [x] `FilterBar.tsx` (defaults `35`, `2026-09-01`, `2026-09-02`, min_calls 50/100/200).
- [x] `InsightCard.tsx`, `DiagnosticsFeed.tsx` (solo `root_causes` + `positive_drivers`).

## 4. Ensamblado y verificación
- [x] `App.tsx` con 4 KPI + feed.
- [x] Vitest: tests de `StatCard` y `Badge` en verde.
- [x] Backend en `:8000` + `npm run dev`: visible Base 80 (WARNING) y GW37 (SUCCESS).
- [x] Responsive `md`/`lg`; empty-state si falla la API.
- [x] `pytest -q` backend en verde.
- [x] Fix render loop: `params` con `useMemo` + deps primitivas en el hook (sin `Maximum update depth`).
- [x] Smoke proxy `localhost:5173/api/...` → payload con Base 80 (WARNING) y GW37 (SUCCESS).
- [x] Ajustes KPI: delta congestión invertido (verde si baja) a 2 decimales (pp); badge Health Score (≥0 Saludable / [−10,0) Aceptable / <−10 Crítico); íconos AlertTriangle y CheckCircle2 en el feed.
- [x] Badge de Congestión alineado a la tendencia del delta (Mejorando / Empeorando / Sin cambios) para eliminar la contradicción visual con el delta verde.
- [x] Marcar task `[x]`.
