# Plan 14: Recomendaciones Estratégicas sobre Acumulado de Campaña

## 1. Config (`backend/config.py`)

*   Nueva constante: `REC_MIN_VOLUME_SHARE = 0.10`.
*   Sin tocar el resto de `REC_*`, `DIAG_*`, `HEALTH_WEIGHT_*`, `RECOMMENDATIONS_LIMIT`.

## 2. Repo (`backend/repositories/campaigns_repo.py`) — cambio mínimo

*   En `build_compare_recommendations` (líneas ~651–652):
    *   `get_device_metrics(conn, campaign_name, date_b, date_b)` → **`(date_a, date_b)`**
    *   `get_hourly_trend(conn, campaign_name, date_b, date_b)` → **`(date_a, date_b)`**
*   **No** se crea `get_campaign_aggregate_metrics` ni SQL nuevo: `get_device_metrics` y `get_hourly_trend` ya agregan por gateway/hora en el rango pedido (Constitución #6).
*   `get_day_metrics(date_a|date_b)` sigue alimentando VOLUME_DELTA (día a día).

## 3. Engine (`backend/services/recommendations_engine.py`)

Firma de `build_recommendations(day_a, day_b, devices, hourly, min_calls, campaign_name)` **intacta** (solo cambian los datos que entran). Ajustes por regla:

*   **ROUTING (`_routing_rec`)**:
    *   Share: `total_campaign = sum(d.total_calls for d in devices)` (equivale al total del período); filtrar candidatos con `total ≥ min_calls` **y** `total / total_campaign ≥ REC_MIN_VOLUME_SHARE`.
    *   `total_campaign ≤ 0` o lista vacía de candidatos → sin ROUTING.
    *   Texto: tasa + share del período (quitar "del día B").
*   **PACING (`_pacing_rec`)**: misma regla (`busy_rate ≥ DIAG_BUSY_THRESHOLD`, peor busy). Texto nuevo: `busy_rate` + `agent_answer_rate` del troncal, saturación como factor principal.
*   **SCHEDULE (`_peak_hour_rec`)**: misma regla sobre `hourly` ya consolidado. Recibe además `total_agents` del período = `sum(h.agent_answers)` (computado en `build_recommendations`); texto con `"X de Y en total"` + vecinas ±1 h.
*   **AMD (`_amd_recs` / `_amd_rec`)**: sin cambio de nombre (`AMD_DIVERGENCE`), umbral `REC_AMD_RATIO`, cap 1. Texto nuevo estilo negocio (contestación automática vs. agentes + evaluar por AA).
*   **VOLUME_DELTA (`_volume_drop_rec`)**: sin cambio de regla; texto agrega absolutos `"bajó de {a} a {b}"` + porcentaje.
*   Orden y cap (`_SEVERITY_ORDER`, `_RULE_ORDER`, `RECOMMENDATIONS_LIMIT`) sin cambio.

## 4. Frontend

*   `frontend/src/components/Insights/RecommendationsPanel.tsx` (ruta correcta, **no** `dashboard/`):
    *   Mapa `type → grupo`: `STRATEGY = {ROUTING, PACING, SCHEDULE, AMD_DIVERGENCE}`, `PERIOD = {VOLUME_DELTA}`.
    *   Render en dos secciones con encabezados en negrita y español: «Estrategia de campaña» y «Alertas del período»; se omite la sección vacía.
    *   Estética actual intacta (`bg-slate-900`, `border-l-4` por `category`, tipo en negrita, `font-mono` métricas si aplica).
    *   `[]` → empty-state actual; sin cambios en `types/api.ts` ni `api/campaigns.ts` (contrato intacto).

## 5. Tests backend

*   `test_recommendations.py`:
    *   ROUTING: fixture con device share < 10% excluido; ninguno supera → sin ROUTING; textos con share/período.
    *   PACING/SCHEDULE/AMD/VOLUME: actualizar assertions de texto afectadas (`"del día B"`, `"contactos humanos logrados"`, etc.).
    *   Consolidado: fixtures de devices/hourly representan A+B (sin cambio de firma).
*   `test_api.py`:
    *   `test_recommendations_contract`: textos/calidades nuevos; `len ≤ 5`; tipos presentes con `seed_compare_recommendations`.
    *   Verificar que el resto de contratos no regresa.

## 6. Tests frontend

*   `RecommendationsPanel.test.tsx`: fixture con types de ambos grupos → assert de los 2 encabezados; `[]` → empty-state; regresión de borde por categoría.

## 7. Verificación

1.  `.venv/Scripts/python -m pytest -q` → 0 failed.
2.  `cd frontend && npm test && npx tsc -b && npm run lint && npm run build`.
3.  Smoke campaña 35 (01/09 vs 02/09, `min_calls=50`): 5 items — PACING GW20 (45.30% / AA 3.20%), AMD IPLAN2 (130/22), VOLUME −55.56% (189→84), ROUTING GW39 (7.03%, share 28.0%), SCHEDULE 10h (51 de 273); día faltante → `[]`.
4.  `stat` mtime `/data`: 1790080283 / 1790080255 intactos.
5.  `task.md` items en `[x]`.

## Flujo

1.  Spec 014 reescrita (spec/plan/task) → aprobación.
2.  config → repo (1 línea) → engine → tests backend.
3.  Panel agrupado + tests frontend.
4.  `pytest` + suite front + smoke + mtime → `task.md [x]`.

## Fuera de alcance

*   `/data`, esquema DB, contratos de endpoint, renombres de `type`, campo `scope`, funciones de repo nuevas, dependencias.
