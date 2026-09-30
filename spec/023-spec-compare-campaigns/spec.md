# Spec 023: Comparar 2 campañas (rango fijo)

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). Con las campañas **35** y **38** ingesta (Spec 022) se necesita comparar sus KPIs, gateways, bases y tendencias **una contra otra** en un solo vistazo, sin entrar en diagnóstico de causas ni recomendaciones.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — tercer modo de vista]:** `App.tsx` ofrecerá **tres** modos desde `ModeTabs`: «Campaña completa», «Comparar 2 días» (ambos **sin cambios** de componentes, contratos ni comportamiento) y **«Comparar campañas»** (nuevo, `data-testid="tab-campaigns"`).
    *   `ViewMode = 'range' | 'compare' | 'campaigns'`.
    *   Cada modo conserva su estado/filtros al cambiar de tab.

*   **RF2 [UI — filtro de cruce sin fechas]:** El modo nuevo usa `FilterCrossCampaignBar`:
    *   Campos: **Campaña A** (default `'35'`), **Campaña B** (default `'38'`), **Mín. llamadas** ∈ {50, 100, 200} (default 50), botón «Comparar».
    *   **Rango fijo** `2026-09-01 → 2026-09-15` mostrado como texto informativo (no editable).
    *   Campañas iguales o vacías → validación nativa del formulario (no se dispara la carga).
    *   UI en español; identifiers en inglés.

*   **RF3 [Ubiquitous — endpoint de cruce]:** `GET /api/campaigns/compare-campaigns?campaign_a=&campaign_b=&start_date=&end_date=&min_calls=`:
    *   `min_calls` entero default **50**, `ge=1` (misma regla que Specs 007/017).
    *   Rango en query para flexibilidad del backend; el front siempre envía el rango fijo de RF2.
    *   *Por qué:* No existe ruta de un segmento bajo `/api/campaigns/` → sin conflicto con `/{campaign_name}/…`.

*   **RF4 [State-driven — contrato del cruce]:** Respuesta:
    ```jsonc
    {
      "campaign_a": "35", "campaign_b": "38",
      "start_date": "2026-09-01", "end_date": "2026-09-15",
      "min_calls_applied": 50,
      "summary": SummaryKpi | null,
      "gateways_comparison": GatewayComparison[] | null,
      "bases_comparison": BaseComparison[] | null,
      "hourly_a": HourlyTrendPoint[], "hourly_b": HourlyTrendPoint[],
      "daily_a": DailyTrendPoint[],   "daily_b": DailyTrendPoint[]
    }
    ```
    *   `summary` = misma forma que Spec 007 RF6 (totales, AA, busy, congestión, `health_score` de la campaña **B**); requiere `get_range_totals` (BETWEEN, espejo de `get_day_totals`).
    *   `gateways_comparison` / `bases_comparison`: intersección de entidades con `total_calls ≥ min_calls` en **ambas** campañas (misma regla Spec 007 RF2); delta = B − A.
    *   `hourly_*` / `daily_*`: `get_hourly_trend` / `get_daily_trend` por campaña sobre el rango ( Specs 004/013 ).

*   **RF5 [Unwanted behavior — campaña sin datos]:** Si `campaign_a` o `campaign_b` no existen en el rango (o nombre vacío): `summary`, `gateways_comparison`, `bases_comparison` → **`null`**; `hourly_*` / `daily_*` → **`[]`**; HTTP **200**.
    *   Existe una campaña pero 0 segmentos ≥ `min_calls`: `summary` poblado, `*_comparison` `[]` o solo la intersección.

*   **RF6 [UI — secciones del modo cruce]:** **Incluidas:**
    1.  **KPIs**: reutiliza `KpiGrid` con **props opcionales** `labelA`/`labelB` (default = copy actual «Día A/B» → Specs 008/021 intactos; en cruce: «Campaña A»/«Campaña B»).
    2.  **Gateways**: `GatewaysTable` **sin cambios de contrato** (headers «Cong. A/B» servirán); subtítulo del contenedor indica campañas.
    3.  **Bases**: nuevo `BasesCompareTable` sobre `bases_comparison` (base, AA A, AA B, Δ pp, share A/B); hoy esta colección no tiene UI ni en modo días.
    4.  **Hourly A/B**: `HourlyTrendChart` con **props opcionales** de subtítulo/labels (default intacto Spec 009).
    5.  **Daily A/B**: nuevo `DailyCompareChart` (dual series, patrón de `HourlyTrendChart`); `DailyTrendChart` actual (single-series) **no se toca**.
    *   Footer: `A vs B · start → end · min_calls N`.
    *   Loading skeleton, error y empty-state en español (patrón de los modos existentes).

*   **RF7 [Testing]:**
    *   `pytest`: contract del endpoint, campaña inexistente → nulls+200, `min_calls` filtra intersección, regresión total.
    *   `vitest`: `FilterCrossCampaignBar` (submit), `DailyCompareChart` (datos/vacío), `BasesCompareTable` (filas/vacío), `ModeTabs` con 3 tabs, `KpiGrid` con `labelA`/`labelB`.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build`; `pytest -q`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 016 | RF1 «**dos** modos de vista» | Ahora **tres** tabs; rango y A/B sin cambios de comportamiento |

## Datos de entrada

*   DB ya poblada con campañas `35` (333 filas) y `38` (441 filas), 11 fechas 2026-09-01→15 (Spec 022).
*   Funciones existentes: `get_hourly_trend`, `get_daily_trend`, `get_device_metrics`, `get_summary`, `compute_delta_percentage`, `compute_health_score`.
*   **No** se usan: `evaluate_causes`, `build_recommendations`, `get_day_totals`, `get_breakdown_by_base` (día-acentuados).

## Contrato JSON

Nuevo endpoint `GET /api/campaigns/compare-campaigns` (ver RF4). Endpoints existentes **sin cambios**.

## Fuera de Alcance

*   Diagnóstico (`root_causes` / `positive_drivers` / `insights`) y **recomendaciones** en el modo cruce.
*   Fechas editables en el filtro del cruce.
*   Cambios en modo «Campaña completa» ni «Comparar 2 días» (más allá de props **opcionales** con default actual).
*   Esquema DB, `/data`, nuevos endpoints además del cruce, auth, deploy.

## Criterios de Finalización

*   Docs `spec/023-…/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Endpoint responde: `35 vs 38` 01→15 → `summary.total_calls_a = 35413`, `total_calls_b = 263198`, AA `0.0594` vs `0.0489`; 11 `daily_*` puntos por campaña; gateways/bases poblados con intersección ≥ min_calls.
*   Campaña inexistente → nulls + arrays `[]` + 200.
*   UI: tercer tab funcional; KPIs con labels «Campaña A/B»; daily dual; bases table; hourly con copy de campañas.
*   `pytest -q` en verde; `npm test` + `tsc` + `lint` + `build` en verde.
*   Aserciones de Specs 008/009/016/021 sin cambios (defaults intactos).
*   `/data` mtimes intactos.
