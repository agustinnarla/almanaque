# Plan: Spec 011 — Redefinicion de Agent Answer + recalibracion de umbrales

## Contexto

Definicion correcta de AA: **ESTADO == ANSWER AND SUB_ESTADO == AGENT**. La formula anterior incluia QUEUED y ANSWER sin subestado (inflaba AA ~36%).

Bug bloqueante: metrics_engine.py:46 usa "ESTADO" + "SUB_ESTADO" -> KeyError ESTADOSUB_ESTADO. **8 tests fallan**; re-ingesta crashea.

Escala nueva AA ~5-7% -> umbrales actuales (0.15) quedarian ciegos/saturados.

## Decisiones aprobadas

1. agent_answers = ESTADO == ANSWER and SUB_ESTADO == AGENT
2. Denominador AA = total - machine (sin cambio)
3. avg_wait_time_sec restringido a AGENT
4. Recalibracion completa de umbrales (tabla)
5. Bug KeyError en misma iteracion
6. Documentacion en **Spec 011** nueva (spec/011-spec-aa-redefinition/)
7. Re-ingesta via backend/main.py -> replace_day (sin tocar /data)

## Umbrales aprobados

| Constante | Actual | Nuevo |
|-----------|--------|-------|
| AGENT_ANSWER_THRESHOLD | 0.15 | **0.06** |
| DIAG_PEAK_THRESHOLD | 0.15 | **0.075** |
| DIAG_BASE_DROP_THRESHOLD | -0.03 | **-0.015** |
| DIAG_BASE_DROP_WARNING | -0.015 | **-0.0075** |
| DIAG_BASE_IMPROVEMENT_SUCCESS | 0.030 | **0.015** |
| DIAG_BASE_IMPROVEMENT_WARNING | 0.015 | **0.0075** |
| Health bands (front) | >=0 / >=-10 | **>=0 Saludable · >=-25 Aceptable · < -25 Critico** |
| DIAG_CONGESTION_*, DIAG_BUSY_*, REC_*, pesos | - | sin cambio |

### Datos de justificacion (campaign 35)

| Metrica | Vieja | Nueva |
|---------|-------|-------|
| AA dia 01 / 02 | 10.81% / 8.87% | **7.04% / 5.48%** |
| Health dia 01 / 02 | ~-15.8 | **-18.4 / -19.2** |
| Health devices | - | GW39 -7.8 · IPLAN2 -10.2 · GW37 -23.8 · GW20 -26.8 |
| Delta dia AA | - | **-1.56 pp** -> CRITICAL |
| peak_hours @0.075 | 0 | horas 9-12 |
| patterns @0.06 | todas | solo dia 02 |

## Spec 011

Crear spec/011-spec-aa-redefinition/{spec,plan,task}.md:

- RF1: agent_answers = count ANSWER and AGENT
- RF2: machine_answers sin cambio
- RF3: wait solo AGENT + CONEXION valida
- RF4: abandon sin cambio
- RF5: tabla umbrales + health bands
- RF6: re-ingesta replace_day; /data intacto
- Specs superadas: 001-RF4, 002-RF1/RF2, 006-RF5 peak, 007-RF4 BASE_*, 008 health bands

## Cambios de codigo

### Backend
1. metrics_engine.py: fix bug; is_agent mask; AGENT_SUBSTATE=AGENT; wait = is_agent and is_connected
2. config.py: 6 constantes
3. data_cleaner.py: normalizar SUB_ESTADO upper+strip (hoy solo string)
4. Tests: test_processor.py fixtures SUB=AGENT donde simula humana; casos QUEUED/vacio excluidos; revisar otros test_*.py

### Frontend
5. healthStyle.ts bandas >=0/>=-25/<-25; Badge.test.tsx (-15.77->Aceptable, -26.8->Critico)

### Specs
6. Specs 001-010 NO se reescriben in-place; Spec 011 declara superacion

## Flujo

1. Escribir Spec 011 y presentar al usuario (Constitucion #5)
2. Tras aprobacion:
   - [ ] Fix metrics_engine.py
   - [ ] Normalizar SUB_ESTADO si aplica
   - [ ] config.py 6 constantes
   - [ ] Tests backend
   - [ ] healthStyle.ts + test
   - [ ] pytest -q 0 failed
   - [ ] npm test && tsc && lint && build verde
   - [ ] Re-ingesta python backend/main.py
   - [ ] Smoke AA 7.04%/5.48%, >=1 peak, patterns solo <0.06
   - [ ] task.md [x]

## Verificacion

- .venv/Scripts/python -m pytest -q -> 0 failed
- Frontend suite verde
- Re-ingesta sin KeyError
- /data sin modificaciones (mtime intacto)

## Riesgos

- Tests con SUB=None asumen agent -> actualizar fixtures
- REC_AMD_RATIO=2.0 dispara mas con agents bajos -> verificar smoke; escalar a 3.0 solo si satura (revision manual)
- pattern_detector/engines sin cambio de codigo (leen DB corregida)

## Fuera de alcance

- Modificar /data
- Cambiar esquema DB o contratos API
- Tocar engines de recomendaciones/diagnostico (logica)
- Reescribir Specs 001-010
- Anadir dependencias
