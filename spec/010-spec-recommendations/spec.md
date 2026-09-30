# Spec 10: Recomendaciones Prescriptivas (Panel de Observaciones)

## Usuario

Analista / supervisor del call center (usuario interno del dashboard).

## Requisitos Funcionales (EARS)

*   **RF1 [Ruteo Inteligente de Gateways]:** El sistema identificará, sobre el **día B**, el gateway con **mayor** `agent_answer_rate` (segmentos con `total_calls ≥ min_calls`) y emitirá una recomendación para priorizarlo en las franjas de mayor tráfico.
    *   `type: "ROUTING"`, `category: "SUCCESS"`.
    *   *Por qué:* Diferenciar troncales sanas para redistribuir marcado con criterio.

*   **RF2 [Control de Pacing y Marcado Concurrente]:** Para el peor gateway del **día B** con `busy_rate ≥ DIAG_BUSY_THRESHOLD` (0.35, reutilizar config — **no** hardcodear), emitirá una recomendación prescriptiva para calibrar el volumen de marcado simultáneo.
    *   `type: "PACING"`, `category: "WARNING"`. Entidad = gateway con mayor `busy_rate`.

*   **RF3 [Concentración de Franja Horaria Pico]:** Sobre el **día B** (horas con `total_calls ≥ min_calls`), detectará la hora con **mayor volumen absoluto de `agent_answers`** (contactos humanos logrados) y recomendará concentrar el discado en esa hora **y sus adyacentes ±1 h** (solo horas presentes en los datos).
    *   `type: "SCHEDULE"`, `category: "SUCCESS"`. Entidad = hora pico (string).

*   **RF4 [Filtro de Contestadores / AMD vs. Contacto Humano]:** El sistema emitirá **como máximo una sola** recomendación `AMD_DIVERGENCE` sobre el gateway del **día B** con **peor** `ratio = machine_answers / agent_answers` entre los que cumplan `machine_answers ≥ REC_AMD_RATIO × agent_answers` (umbral **4.0**, en `config.py`).
    *   `type: "AMD_DIVERGENCE"`, `category: "WARNING"`. Si `agent_answers = 0` y `machine_answers > 0` → ratio infinito (peor); ambos 0 → no dispara. Empate: `total_calls` DESC.
    *   *Por qué:* Con el umbral anterior (2.0) los 4 gateways saturaban los 5 slots del panel y tapaban Pacing, Franja Pico, Volumen y Ruteo; con cap=1 y umbral 4.0 solo queda el outlier crítico.

*   **RF5 [Delta de Rendimiento de Campaña]:** Comparará las **respuestas humanas absolutas** (`agent_answers`) entre Día A y Día B: si `((B − A) / A) × 100 ≤ REC_VOLUME_DROP_PCT` (**−10.0**, en `config.py`), recomienda revisar cambios operativos.
    *   `type: "VOLUME_DELTA"`, `category: "WARNING"`. Si `A = 0` o `A`/`B` es `null` → no dispara.

*   **RF6 [Endpoint dedicado]:** `GET /api/campaigns/{name}/compare/recommendations?date_a=&date_b=&min_calls=` devuelve `{campaign, date_a, date_b, min_calls_applied, recommendations}`.
    *   **Decisión cerrada:** endpoint **propio**; **no** se extiende `compare/diagnostics` (payload del feed intacto).
    *   Cada item: `{id, type, category, entity, text}`; `text` en **español** con variables dinámicas reales.
    *   Orden: severidad `CRITICAL → WARNING → SUCCESS → INFO`; empate por orden fijo de reglas (ROUTING, PACING, SCHEDULE, AMD_DIVERGENCE, VOLUME_DELTA). Cap `RECOMMENDATIONS_LIMIT` (**5**) en `config.py`.
    *   **Defensivo:** falta alguno de los dos días → `recommendations: []`, HTTP **200**. Días ok sin segmentos ≥ `min_calls` → `[]` (o solo las reglas que disparen con lo disponible).

*   **RF7 [UI - Panel de Observaciones]:** `RecommendationsPanel` **complementa** (no reemplaza) a `DiagnosticsFeed` en `App.tsx`.
    *   Posición: debajo de `DiagnosticsFeed`, antes del grid de gráficos/tabla; ancho completo.
    *   Header con ícono `FileText`, título “Observaciones y recomendaciones”, subtítulo “Generadas automáticamente a partir de los datos cargados, con foco en mejorar la contactación y el Answer Agent”.
    *   Estética **destacada oscuro**: tarjetas `bg-slate-900` con texto claro (`slate-100`), **borde lateral `border-l-4`** por categoría y tipo en **negrita**:
        *   `CRITICAL` → `border-l-rose-500`; `WARNING` → `border-l-amber-500`; `SUCCESS` → `border-l-emerald-500`; `INFO` → `border-l-slate-400`.
    *   **Categorías: las 4 severidades** del sistema (mismo vocabulario que diagnósticos).
    *   `recommendations: []` → empty-state en español; error de red → mensaje defensivo (no romper layout).

*   **RF8 [Testing y Resiliencia]:**
    *   `pytest`: engine (`test_recommendations.py`) con firing/no-firing por regla, orden y cap; contrato del endpoint en `test_api.py` (200, día faltante → `[]`, `min_calls` 422, campaña inexistente → `[]`, `len ≤ 5`).
    *   `Vitest`: `RecommendationsPanel` con fixture (verifica borde por categoría) y `[]` → empty-state.
    *   Regresión: `pytest -q` y `vitest run` en verde.

## Datos de entrada (sin migraciones ni tocar `build_compare_diagnostics`)

*   RF1/RF2/RF4 → `get_device_metrics(conn, name, date_b, date_b)` (ya expone rates y contadores) + filtro `total_calls ≥ min_calls` en el engine.
*   RF3 → `get_hourly_trend(conn, name, date_b, date_b)` + filtro `min_calls`.
*   RF5 → `get_day_metrics(conn, name, date_a|date_b)` (devuelve `agent_answers` absoluto; **no** usar `get_day_totals`, que omite contadores).
*   RF2 umbral → importar `DIAG_BUSY_THRESHOLD` desde `config.py`.

## Contrato JSON

### `GET /api/campaigns/{name}/compare/recommendations?date_a=&date_b=&min_calls=`
```json
{
  "campaign": "35",
  "date_a": "2026-09-01",
  "date_b": "2026-09-02",
  "min_calls_applied": 50,
  "recommendations": [
    {
      "id": "rec_gw_pacing",
      "type": "PACING",
      "category": "WARNING",
      "entity": "GW20",
      "text": "GW20 registra línea ocupada del 46.30%. Recomendación: revisar el volumen de marcado simultáneo asignado a ese dispositivo para evitar saturación de línea."
    },
    {
      "id": "rec_amd_divergence_gw20",
      "type": "AMD_DIVERGENCE",
      "category": "WARNING",
      "entity": "GW20",
      "text": "GW20 concentra contestación en contestadores automáticos frente a respuestas humanas. No sobreestimar la calidad de esa troncal: evaluarla por Answer Agent."
    },
    {
      "id": "rec_gw_routing",
      "type": "ROUTING",
      "category": "SUCCESS",
      "entity": "GW39",
      "text": "GW39 tiene la mejor tasa de Answer Agent (13.80%) del día B. Si hay margen para redistribuir marcado entre dispositivos, priorizarlo en las franjas de mayor volumen debería subir la contactación general."
    },
    {
      "id": "rec_peak_hour",
      "type": "SCHEDULE",
      "category": "SUCCESS",
      "entity": "10",
      "text": "La franja con más contactos humanos logrados es la 10h (vecinas: 9h y 11h). Concentrar más intentos alrededor de esas horas puede mejorar el rendimiento sin sumar más volumen total."
    },
    {
      "id": "rec_volume_drop",
      "type": "VOLUME_DELTA",
      "category": "WARNING",
      "entity": "35",
      "text": "Las respuestas humanas absolutas bajaron 41.98% entre el Día A y el Día B. Vale la pena revisar si cambió algo en la operación (dispositivos usados, horarios o calidad de la base)."
    }
  ]
}
```
Sin datos / día faltante → misma estructura con `recommendations: []`, HTTP 200.

## Fuera de Alcance

*   Nuevos endpoints además del dedicado; **no** se modifica el contrato de `compare/diagnostics`.
*   Modelos predictivos / ML; librerías nuevas (stack cerrado).
*   Reemplazar `DiagnosticsFeed` (se mantiene; el panel lo complementa).
*   Recomendaciones “aprendidas” o con estado persistido; auth; deploy.

## Criterios de Aceptación

*   `pytest -q` en verde (incluye tests nuevos del engine y del endpoint).
*   `vitest run` + `tsc -b` en verde; `npm run lint` sin errores nuevos.
*   Smoke campaña **35**, **2026-09-01** vs **2026-09-02**, `min_calls=50`:
    *   Endpoint 200 con `recommendations` no vacío (esperable: **PACING GW20** con busy ≈46%, **VOLUME_DELTA** con caída de agent_answers A→B, **máx. 1** `AMD_DIVERGENCE` peor ratio, ROUTING y SCHEDULE según datos reales).
    *   Día faltante (ej. 2030-01-01) → `recommendations: []` y 200.
    *   Dashboard: panel visible **junto con** el feed de diagnósticos (ambos), tarjetas oscuras con `border-l-4` por categoría; UI en español.
*   Nombres de archivos/variables en inglés; textos de UI y `text` de recomendaciones en español.
