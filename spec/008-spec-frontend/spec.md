# Spec 08: Dashboard Frontend de Diagnóstico

## Usuario

Analista / supervisor del call center (usuario interno del dashboard).

## Requisitos Funcionales (EARS)

*   **RF1 [Setup]:** `frontend/` con **Vite + React + TypeScript + Tailwind CSS + Lucide React + Recharts**. Cliente HTTP: **`fetch`** nativo tipado (sin axios). Proxy Vite: `/api` → `http://localhost:8000` (backend canónico: **Uvicorn en 8000**).
    *   *Por qué:* Cumple stack cerrado (constitution) y separación `/frontend` vs `/backend`.
*   **RF2 [Barra de Filtros]:** `FilterBar` con campaña (default `35`), `date_a` (default `2026-09-01`), `date_b` (default `2026-09-02`), `min_calls` ∈ {50, 100, 200} y acción “Comparar”.
    *   UI en **español**; nombres de archivos/variables en inglés.
*   **RF3 [Feed de Diagnósticos]:** `DiagnosticsFeed` consume `GET /api/campaigns/{name}/compare/diagnostics` y renderiza **solo** `root_causes` (negativas) y `positive_drivers` (favorables) en tarjetas. **No** se muestra `insights` en esta spec.
    *   Colores/badges por severidad: `CRITICAL`, `WARNING`, `SUCCESS`, `INFO`.
    *   Íconos Lucide: **AlertTriangle** (ámbar) en “Causas negativas”; **CheckCircle2** (verde) en “Factores de mejora” (título de sección + cada tarjeta).
*   **RF4 [Tarjetas KPI]:** Cuatro `StatCard` alimentadas **solo** por `summary` del mismo payload (Spec 007 RF6):
    1. Total de llamadas A/B + `delta_total_pct`.
    2. Tasa de contacto A/B + `delta_rate`/`delta_percentage`.
    3. Tasa de congestión (`congestion_rate` día B) con **delta en pp a 2 decimales** y **semántica invertida**: delta negativo (baja la congestión) → **verde/positivo**; positivo → rojo. El badge inferior refleja **la tendencia del delta** (no el nivel absoluto): **< 0 → “Mejorando” (emerald)**, **> 0 → “Empeorando” (red)**, **= 0 → “Sin cambios”**, **`null` → “Sin datos”** — evita la contradicción visual delta verde + badge ámbar.
    4. `health_score` global (día B) con badge por rango de presentación: **≥ 0 → “Saludable” (emerald)**, **[−10, 0) → “Aceptable” (amber)**, **< −10 → “Crítico” (rose)**; `null` → “Sin datos”.
*   **RF5 [Defensivo]:** Skeletons en carga; si la API falla, responde vacío o `summary: null` → empty-states informativos en español; la vista no se rompe.
*   **RF6 [Tests]:** **Vitest** cubre al menos `StatCard` (delta/signo) y `Badge` (severidad). `pytest` de backend en verde (regresión).

## Fuera de Alcance

*   Endpoints de ranking, hourly-trend, devices en la UI (solo tipados opcionales no se implementan).
*   Colección `insights` en el feed.
*   Autenticación, deploy a Vercel, móvil (responsive: `md`/`lg` tablet-desktop).

## Criterios de Aceptación

*   `npm run dev` + backend en `:8000` muestra la comparación 01/09–02/09 con **Base 80** en causas y **GW37** en positivos.
*   Las 4 KPI se pintan desde `summary` extendido.
*   `npx vitest run` en verde; `pytest -q` en verde.
*   Estados de carga y error en español; UI en español.
