# Task 07: Diagnóstico Comparativo Día a Día

## 1. Config y engine
- [x] `config.py`: umbrales de degradación/congestión/mix + `ROOT_CAUSES_LIMIT`.
- [x] Crear `services/diagnostics_engine.py` con `evaluate_causes` puro y `delta_percentage`.

## 2. Repo y endpoint
- [x] `campaigns_repo`: `get_day_totals`, `get_breakdown_by_base`, `get_breakdown_by_device` (con `min_calls`).
- [x] `routers/campaigns.py`: `GET /{campaign_name}/compare/diagnostics` (date_a, date_b, min_calls ge=1).

## 3. Tests y cierre (incremento base)
- [x] `test_diagnostics.py`: caída de base (CRITICAL), congestión WARNING/CRITICAL, mix, top-5, `AA_a=0`, orden.
- [x] `test_api.py`: contrato; fechas inexistentes → 200 + nulls; regresión.
- [x] `pytest` en verde (001–007).
- [x] Smoke campaign 35 con `date_a=2026-09-01`, `date_b=2026-09-02`.
- [x] Sensibilidad: `DIAG_BASE_DROP_WARNING = -0.015` → BASE_DEGRADATION WARNING.

## 4. Incremento: positivos + insights
- [x] `config.py`: `DIAG_BASE_IMPROVEMENT_WARNING/SUCCESS`, `DIAG_CONGESTION_RECOVERY_WARNING/SUCCESS`.
- [x] Engine: `BASE_IMPROVEMENT`, `NETWORK_RECOVERY`, `TRAFFIC_MIX` bifurcado (AA vs promedio día B).
- [x] Payload: `root_causes` (solo negativos), `positive_drivers` (solo SUCCESS/INFO), `insights` (+ `polarity`); orden CRITICAL→WARNING→SUCCESS→INFO, cap 5 × 3.
- [x] Repo: expone las 3 colecciones; día faltante → 3 × `[]`.
- [x] Actualizar `spec.md`, `plan.md`, `task.md`.
- [x] Tests: `positive_drivers` e `insights` en engine y API.
- [x] `pytest` verde + smoke exigiendo **GW37 → NETWORK_RECOVERY**.
- [x] Marcar incremento `[x]`.

## 5. Incremento: KPI summary (RF6 / Spec 008)
- [x] `summary` con `total_calls_a/b`, `delta_total_pct`, `busy_rate_a/b`, `congestion_rate`, `health_score` (día B).
- [x] Tests de contrato actualizados; `pytest` en verde.
- [x] Documentación RF6 en `spec.md` y task `[x]`.
