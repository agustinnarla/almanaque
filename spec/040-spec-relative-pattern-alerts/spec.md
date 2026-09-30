# Spec 040: Alertas de patrones relativas a cada campaña

## Usuario

Analista / supervisor del call center (usuario interno). «Alertas de patrones» marca las combinaciones fecha × hora × base × dispositivo con **Agent Answer < 5% fijo** (`AGENT_ANSWER_THRESHOLD`, Specs 002/011/012). Ese umbral se calibró con la campaña 35 (AA 5,94%) y no sirve para las campañas grandes:

| Campaña | AA promedio | Combinaciones | Alertas hoy (< 5%) |
|---|---|---|---|
| 35 | 5,94% | 333 | 170 (51%) |
| 38 | 4,89% | 441 | 193 (44%) |
| 91 | 2,77% | 1.772 | **1.452 (82%)** |
| 92 | 1,97% | 1.901 | **1.633 (86%)** |

En la 91 y la 92 casi todo es «alerta», así que la sección no ayuda a saber dónde concentrarse. Además, el umbral no tiene en cuenta el volumen: una combinación con 3 llamadas y 0 agentes pesa igual que una con 500.

Criterio elegido por el usuario (2026-09-30): **alerta si AA < 0,6 × promedio de la campaña y la combinación tiene ≥ 50 llamadas**. Es el ítem 041 del plan de mejora.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — umbral relativo]:** `services/pattern_detector.evaluate_campaigns(rows, factor=PATTERN_RELATIVE_FACTOR, min_calls=PATTERN_MIN_CALLS)`:
    1.  Calcula el **promedio de cada campaña sobre las filas recibidas** (el rango consultado): `SUM(agent_answers) / SUM(total_calls)`. Campaña sin llamadas → no se evalúa.
    2.  Una fila es alerta si `total_calls ≥ min_calls` **y** `agent_answers / total_calls < promedio × factor`.
    3.  Filas con `total_calls ≤ 0` nunca se evalúan (Spec 012 RF3 se mantiene).
    *   *Por qué:* cada campaña se compara contra su propio nivel, y el volumen mínimo evita alertas por ruido estadístico.

*   **RF2 [Ubiquitous — constantes]:** En `backend/config.py`, `AGENT_ANSWER_THRESHOLD` (0.05) se reemplaza por `PATTERN_RELATIVE_FACTOR = 0.6` y `PATTERN_MIN_CALLS = 50`.

*   **RF3 [Ubiquitous — endpoint]:** `GET /api/patterns?start_date&end_date&min_calls` recibe un `min_calls` opcional (default **50**, `ge=1`; `0` → 422, igual que los demás endpoints con volumen mínimo). Cada alerta **agrega** 3 campos, sin quitar ninguno:
    ```json
    { "fecha": "2026-09-01", "hora": 9, "campaign": "35", "base": "80", "device": "GW20",
      "total_calls": 112, "agent_answer_rate": 0.0268,
      "campaign_rate": 0.0594, "threshold_rate": 0.0356, "pattern_alert": true }
    ```

*   **RF4 [Event-driven — el front respeta «Mín. llamadas»]:**
    *   `fetchPatterns(from, to, minCalls)` y `usePatternAlerts({ from, to, minCalls })`.
    *   `RangeMode` pasa `range.minCalls` y `CampaignsCompareMode` pasa `cross.minCalls`.
    *   La agregación en el cliente (`summarizePatterns`, `comparePatternSummaries`) y los CSV de patrones no cambian.

*   **RF5 [UI — umbral visible, sin duplicar el factor]:**
    *   Nuevo `lib/patterns.ts: campaignThreshold(alerts, campaign) → { threshold, average } | null`, que toma `threshold_rate`/`campaign_rate` de las alertas de esa campaña. El front **no conoce el 0,6**: lo deriva de los datos.
    *   `PatternsPanel` muestra (`data-testid="patterns-threshold"`): «Umbral de la campaña 35: AA menor a 3.56% (60% del promedio de 5.94%)».
    *   `PatternsComparePanel` muestra una línea por campaña (`patterns-threshold-a` / `-b`).
    *   Subtítulo de la sección en ambos modos: «Combinaciones con Agent Answer muy por debajo del promedio de la campaña · volumen mínimo N llamadas». Reemplaza «…bajo el umbral de Agent Answer (5%)».
    *   Estados vacíos: «…ninguna combinación quedó muy por debajo del promedio de la campaña.».

*   **RF6 [Unwanted behavior — aislamiento]:** Sin cambios en otros endpoints, en el esquema ni en `/data`. Rankings, diagnóstico y recomendaciones quedan intactos. Sin librerías nuevas.

*   **RF7 [Testing]:**
    *   **pytest** (`test_api.py`) — **2 reescritos** (semántica nueva, no cobertura menos):
        *   «alerta relativa al promedio de la campaña» (con los campos nuevos).
        *   «filas en el promedio no alertan».
    *   **pytest** — **4 nuevos**:
        *   Cada campaña usa su propio promedio: la misma tasa alerta en la 35 y no en una campaña de AA bajo.
        *   Filas bajo `min_calls` excluidas, e incluidas si se baja el mínimo.
        *   Endpoint con campos `total_calls`/`campaign_rate`/`threshold_rate` sobre `seed_metrics`.
        *   `min_calls=0` → 422.
    *   Total pytest **171**.
    *   **vitest**, 3 nuevos: `campaignThreshold` (`patterns.test`); línea de umbral en `PatternsPanel`; líneas A/B en `PatternsComparePanel`. Total **230**.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 002 | RF2 umbral fijo configurable en `/api/patterns` | Umbral relativo al promedio de cada campaña + volumen mínimo |
| 011 | RF5 `AGENT_ANSWER_THRESHOLD = 0.06` | Constante reemplazada |
| 012 | RF4 `AGENT_ANSWER_THRESHOLD = 0.05` (RF3 denominador > 0 se mantiene) | Constante reemplazada |
| 026 | Texto «bajo el umbral de Agent Answer (5%)» y conteos del smoke (170 alertas de la 35) | Criterio y textos nuevos |

## Datos de entrada

*   Conteos esperados (rango 01→15/09, `min_calls` 50): **35 = 67**, **38 = 88**, **91 = 365**, **92 = 350** alertas (medido sobre la DB real antes de implementar).
*   Umbral de la 35: 0,6 × 5,94% ≈ **3,56%**.

## Contrato JSON

`GET /api/patterns`: parámetro opcional `min_calls` y 3 campos nuevos por alerta (RF3). Cambio aditivo.

## Fuera de Alcance

*   Selector del factor en la UI (queda en `config.py`).
*   Alertas por hora dentro de la combinación, agregación server-side, paginación.
*   Backend fuera de `/api/patterns`, `/data`, dependencias.

## Criterios de Finalización

*   Docs `spec/040-spec-relative-pattern-alerts/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke real (01→15/09, `min_calls` 50):
    *   Alertas 35 = 67, 38 = 88, 91 = 365, 92 = 350.
    *   Umbral de la 35 ≈ 3,56%.
    *   Con `min_calls` 100 hay menos alertas.
*   Revisión visual en Chrome: la línea de umbral en Campaña completa (35 y 91) y en Comparar campañas; el subtítulo nuevo; consola sin errores.
*   `pytest -q` = **171**; `npm test` = **230**; `tsc`, `lint` 0/0 y `build` en verde; `/data` intacto; sin dependencias nuevas.
*   Commit de cierre en español.
