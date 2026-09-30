# Plan: Spec 010 RF4 — Cap AMD a 1 recomendacion + REC_AMD_RATIO = 4.0

## Contexto

Smoke actual (campana 35, 01/09 vs 02/09) ocupa los 5 slots con:
PACING GW20 + 4x AMD_DIVERGENCE (GW37, GW20, GW39, IPLAN2).
Se pierden ROUTING, SCHEDULE (pico) y VOLUME_DELTA.

Ratios reales dia B (machine/agent):
- GW20 8.20, IPLAN2 4.60, GW37 4.36 -> califican a 4.0
- GW39 3.27 -> queda fuera con 4.0

## Decisiones aprobadas

1. REC_AMD_RATIO = 4.0
2. AMD emite como maximo 1 recomendacion: peor ratio (machine/agent); agents=0 con machines>0 = peor; empate por total_calls DESC
3. Documentar enmendando Spec 010 RF4 (spec.md, plan.md, task.md) — no Spec 012

## Cambios de codigo

### 1. backend/config.py
- REC_AMD_RATIO = 2.0 -> 4.0

### 2. backend/services/recommendations_engine.py
- Funcion _amd_recs: filtrar candidatos con machines >= REC_AMD_RATIO * agents
  (misma logica de firing: ambos 0 -> no; agent=0 y machine>0 -> si)
- Ordenar por ratio DESC (no total_calls); ratio infinito si agents=0 y machines>0
- Empate: total_calls DESC
- Retornar como maximo 1 item (slice [:1])
- _amd_rec sin cambios de texto/id

### 3. backend/test_recommendations.py
- Ajustar test_amd_fires_when_machines_double_agents: ratio 25/10=2.5 ya no califica a 4.0
  -> usar machines=40 (ratio 4.0) o 45
- test_amd_fires_when_zero_agents_with_machines: sigue fireando
- test_amd_absent_below_ratio: sigue ok
- Nuevo test: 2+ devices calificando -> solo 1 AMD_DIVERGENCE; entity = peor ratio
- test_cap_respected: con max 1 AMD, aun <= RECOMMENDATIONS_LIMIT
- Revisar test_order_warnings_before_success_then_rule_order si involucra AMD

### 4. backend/test_api.py
- Seed recommendations no depende de AMD multi-fire para el contrato
  (PACING/VOLUME/ROUTING/SCHEDULE ya se exigen en test_recommendations_contract)
- Si algun test asume multi-AMD, ajustar

### 5. Docs — Spec 010
- spec.md RF4: umbral 4.0, maximo 1 AMD, seleccion por peor ratio
- plan.md RF4: misma descripcion
- task.md: item nuevo marcado [x] al cerrar

## Fuera de alcance
- Frontend (panel no cambia; label Contestadores se queda)
- Endpoint / contrato JSON
- Otras reglas (ROUTING/PACING/SCHEDULE/VOLUME)
- RECOMMENDATIONS_LIMIT (sigue en 5)

## Verificacion
1. pytest -q -> 0 failed
2. Smoke campaign 35: recommendations debe incluir PACING, AMD (<=1),
   VOLUME_DELTA, ROUTING, SCHEDULE (5 tipos, 5 slots)
3. /data sin tocar

## Flujo
1. Presentar plan al usuario (modo plan)
2. Tras aprobacion: config -> engine -> tests -> docs -> pytest -> smoke -> task [x]
