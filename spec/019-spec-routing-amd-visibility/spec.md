# Spec 019: Exclusión AMD visible en la tarjeta de Ruteo

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). Cuando un gateway con divergencia de contestadores queda fuera del ruteo prioritario (Spec 018), el panel debe **explicarlo** y ofrecer un plan de acción, en lugar de mostrar solo el ganador sin contexto.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — campo `excluded_amd` en ROUTING]:** El item `type: "ROUTING"` incluirá un campo opcional `excluded_amd: string[]` con los `device` que cumplían los criterios de candidatura a ruteo (`agent_answer_rate ≠ null`, `share ≥ REC_MIN_VOLUME_SHARE`, `total_calls ≥ min_calls` implícito por el pool de elegibles) **y** el predicado AMD (`_is_amd_hit`: `machine ≥ REC_AMD_RATIO × agent`), es decir los que la exclusión de Spec 018 sacó de competir.
    *   **Solo** en items `ROUTING`; las otras reglas (PACING, SCHEDULE, AMD_DIVERGENCE, VOLUME_DELTA) **no** llevan la clave (shape base intacto).
    *   Si no hay AMD excluido relevante → **omitir** la clave (no enviar `[]`).
    *   Si ROUTING no se emite → no hay item, no hay campo (sin cambio defensivo).
    *   El `text` de ROUTING **no cambia**.
    *   *Por qué:* El usuario necesita ver *por qué* el #1 de AA (p. ej. IPLAN) no aparece como sugerencia de ruteo.

*   **RF2 [UI — badge de exclusión y plan de acción]:** `RecommendationCard` en `RecommendationsPanel` renderizará, cuando `type === 'ROUTING'` y `excluded_amd?.length > 0`, un badge debajo del `text`:
    *   Título: **«Descartado del ruteo por contestadores»**.
    *   Cuerpo (ES, por cada entidad): `<device> no compite por prioridad de marcado mientras su ratio de automáticos ≥ 4× agentes. Plan: corregir AMD/troncal → puede volver a ser candidato a ruteo.`
    *   Estética sobre tarjeta oscura: fondo ámbar tenue, borde `amber`, texto claro, ícono `AlertTriangle` (lucide).
    *   Sin `excluded_amd` → sin badge (comportamiento actual intacto).

*   **RF3 [Testing]:**
    *   `pytest`: (a) ROUTING con AMD excluido con share → `excluded_amd == ["<device>"]`; (b) sin AMD relevante → **sin** la clave; (c) AMD sin share de routing → no aparece en `excluded_amd`; (d) shape base 5 claves para no-ROUTING, ROUTING puede tener 6; (e) regresión (140 actuales).
    *   `vitest`: badge visible con campo; aserción negativa sin él; regresión de los 4 tests del panel.
    *   Smoke: rango 01→15 → GW37 + `excluded_amd: ["IPLAN"]`; compare 01 vs 02 → GW39 + `excluded_amd: ["IPLAN2"]`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 010 | RF6 shape del item (`5 claves`) | ROUTING gana clave opcional `excluded_amd`; resto intacto |
| 018 | RF2 «contrato intacto / UI intacta» | Contrato **ampliado opcionalmente**; UI agrega badge |

`AMD_DIVERGENCE`, umbral/cap, orden, cap global, endpoints (mismo path) y `/data` **no cambian**.

## Datos de entrada

*   Mismos `devices` del engine (rango o A+B); predicado `_is_amd_hit` (Spec 018).
*   Sin config nueva; sin SQL; sin cambios de esquema.

## Contrato JSON

Item base (todas las reglas): `{id, type, category, entity, text}`.
Item ROUTING **puede** sumar: `"excluded_amd": ["IPLAN", ...]` (solo si no-vacío).

Ejemplo rango 35 (01→15):
```json
{"id": "rec_gw_routing", "type": "ROUTING", "category": "SUCCESS", "entity": "GW37", "text": "GW37 tiene la mejor tasa de Answer Agent (5.99%)...", "excluded_amd": ["IPLAN"]}
```

## Fuera de Alcance

*   Cambiar `text` de ROUTING; umbral/cap AMD; PACING/SCHEDULE/VOLUME; empty-states; orden/cap.
*   Esquema DB; `/data`; auth; deploy; renombrar tipos.

## Criterios de Finalización

*   `_routing_rec` adjunta `excluded_amd` solo cuando aplica (RF1).
*   Asserts de shape actualizados (3 places) + tests nuevos en verde; `pytest -q` completo OK.
*   `Recommendation.excluded_amd?: string[]` + badge en `RecommendationsPanel`; `npm test`, `tsc`, lint, build en verde.
*   Smoke: rango ROUTING GW37 + `["IPLAN"]`; compare ROUTING GW39 + `["IPLAN2"]`; badge visible en UI de rango.
*   `/data` mtimes intactos; `task.md` en `[x]`.
