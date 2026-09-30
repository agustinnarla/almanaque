# Spec 11: Redefinición de Agent Answer + Recalibración de Umbrales

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). Corrección de la métrica núcleo del proyecto.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — definición de AA]:** Mientras el sistema calcule métricas diarias, `agent_answers` contará **únicamente** las filas con `ESTADO == "ANSWER"` **Y** `SUB_ESTADO == "AGENT"` (comparación case-insensitive tras la limpieza).
    *   *Por qué:* El indicador *Agent Answer* debe reflejar solo la atención humana atendida. La definición anterior (`ANSWER` y no contestador) incluía `QUEUED` y `ANSWER` sin subestado, inflando el contador un ~36% sobre los datos reales.

*   **RF2 [State-driven — contestadores]:** `machine_answers` sigue contando `SUB_ESTADO == "ANSWERING_MACHINE"` sin cambio. `busy_calls` y `congestion_calls` no cambian.
    *   *Por qué:* Solo se corrige el numerador humano; el resto de contadores de estado se mantienen.

*   **RF3 [State-driven — tiempo de espera]:** `avg_wait_time_sec` se calculará **solo** sobre filas que cumplan `AGENT` (nueva RF1) **Y** `CONEXION` válida (no nula, no año 2000) **Y** `wait ≥ 0`. Se excluyen del promedio: contestadores, `QUEUED` y `ANSWER` sin subestado.
    *   *Por qué:* Alinear la espera media con la misma definición de "interacción humana real" que el AA.

*   **RF4 [State-driven — abandono]:** `avg_abandon_time_sec` no cambia: solo filas sin `CONEXION` válida y `abandon ≥ 0`.
    *   *Por qué:* El abandono mide llamadas que nunca conectaron; no depende de AGENT.

*   **RF5 [State-driven — umbrales recalibrados]:** Dada la nueva escala de AA (~5–7% en los datos de referencia), se actualizan en `config.py`:

    | Constante | Antes | Ahora |
    |-----------|-------|-------|
    | `AGENT_ANSWER_THRESHOLD` | 0.15 | **0.06** |
    | `DIAG_PEAK_THRESHOLD` | 0.15 | **0.075** |
    | `DIAG_BASE_DROP_THRESHOLD` | −0.03 | **−0.015** |
    | `DIAG_BASE_DROP_WARNING` | −0.015 | **−0.0075** |
    | `DIAG_BASE_IMPROVEMENT_SUCCESS` | 0.030 | **0.015** |
    | `DIAG_BASE_IMPROVEMENT_WARNING` | 0.015 | **0.0075** |

    En el frontend (`healthStyle.ts`), bandas de presentación del `health_score`:
    *   `≥ 0` → **Saludable**
    *   `≥ −25` → **Aceptable**
    *   `< −25` → **Crítico**
    *   `null` → **Sin datos**

    Sin cambios: `DIAG_CONGESTION_*`, `DIAG_BUSY_*`, `DIAG_MIX_SHARE_THRESHOLD`, `REC_*`, pesos `HEALTH_WEIGHT_*`, `ROOT_CAUSES_LIMIT`, `RECOMMENDATIONS_LIMIT`.

*   **RF6 [Event-driven — re-ingesta]:** Tras el cambio de fórmula, el proceso de ingesta (`backend/main.py`) deberá re-procesar los archivos de `/data` para que `replace_day` actualice las filas existentes con los nuevos contadores. `/data` permanece **solo lectura**.
    *   *Por qué:* La DB local guarda `agent_answers` materializado; sin re-ingesta los endpoints seguirían sirviendo la fórmula vieja.

*   **RF7 [Unwanted behavior — bug de agregación]:** El agregador de `agent_answers` no deberá referenciar columnas inexistentes (bug histórico `"ESTADO" + "SUB_ESTADO"` → `KeyError: ESTADOSUB_ESTADO`). La suite `test_processor.py` debe pasar al completo.
    *   *Por qué:* El KeyError rompía toda re-ingesta y 8 tests unitarios.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 001 | RF4 (separación humana) y tabla de columnas (`agent_answers` / espera) | Nueva definición AGENT estricta + wait restringido |
| 002 | RF1 (fórmula tasa AA) y RF2 (umbral 0.15 en patterns) | Denominador intacto pero numerador y umbral cambian vía RF1/RF5 |
| 006 | RF5 `peak_hours` (umbral 0.15) | `DIAG_PEAK_THRESHOLD = 0.075` |
| 007 | RF4 `BASE_DEGRADATION` / `BASE_IMPROVEMENT` (umbrales ±0.03/±0.015) | Nuevos umbrales de RF5 |
| 008 | Bandas de presentación del health badge | Nuevas bandas de RF5 (front) |

Los endpoints, contratos JSON y esquema de la DB **no cambian**.

## Datos de entrada

*   Columnas origen: `FECHA`, `BASE`, `INICIO`, `CONEXION`, `FIN`, `ESTADO`, `SUB_ESTADO` (+ `Dispositivo`).
*   `SUB_ESTADO` se normaliza a mayúsculas + strip en `clean_dataframe` (igual que `ESTADO`) para que `"agent"` / `" Agent "` matcheen `AGENT`.
*   Valores observados en `/data` (campaña 35): `SUB_ESTADO ∈ {AGENT, ANSWERING_MACHINE, QUEUED, EARLY_MEDIA, vacío}`; `ESTADO ∈ {ANSWER, BUSY, CONGESTION, NOANSWER, REJECTED, UNALLOCATED, NETWORK_ERROR}`.

## Contrato JSON

Sin cambios de forma. Los campos `agent_answers`, `agent_answer_rate`, `avg_wait_time_sec`, `health_score`, etc. conservan tipo y nombres; solo cambian los **valores** tras la re-ingesta.

## Fuera de Alcance

*   Modificar, sobreescribir o eliminar archivos crudos en `/data`.
*   Cambiar esquema de la DB o contratos de la API.
*   Reescribir Specs 001–010 in-place (solo se declaran superadas).
*   Tocar la lógica de `recommendations_engine` / `diagnostics_engine` (leen contadores ya corregidos).
*   Añadir dependencias.

## Criterios de Finalización

*   `agent_answers` cuenta solo `ANSWER ∧ AGENT`; casos `QUEUED` y vacío **no** cuentan (tests nuevos).
*   `avg_wait_time_sec` excluye `QUEUED`/vacío/machine; solo `AGENT` con conexión válida.
*   `config.py` con los 6 umbrales de RF5; `healthStyle.ts` con bandas ≥0 / ≥−25 / <−25.
*   `pytest -q` en verde (los 8 tests de `test_processor.py` reparados + los nuevos).
*   Suite frontend (`npm test`, `tsc`, `lint`, `build`) en verde.
*   Re-ingesta de `/data` sin `KeyError`; smoke campaña 35 con AA día 01 ≈ **7.04%**, día 02 ≈ **5.48%**; al menos 1 `peak_hours`; `patterns` solo bajo 0.06.
*   `/data` sin modificaciones (mtime intacto).
