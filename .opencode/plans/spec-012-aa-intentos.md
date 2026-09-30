# Plan: Spec 12 — Agent Answer sobre intentos totales (total_calls)

## Contexto

Hoy (Spec 011): AA = agent_answers / (total_calls − machine_answers).
Decisiones aprobadas:
1. Denominador = **total_calls** (todas las llamadas = intentos).
2. **Recalibrar** todos los umbrales AA en la misma spec.
3. Aplicar en **todo el sistema** (repo, patterns, health, diagnostics, recommendations).

Impacto real campaign 35:
- 01/09: 7.04% → **5.76%**
- 02/09: 5.48% → **4.41%**
- Escala ≈ ×0.80 respecto a Spec 011.

**Importante:** `daily_campaign_metrics` solo guarda **contadores**; `agent_answer_rate` se deriva en runtime (`_rate` / `pattern_detector`). → **No requiere re-ingesta** de /data.

## Decisiones a proponer al usuario

### Umbrales propuestos (×0.8 de Spec 011, validados con datos)

| Constante | Spec 011 | Spec 012 propuesto | Rationale (datos reales) |
|-----------|----------|--------------------|--------------------------|
| AGENT_ANSWER_THRESHOLD | 0.06 | **0.05** | Día A 5.76% sano; día B 4.41% alerta (mismo patrón que 0.06 en Spec 011) |
| DIAG_PEAK_THRESHOLD | 0.075 | **0.06** | Pico día B = 12h 7.25%; 11h 6.51% entran; 9h 5.61% queda fuera |
| DIAG_BASE_DROP_THRESHOLD | −0.015 | **−0.012** | Base 80 delta nuevo −0.0103 → WARNING (como antes ~−0.012) |
| DIAG_BASE_DROP_WARNING | −0.0075 | **−0.006** | Misma proporción |
| DIAG_BASE_IMPROVEMENT_SUCCESS | 0.015 | **0.012** | Base 34 +0.149 sigue SUCCESS |
| DIAG_BASE_IMPROVEMENT_WARNING | 0.0075 | **0.006** | Misma proporción |

Sin cambios: DIAG_CONGESTION_*, DIAG_BUSY_*, DIAG_MIX_SHARE_THRESHOLD (0.05), REC_*, HEALTH_WEIGHT_*, ROOT_CAUSES_LIMIT, RECOMMENDATIONS_LIMIT.

### Health bands (healthStyle.ts)
Propuesta: **mantener** ≥0 Saludable / ≥−25 Aceptable / <−25 Crítico.
Con AA nuevo, devices día B: GW20 −28.1, IPLAN2 −13.3, GW39 −11.8, GW37 −21.8 → solo GW20 crítico.

## Cambios de codigo

### 1. backend/repositories/campaigns_repo.py
- `_rate`: `denominator = total_calls`; si total ≤ 0 → None. Ignorar machines en la fórmula (o limpiar firma y call sites).

### 2. backend/services/pattern_detector.py
- `denominator = total_calls` (quitar `- machine_answers`).

### 3. backend/config.py
- Aplicar tabla de umbrales anterior.

### 4. Sin cambios de formula en
- metrics_engine (contadores intactos)
- health.py / diagnostics_engine / recommendations_engine (leen rates del repo)
- Frontend (solo healthStyle si cambian bandas)

### 5. Re-ingesta
- **No necesaria** (rates derivados, no materializados). Solo smoke post-cambio.

### 6. Tests
- test_api: seeds con rates esperados → recalcular (ej. 38/290 vs 38/total).
- test_recommendations: fixture `denom = total_calls`.
- test_diagnostics / test_health: revisar assertions si usan división explicita.
- test_processor: sin cambio (contadores).
- patterns: denominador total; caso total=0 → excluida.

### 7. Docs — Spec 012 nueva (patrón Spec 011, no reescribir 001–011 in-place)
- spec/plan/task: RF1 fórmula, RF2 umbrales, RF3 rates derivados (sin re-ingesta), RF4 bandas, criterios de aceptación.
- Specs superadas: 002 RF1, 003 RF2/RF4, 004 fórmula, 005 fórmula, 011 RF1/RF5 (denominador y umbrales).

## Fuera de alcance
- Contadores de metrics_engine
- Esquema DB / contratos JSON
- /data intocable
- recommendations AMD cap (ya en Spec 010 amend)

## Verificacion
1. pytest -q verde
2. Smoke campaign 35:
   - summary AA 01 ≈ 0.0576, 02 ≈ 0.0441
   - patterns solo bajo 0.05
   - peak_hours con umbral 0.06
   - recommendations 5 tipos (no regresión AMD)
3. Frontend: vitest/tsc/lint/build
4. /data mtime intacto

## Flujo
1. Preguntar: ¿aceptar umbrales propuestos + bandas health?
2. Tras OK: Spec 012 docs → config → _rate → pattern_detector → tests → pytest → smoke → task [x]
