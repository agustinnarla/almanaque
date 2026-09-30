# Plan 07: Diagnóstico Comparativo Día a Día

## 1. Config

```python
DIAG_CONGESTION_DELTA_THRESHOLD = 0.02
DIAG_CONGESTION_CRITICAL = 0.05
DIAG_BASE_DROP_THRESHOLD = -0.03
DIAG_BASE_DROP_WARNING = -0.015
DIAG_MIX_SHARE_THRESHOLD = 0.05
DIAG_BASE_IMPROVEMENT_WARNING = 0.015
DIAG_BASE_IMPROVEMENT_SUCCESS = 0.030
DIAG_CONGESTION_RECOVERY_WARNING = -0.020
DIAG_CONGESTION_RECOVERY_SUCCESS = -0.040
ROOT_CAUSES_LIMIT = 5
```

## 2. Repo (`campaigns_repo`)

*   `get_day_totals`, `get_breakdown_by_base`, `get_breakdown_by_device` con `min_calls`.
*   Inter de segmentos en A y B; summary sin filtro `min_calls`.
*   `build_compare_diagnostics` arma el payload con `root_causes`, `positive_drivers`, `insights`.

## 3. Engine puro (`services/diagnostics_engine.py`)

*   `evaluate_causes(...) -> {root_causes, positive_drivers, insights}`.
*   Matriz de eventos (ver `spec.md` RF4): degradación/mejora de base, mix según AA vs promedio día B, congestión y recovery de gateway.
*   Orden `CRITICAL → WARNING → SUCCESS → INFO`, `|impact|` desc, cap 5 en cada colección; `insights` agrega `polarity`.

## 4. Endpoint

`GET /{campaign_name}/compare/diagnostics` → repo + engine.

## 5. Decisiones

*   **A:** `min_calls` ambos días (limitación documentada).
*   **B:** triggers de base en pp absolutas; mensajes pueden incluir % relativo.
*   **C:** matriz fija de severidades + cap 5 × 3 listas.
*   **D:** `null` de bloques solo si falta el día.
*   **E:** positivos INFO/SUCCESS en `positive_drivers`; `TRAFFIC_MIX` se bifurca por `AA_base_B` vs promedio global día B.

## 6. Tests

*   `test_diagnostics.py`: mejora base INFO/SUCCESS, recovery GW INFO/SUCCESS, mix WARNING vs INFO por promedio, exclusión cruzada de severidades, orden+cap, polarity en insights.
*   `test_api.py`: claves del contrato, día faltante con 3 listas `[]`, regresión 001–006.
