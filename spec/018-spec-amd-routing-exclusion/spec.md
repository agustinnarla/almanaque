# Spec 018: Exclusión de gateways AMD del ruteo prioritario

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). El panel de recomendaciones no debe contradecirse: un troncal con divergencia de contestadores (AMD) no puede sugerirse como prioridad de ruteo.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — exclusión AMD en ROUTING]:** La regla `ROUTING` (Spec 014 RF2) **excluirá** de sus candidatos a todo dispositivo que cumpla el **mismo predicado** de `AMD_DIVERGENCE` (Spec 010 RF4 / Spec 014 RF5): `machine_answers ≥ REC_AMD_RATIO × agent_answers` (umbral **4.0**, en `config.py`), con las mismas convenciones de borde (`agent=0 y machine>0` → ratio infinito → excluido; `ambos=0` → no excluido por AMD).
    *   La exclusión aplica a **todos** los dispositivos que **cumplen el umbral**, **no** solo al top-1 que recibe la rec `AMD_DIVERGENCE` emitida (el cap=1 es solo para no saturar el panel; la troncal está descalificada por calidad mientras incumpla la proporción).
    *   Tras excluir, ROUTING elige el **siguiente mejor** `agent_answer_rate` entre los que sigan cumpliendo `total_calls ≥ min_calls` **y** `share ≥ REC_MIN_VOLUME_SHARE` (0.10).
    *   Si **no queda ningún candidato** tras la exclusión → **no se emite** ROUTING (misma semántica que «ninguno supera share»).
    *   `AMD_DIVERGENCE` **no cambia**: se sigue emitiendo igual (cap 1, peor ratio, umbral intacto).
    *   *Por qué:* Caso real rango 01→15: IPLAN es ROUTING (AA 7.19%) y AMD (8.376 automáticos vs 1.195 agentes) a la vez — consejo contradictorio.

*   **RF2 [Ubiquitous — sin cambio de contrato ni UI]:** Contrato de item `{id, type, category, entity, text}`, endpoints (`/compare/recommendations`, `/recommendations` rango), orden severidad/regla, cap `RECOMMENDATIONS_LIMIT` (5), `RecommendationsPanel` y constantes de `config.py` **intactos**. Solo cambia el `entity`/`text` de ROUTING cuando el ganador anterior era AMD-flagged.

*   **RF3 [Testing]:**
    *   `pytest`: (a) mejor AA con ratio AMD → excluido, gana el segundo con share; (b) único candidato con share es AMD → **sin** ROUTING; (c) dispositivo AMD **sin** rec emitida (cap=1, no es peor ratio) **igual** excluido de ROUTING; (d) regresión de los tests existentes.
    *   Smoke: rango 01→15 → ROUTING **GW37** (no IPLAN), AMD IPLAN presente; compare 01 vs 02 → **sin cambio** (GW39).

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 014 | RF2 ROUTING (candidatos) | Se agrega filtro de exclusión AMD; share/min_calls/texto intactos |
| 010 | RF1 ROUTING (día B) | Ya superado por 014; aquí se refina el pool de candidatos |

`AMD_DIVERGENCE` (010 RF4 / 014 RF5), contrato JSON y UI **no cambian**.

## Datos de entrada

*   Mismos `get_device_metrics` / `get_hourly_trend` (rango o A+B); rates derivados en runtime.
*   Constante reutilizada: `REC_AMD_RATIO` (sin cambio; no se agrega config nueva).

## Contrato JSON

Sin cambios de forma en ningún endpoint. **Puede cambiar** el `entity` de `rec_gw_routing` cuando el candidato anterior era AMD (ej. rango 35: IPLAN → GW37).

## Fuera de Alcance

*   Cambiar umbral/cap/nombre de AMD; nueva config; renombrar tipos.
*   Modificar PACING/SCHEDULE/VOLUME_DELTA; contrato; frontend; esquema DB; `/data`.
*   Excluir gateways AMD de otras reglas (PACING puede seguir alertando sobre un AMD).

## Criterios de Finalización

*   `_routing_rec` (o el caller) filtra con predicado AMD idéntico a `_amd_recs`.
*   `pytest -q` en verde (tests nuevos + regresión).
*   Smoke rango 01→15: ROUTING **GW37** (AA 5.99%, share 17.1%), AMD **IPLAN** sigue; PACING GW20 y SCHEDULE 11h intactas.
*   Smoke compare 01 vs 02: ROUTING **GW39** sin cambio; AMD IPLAN2 intacto.
*   `/data` mtime intacto; `task.md` en `[x]`.
