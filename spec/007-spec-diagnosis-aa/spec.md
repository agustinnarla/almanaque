# Spec 07: Diagnóstico Comparativo Día a Día (Atribución AA)

## Usuario

Desarrollador junior / frontend del dashboard (análisis de caídas y mejoras de Agent Answer).

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous]:** `GET /api/campaigns/{campaign_name}/compare/diagnostics?date_a=&date_b=&min_calls=` compara el día **A (referencia)** con el **B (comparado)**. `min_calls` entero default **50**, `ge=1`.
    *   *Nota:* No confundir con `GET .../diagnostics` de Spec 006 (estados absolutos de un rango). Este endpoint explica **deltas entre dos fechas**.
*   **RF2 [Descomposición por Base]:** Para cada base con `total_calls ≥ min_calls` **en ambos días**, calcula `delta_rate = agent_answer_rate_b − agent_answer_rate_a` y su share del total.
    *   Genera `BASE_DEGRADATION`, `BASE_IMPROVEMENT` y/o `TRAFFIC_MIX` según RF4.
    *   *Limitación conocida:* bases que colapsan bajo `min_calls` en B no entran al análisis (decisión de producto).
*   **RF3 [Red — degradación y recuperación]:**
    *   **Congestión:** si `congestion_rate` global sube `≥ DIAG_CONGESTION_DELTA_THRESHOLD` (0.02), el gateway con **mayor** alza alimenta `NETWORK_CONGESTION` (CRITICAL si su delta ≥ 0.05, si no WARNING).
    *   **Recuperación:** el gateway con **mayor bajada** de congestión (más negativo) alimenta `NETWORK_RECOVERY` si `delta_congestion ≤ DIAG_CONGESTION_RECOVERY_WARNING` (−0.020) → **INFO**, o `≤ DIAG_CONGESTION_RECOVERY_SUCCESS` (−0.040) → **SUCCESS**.
    *   Gateways siempre `≥ min_calls` en ambos días.
*   **RF4 [Eventos y colecciones]:** El payload incluye **tres listas** de `{severity, type, entity, message}` (español):
    *   **`root_causes`**: exclusivamente eventos **negativos** (`CRITICAL`, `WARNING`):
        *   `BASE_DEGRADATION`: `delta ≤ −0.03` → CRITICAL; `≤ −0.015` → WARNING (solo pp absolutos).
        *   `NETWORK_CONGESTION`: según RF3.
        *   `TRAFFIC_MIX` (negativo): share `≥ DIAG_MIX_SHARE_THRESHOLD` (0.05) **y** `AA_base_B <` promedio (`summary.agent_answer_rate_b`) → **WARNING**.
    *   **`positive_drivers`**: exclusivamente eventos **favorables** (`SUCCESS`, `INFO`):
        *   `BASE_IMPROVEMENT`: `delta ≥ DIAG_BASE_IMPROVEMENT_SUCCESS` (0.030) → SUCCESS; `≥ DIAG_BASE_IMPROVEMENT_WARNING` (0.015) → INFO.
        *   `NETWORK_RECOVERY`: según RF3.
        *   `TRAFFIC_MIX` (positivo): share `≥ 0.05` **y** `AA_base_B ≥` promedio → **INFO**.
    *   **`insights`**: unión de ambos con campo **`polarity`: `"POSITIVE"` | `"NEGATIVE"`**.
    *   Orden en las tres listas: severidad `CRITICAL → WARNING → SUCCESS → INFO`, empate por **\|impacto\| desc**; **cap `ROOT_CAUSES_LIMIT` (5)** en cada lista.
*   **RF5 [Unwanted behavior]:** Si **falta uno de los dos días**: `summary`, `bases_comparison`, `gateways_comparison` → **`null`** y `root_causes` / `positive_drivers` / `insights` → **`[]`**, HTTP **200**.
    *   Días presentes pero **0 segmentos** ≥ `min_calls`: `summary` poblado, listas `[]` (o solo lo que dispare el engine con lo disponible).
    *   `summary.delta_percentage`: `((AA_b − AA_a) / AA_a) × 100` a 2 decimales; si `AA_a` es `null` o 0 → `null`.
*   **RF6 [KPI Summary (Spec 008)]:** Cuando ambos días existen, `summary` incluye además:
    *   `total_calls_a`, `total_calls_b`, `delta_total_pct` (relativo, 2 decimales; `total_a = 0` → `null`).
    *   `busy_rate_a`, `busy_rate_b`, `congestion_rate` (= congestión del día B, “estado actual”).
    *   `health_score` = `compute_health_score(AA_b, busy_b, cong_b)` (día B); si algún rate es `null` → `null`.
    *   *Por qué:* Los KPI del dashboard Spec 008 se alimentan de un solo payload.

## Fuera de Alcance

*   Modelos predictivos / regresión multivariable.
*   Comparar 3+ días en un endpoint.
*   Bases o gateways con < `min_calls` en **cualquiera** de los dos días.

## Criterios de Finalización

*   Umbrales positivos en `config.py`; engine devuelve las **3** colecciones con polarity en `insights`.
*   `root_causes` sin SUCCESS/INFO; `positive_drivers` sin CRITICAL/WARNING; cap 5 × 3.
*   Día faltante → 200 + bloques `null` + las 3 listas `[]`.
*   `summary` con totales, busy, congestión y `health_score` (RF6) cuando hay ambos días.
*   `pytest` verde (Spec 01–07); smoke 2026-09-01/02 con **GW37 → NETWORK_RECOVERY**.
