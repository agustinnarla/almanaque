# Spec 12: Agent Answer sobre intentos totales (total_calls)

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). Revisión de la métrica núcleo tras Spec 011.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — denominador de AA]:** Mientras el sistema calcule `agent_answer_rate`, el denominador será **`total_calls`** (todas las llamadas / intentos del día o segmento), **no** `total_calls − machine_answers`.
    *   Fórmula: `agent_answer_rate = agent_answers / total_calls`; si `total_calls ≤ 0` → `null`.
    *   *Por qué:* El indicador debe responder "¿de todos los intentos, cuántos llegaron a un agente?"; hoy el AMD se excluye del denominador y oculta la calidad real de la operación.

*   **RF2 [State-driven — numerador sin cambio]:** `agent_answers` sigue contando solo `ESTADO == "ANSWER"` ∧ `SUB_ESTADO == "AGENT"` (Spec 011 RF1). Contadores de DB intactos.
    *   *Por qué:* Solo cambia la tasa, no el conteo de atenciones humanas.

*   **RF3 [State-driven — patrones]:** `pattern_detector` usará el mismo denominador `total_calls`; si `total_calls ≤ 0` la campaña-día **se excluye** de alertas (sin intentos no hay evaluación).

*   **RF4 [State-driven — umbrales recalibrados]:** Dada la nueva escala de AA (~4.4–5.8% en los datos de referencia), se actualizan en `config.py`:

    | Constante | Antes (Spec 011) | Ahora |
    |-----------|------------------|-------|
    | `AGENT_ANSWER_THRESHOLD` | 0.06 | **0.05** |
    | `DIAG_PEAK_THRESHOLD` | 0.075 | **0.06** |
    | `DIAG_BASE_DROP_THRESHOLD` | −0.015 | **−0.012** |
    | `DIAG_BASE_DROP_WARNING` | −0.0075 | **−0.006** |
    | `DIAG_BASE_IMPROVEMENT_SUCCESS` | 0.015 | **0.012** |
    | `DIAG_BASE_IMPROVEMENT_WARNING` | 0.0075 | **0.006** |

    Sin cambios: `DIAG_CONGESTION_*`, `DIAG_BUSY_*`, `DIAG_MIX_SHARE_THRESHOLD`, `REC_*`, pesos `HEALTH_WEIGHT_*`, `ROOT_CAUSES_LIMIT`, `RECOMMENDATIONS_LIMIT`.

    Bandas `healthStyle.ts` (Spec 011) se **mantienen**: ≥0 Saludable / ≥−25 Aceptable / <−25 Crítico.

*   **RF5 [Ubiquitous — rates derivados]:** `daily_campaign_metrics` no almacena rates; `_rate` y `pattern_detector` se recalculan en cada lectura. **No se requiere re-ingesta** de `/data` ni cambio de esquema.
    *   *Por qué:* Solo cambia la fórmula de derivación; los contadores ya están correctos desde Spec 011.

*   **RF6 [Unwanted behavior — cero regresión]:** Rankings, health, diagnostics, recommendations y charts consumen `agent_answer_rate` del repo; no duplican la fórmula `total − machine` en frontend ni engines.
    *   *Por qué:* Una sola fuente de verdad para la tasa.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 002 | RF1 fórmula tasa AA | Denominador pasa a `total_calls` |
| 003 | RF2 / RF4 fórmula y ranking | Igual que RF1 |
| 004 | Fórmula AA en hourly-trend | Igual que RF1 |
| 005 | Fórmula AA en devices | Igual que RF1 |
| 006 | (vía umbrales) peak / health scale | RF4 recalibra `DIAG_PEAK_*` |
| 007 | Umbrales base drop/improvement | RF4 |
| 011 | RF1 denominador (parcial) y RF5 umbrales | Numerador AGENT se mantiene; denominador y umbrales cambian |

Los endpoints, contratos JSON y esquema de la DB **no cambian**.

## Datos de entrada

*   Contadores ya materializados: `total_calls`, `agent_answers`, `machine_answers` (sin cambios).
*   Rates se derivan en `campaigns_repo._rate` y `services/pattern_detector.evaluate_campaigns`.

## Contrato JSON

Sin cambios de forma. `agent_answer_rate` y derivados (`health_score`, `peak_hours`, rankings, diagnostics, recommendations) conservan tipo; **cambian valores** tras el deploy del código (sin re-ingesta).

## Fuera de Alcance

*   Modificar archivos crudos en `/data`.
*   Cambiar esquema de la DB o contratos de la API.
*   Reescribir Specs 001–011 in-place (solo se declaran superadas).
*   Cambiar contadores de `metrics_engine` ni la definición AGENT de Spec 011.
*   Añadir dependencias.

## Criterios de Finalización

*   `_rate` y `pattern_detector` con denominador `total_calls`.
*   `config.py` con los 6 umbrales de RF4; `healthStyle.ts` sin cambio de bandas.
*   `pytest -q` en verde.
*   Suite frontend en verde (sin cambio de código front salvo tests si assertions dependían de rates viejos).
*   Smoke campaña 35: AA 01 ≈ **0.0576**, AA 02 ≈ **0.0441**; `patterns` solo bajo 0.05; `peak_hours` con umbral 0.06; recommendations sigue con 5 tipos.
*   `/data` sin modificaciones (mtime intacto).
