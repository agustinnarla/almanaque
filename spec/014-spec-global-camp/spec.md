# Spec 14: Recomendaciones Estratégicas sobre Acumulado de Campaña

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). El panel de recomendaciones debe leer el **consolidado** del período para decisiones estratégicas y evitar sesgos de muestras chicas (día B solo).

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — agregación consolidada]:** Mientras el sistema compare el Día A con el Día B, las reglas de **estrategia** (ROUTING, PACING, SCHEDULE, AMD_DIVERGENCE) se evaluarán sobre el **acumulado de `date_a` + `date_b`**, no sobre el día B solo.
    *   Agregación por gateway: `SUM(total_calls)`, `SUM(agent_answers)`, `SUM(busy_calls)`, `SUM(machine_answers)`, `SUM(congestion_calls)`.
    *   Agregación horaria: `SUM(agent_answers)` y `SUM(total_calls)` por `hora` sobre el consolidado.
    *   Implementación: reutilizar `get_device_metrics(conn, name, date_a, date_b)` y `get_hourly_trend(conn, name, date_a, date_b)` (ya agregan por rango). **Sin** funciones de repo nuevas ni cambios de esquema.
    *   *Por qué:* Hoy `build_compare_recommendations` usa `(date_b, date_b)` y las decisiones de ruteo/pacing/horario se toman con un solo día.

*   **RF2 [Event-driven — ruteo con representatividad]:** El sistema identificará el gateway con **mayor** `agent_answer_rate = agent_answers / total_calls` en el acumulado que cumpla **ambas** condiciones: `total_calls ≥ min_calls` **y** `share = total_calls(gateway) / total_calls(campaña en el período) ≥ REC_MIN_VOLUME_SHARE` (**0.10**, nueva constante en `config.py`).
    *   `type: "ROUTING"`, `category: "SUCCESS"`. Texto en español con la tasa y el share del período (ej. GW39: 7.03%, 28.0% del volumen).
    *   Si **ningún** gateway supera el share mínimo → **no se emite** ROUTING.
    *   *Por qué:* Evita sugerir ruteo hacia troncales con tasa buena pero volumen irrelevante; el ejemplo de negocio "gw39 con 7.0%" tiene 102 contactos con agente sobre 1451 intentos (share 28%).

*   **RF3 [Event-driven — pacing y saturación]:** Sin cambio de regla respecto de Spec 010 RF2: para troncales con `busy_rate ≥ DIAG_BUSY_THRESHOLD` (**0.35**, citar config — no hardcodear) en el acumulado, emitirá `type: "PACING"`, `category: "WARNING"` sobre el de **mayor** `busy_rate`.
    *   El `text` incluirá el `busy_rate` **y** el `agent_answer_rate` del troncal, enmarcando la saturación de línea como factor principal de la pérdida de contacto humano (ej. GW20: AA 3.20%, ocupado 45.30%).

*   **RF4 [Event-driven — ventana horaria pico]:** Sin cambio de regla respecto de Spec 010 RF3: sobre el acumulado (horas con `total_calls ≥ min_calls`), la hora con **mayor** `agent_answers` absolutas; `type: "SCHEDULE"`, `category: "SUCCESS"`, con vecinas ±1 h presentes.
    *   El `text` incluirá el detalle `X de Y en total`, donde `Y = SUM(agent_answers)` del período consolidado (ej. 10h: 51 de 273).

*   **RF5 [Event-driven — AMD conservando contrato]:** Sin cambio de **nombre ni regla** respecto de Spec 010 RF4: se conserva `type: "AMD_DIVERGENCE"` (**no** se renombra a `AMD_AUDIT`), umbral `machine_answers ≥ REC_AMD_RATIO × agent_answers` (4.0), cap de 1, peor ratio, acumulado A+B.
    *   El `text` se calibra al estilo de negocio: frecuencia de contestación del troncal + desbalance hacia automáticos frente a agentes + advertencia de evaluar por Answer Agent (ej. IPLAN2: 130 automáticos vs. 22 agentes).
    *   *Por qué:* Renombrar rompería `TYPE_LABELS` del frontend, 5 tests de `test_recommendations.py` y el contrato de Spec 010 RF6.

*   **RF6 [State-driven — delta de volumen sin cambio de regla]:** `VOLUME_DELTA` sigue siendo Spec 010 RF5: `((B − A) / A) × 100 ≤ REC_VOLUME_DROP_PCT` (−10.0) sobre `agent_answers` **absolutos día A vs día B** (no participa del acumulado RF1).
    *   Solo se refina el `text` para incluir los absolutos del ejemplo de negocio (ej. "bajó de 189 a 84, −55.56%").

*   **RF7 [UI — panel con agrupación por jerarquía operativa]:** `RecommendationsPanel` (en `frontend/src/components/Insights/`) seguirá consumiendo items con el contrato **sin cambios** `{id, type, category, entity, text}` (Spec 010 RF6 intacto) y los agrupará en el front por mapeo `type → sección`:
    *   **Estrategia de campaña:** `ROUTING`, `PACING`, `SCHEDULE`, `AMD_DIVERGENCE`.
    *   **Alertas del período:** `VOLUME_DELTA`.
    *   Encabezados de sección en **negrita**, títulos en español; se mantiene la estética actual (`bg-slate-900`, `border-l-4` por categoría, tipografía tabular en métricas).
    *   **Cap global `RECOMMENDATIONS_LIMIT` (5) sin cambio** — es un tope, no un mínimo: el panel renderice lo que el backend devuelva (`≤ 5`).

*   **RF8 [Testing y resiliencia]:**
    *   `pytest`: filters de share en ROUTING (gateway < 10% excluido; ninguno supera → sin ROUTING), textos nuevos de las 5 reglas, consolidado A+B en fixtures del endpoint, día faltante → `[]`, `len ≤ 5`.
    *   `vitest`: `RecommendationsPanel` con las dos secciones (fixtures con types de ambos grupos) y `[]` → empty-state.
    *   Regresión: `pytest -q` y `npm test` en verde.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 010 | RF1 ROUTING (día B) | Acumulado A+B + share ≥ 10% (RF1/RF2) |
| 010 | RF2 PACING (día B) | Evaluación sobre acumulado; umbral intacto |
| 010 | RF3 SCHEDULE (día B) | Evaluación sobre acumulado + texto "X de Y" |
| 010 | RF4 AMD_DIVERGENCE (día B) | Evaluación sobre acumulado; nombre/umbral/cap intactos |
| 010 | RF5 VOLUME_DELTA (regla) | **Sin cambio de regla**; solo `text` con absolutos (RF6) |
| 010 | RF7 UI (lista plana) | Panel con dos secciones agrupadas (RF7); contrato de item intacto |

Los endpoints y el esquema de la DB **no cambian**.

## Datos de entrada

*   Contadores ya materializados (Spec 011); rates derivados con `_rate` (Spec 012).
*   Acumulado vía `get_device_metrics` / `get_hourly_trend` con rango `date_a..date_b`; totales de `get_day_metrics` para VOLUME_DELTA y share de campaña (o suma de devices).
*   Constantes: `DIAG_BUSY_THRESHOLD`, `REC_AMD_RATIO`, `REC_VOLUME_DROP_PCT`, `RECOMMENDATIONS_LIMIT` (sin cambio) + nueva `REC_MIN_VOLUME_SHARE = 0.10`.

## Contrato JSON

Sin cambios de forma en `GET /api/campaigns/{name}/compare/recommendations` (Spec 010 RF6): `{campaign, date_a, date_b, min_calls_applied, recommendations[]}`; item `{id, type, category, entity, text}`. **Cambian valores y textos** tras el deploy (sin re-ingesta).

Ejemplo esperado (campaña 35, 2026-09-01 vs 2026-09-02, `min_calls=50`):

```json
[
  {"id": "rec_gw_pacing", "type": "PACING", "category": "WARNING", "entity": "GW20", "text": "GW20 combina una tasa de Answer Agent de 3.20% con línea ocupada del 45.30%: la saturación de línea es el principal factor de esa pérdida de contacto humano. Recomendación: revisar el volumen de marcado simultáneo asignado a ese dispositivo."},
  {"id": "rec_amd_divergence_iplan2", "type": "AMD_DIVERGENCE", "category": "WARNING", "entity": "IPLAN2", "text": "IPLAN2 descolga con frecuencia, pero la mayoría de sus contestaciones son automáticas (130) frente a solo 22 respuestas humanas. No sobreestimar la calidad de esa troncal: evaluarla por Answer Agent."},
  {"id": "rec_volume_drop", "type": "VOLUME_DELTA", "category": "WARNING", "entity": "35", "text": "El volumen de Answer Agent bajó de 189 a 84 (−55.56%) entre el Día A y el Día B. Vale la pena auditar cambios en la operación: dispositivos, horarios o calidad de la base."},
  {"id": "rec_gw_routing", "type": "ROUTING", "category": "SUCCESS", "entity": "GW39", "text": "GW39 tiene la mejor tasa de Answer Agent (7.03%) del período consolidado y concentra el 28.0% del volumen de intentos. Si hay margen para redistribuir marcado, priorizarlo en las franjas de mayor volumen debería subir la contactación general."},
  {"id": "rec_peak_hour", "type": "SCHEDULE", "category": "SUCCESS", "entity": "10", "text": "La franja con más intentos atendidos por un agente es la 10h (51 de 273 en total; vecinas: 9h, 11h). Concentrar el marcado en esa hora y las adyacentes puede mejorar el rendimiento sin sumar más volumen total."}
]
```

Sin datos / día faltante → misma estructura con `recommendations: []`, HTTP 200.

## Fuera de Alcance

*   Modificar archivos crudos en `/data` o el esquema de la DB.
*   Nuevos endpoints; cambios en `compare/diagnostics`.
*   Renombrar tipos de recomendación (`AMD_DIVERGENCE` se mantiene).
*   Agregar campo `scope` u otros al item del contrato (la agrupación es del frontend).
*   Soporte de "período total" arbitrario (solo `date_a` + `date_b`); models predictivos; librerías nuevas.
*   Reescribir Specs 001–013 in-place.

## Criterios de Finalización

*   `config.py` con `REC_MIN_VOLUME_SHARE = 0.10`; resto de constantes intactas.
*   `build_compare_recommendations` pasa `(date_a, date_b)` a devices/hourly; **sin** `get_campaign_aggregate_metrics` ni SQL nuevo.
*   `build_recommendations` con firma intacta; textos de las 5 reglas calibrados; ROUTING filtra por share.
*   `RecommendationsPanel` con secciones «Estrategia de campaña» y «Alertas del período».
*   `pytest -q` en verde (tests de share + textos actualizados).
*   `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` en verde.
*   Smoke campaña 35 (01/09 vs 02/09, `min_calls=50`) — 5 items en orden severidad/regla: **PACING GW20** (busy 45.30%, AA 3.20%), **AMD IPLAN2** (130/22), **VOLUME_DELTA** (189→84, −55.56%), **ROUTING GW39** (7.03%, share 28.0%), **SCHEDULE 10h** (51 de 273, vecinas 9h/11h).
*   Día faltante (2030-01-01) → `recommendations: []` y 200.
*   `/data` sin modificaciones (mtime intacto: 1790080283 / 1790080255).
