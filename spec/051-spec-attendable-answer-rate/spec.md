# Spec 051: AA sobre llamadas atendibles

## Usuario

Analista / supervisor del call center. El AA divide por todas las llamadas (Spec 012), así que mezcla dos cosas: la calidad de la lista (cuántas llamadas atiende un contestador) y la calidad de la troncal (cuántas de las que atiende una persona llegan a un agente). Hoy no se pueden separar:

*   En la campaña 35, IPLAN tiene un AA de **7,80%**, contra 5,95% de GW37. Pero el 51% de sus llamadas las atiende un contestador. Sobre las llamadas sin contestador, IPLAN da **15,92%**, más del doble que GW37 (7,27%).
*   Por campaña, 01→30/09:

| Campaña | AA | Contestadores | AA sobre atendibles |
|---|---|---|---|
| 35 | 6,89% | 39,7% | 11,42% |
| 38 | 4,41% | 44,9% | 8,00% |
| 91 | 2,99% | 41,1% | 5,08% |
| 92 | 2,16% | 42,9% | 3,78% |

Es el ítem 4 de la segunda ronda. Decisión del usuario (2026-10-02): mostrarlo como tarjeta KPI y como columna en las tablas.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — fórmula]:**
    *   `attendable_answer_rate = agent_answers / (total_calls − machine_answers)`.
    *   Con denominador ≤ 0 vale `null`.
    *   Lo calcula `_attendable_rate` en `backend/repositories/campaigns_repo.py`.
    *   El `agent_answer_rate` (denominador `total_calls`, Spec 012) **no cambia**.
*   **RF2 [Ubiquitous — API]:** el campo `attendable_answer_rate` se suma a la respuesta de:
    *   `GET /api/campaigns/{c}/summary` (`get_summary`), incluido el caso sin datos (`null`);
    *   `GET /api/campaigns/{c}/devices` (`get_device_metrics`).
    *   Los campos actuales no cambian.
    *   Como `GET /api/campaigns/compare-campaigns` reusa `get_device_metrics`, sus `devices_a` y `devices_b` también reciben el campo. Es aditivo, y la interfaz de ese modo no cambia.
*   **RF3 [UI — KPI]:** `OverviewKpis` (Campaña completa y Por semana) suma la tarjeta «AA sobre atendibles», con el valor en % y el subtítulo «Agentes ÷ llamadas sin contestador».
    *   El AA sigue siendo la única cifra principal (`hero`) y ocupa dos filas en pantallas grandes.
    *   Las otras cuatro tarjetas van en una grilla de 2×2, en este orden: AA sobre atendibles, Total, Contestadores, No contesta.
    *   `StatCard` acepta `className` para la ubicación en la grilla.
*   **RF4 [UI — tabla]:** `GatewaysRangeTable` suma la columna «AA atend. %» después de «AA %», con un `title` que explica la fórmula.
*   **RF5 [CSV]:**
    *   `kpiRangeRows` suma la fila «AA sobre atendibles %».
    *   `gatewaysRangeRows` suma la columna «AA sobre atendibles %».
    *   El CSV acompaña lo que se ve en pantalla.
*   **RF6 [Unwanted behavior — aislamiento]:**
    *   Sin cambios en: Comparar 2 días, Comparar campañas, diagnósticos, recomendaciones, alertas, esquema de la base y `/data`.
    *   La tabla de gateways de Comparar 2 días es solo de congestión, así que no lleva la columna.
    *   Sin librerías nuevas; la cobertura no baja.
*   **RF7 [Testing]:**
    *   pytest: `_attendable_rate` (normal, denominador 0); summary y devices con el campo, incluido el caso vacío.
    *   vitest: tarjeta y orden de `OverviewKpis`; columna de `GatewaysRangeTable`; filas de los exportadores.
    *   Regresión con cobertura y CI.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 047 | `OverviewKpis`: hero + 3 tarjetas en una fila | 4 tarjetas en 2×2 al lado del hero (RF3) |

La Spec 012 no queda superada: el AA mantiene su denominador.

## Datos de entrada

`daily_campaign_metrics` (`agent_answers`, `machine_answers`, `total_calls`), sin cambios. Valores esperados: la tabla de arriba y, para la 35 por troncal: IPLAN 15,92%, GW37 7,27%, GW20 4,08%, GW39 6,16% e IPLAN2 4,43%.

## Contrato JSON

```json
// /summary
{"campaign": "35", "total_calls": 60265, "agent_answers": 4153, "machine_answers": 23912,
 "rejected_calls": 32200, "agent_answer_rate": 0.0689, "attendable_answer_rate": 0.1142}
// /devices (cada fila)
{"device": "IPLAN", "...": "...", "agent_answer_rate": 0.078, "attendable_answer_rate": 0.1592}
```

## Fuera de Alcance

*   Llevar la métrica a los modos de comparación, a los rankings, al health score o a los diagnósticos.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/051-spec-attendable-answer-rate/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke con la API real, 01→30/09: los cuatro valores de la tabla por campaña y los de la 35 por troncal.
*   `run_checks.py` en verde con cobertura; CI en verde en el PR; squash merge.
