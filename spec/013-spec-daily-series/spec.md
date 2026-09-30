# Spec 13: Serie diaria de Agent Answer (endpoint /daily)

## Usuario

Analista / supervisor del call center (usuario interno). Consulta del AA de **cada fecha** de un rango en un solo request, sin necesidad de llamadas múltiples a `summary` ni de elegir dos días para `compare`.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — endpoint]:** `GET /api/campaigns/{campaign_name}/daily?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` devuelve **una fila por cada fecha con datos** dentro del rango (inclusive) para la campaña, ordenado por `fecha` ascendente.
    *   `start_date` / `end_date` requeridos, tipo `date`; formato inválido → HTTP **422** (patrón Spec 002 RF5).
    *   *Por qué:* Es la forma canónica de obtener la evolución diaria del AA en un solo payload.

*   **RF2 [State-driven — tasa]:** Cada fila incluye `agent_answer_rate = agent_answers / total_calls` (fórmula Spec 012 RF1); si `total_calls ≤ 0` → `null`.
    *   Se calcula con `campaigns_repo._rate` (una sola fuente de verdad; no se duplica la fórmula).
    *   *Por qué:* Consistencia con summary, hourly-trend, devices y rankings.

*   **RF3 [Ubiquitous — contrato mínimo]:** Cada fila tiene **exactamente** los campos: `fecha` (string `YYYY-MM-DD`), `total_calls`, `agent_answers`, `machine_answers`, `agent_answer_rate`.
    *   Solo se emiten **fechas presentes** en la DB (no se rellenan huecos del calendario).
    *   *Por qué:* Espejo del contrato de `hourly-trend` (Spec 004); simplicidad (Constitución #6).

*   **RF4 [Unwanted behavior — edge cases]:**
    *   Rango sin registros **o** campaña inexistente → HTTP **200** con `[]`.
    *   Fecha con `total_calls = 0` → fila incluida con `agent_answer_rate: null`.
    *   *Por qué:* El frontend maneja estados vacíos sin 404 (patrón Spec 002 RF4).

## Specs superadas por esta revisión

Ninguna. Spec **aditiva**: no modifica fórmulas, umbrales, esquema ni contratos existentes.

| Spec | Relación |
|------|----------|
| 002 | RF3 declara endpoints separados; este agrega uno nuevo sin superar RFs |
| 004 | `hourly-trend` (agrupa por hora); `/daily` agrupa por fecha — complementario |
| 012 | RF2 reutiliza su fórmula `_rate` sin cambiarla |

## Datos de entrada

*   Contadores ya materializados: `total_calls`, `agent_answers`, `machine_answers` (Spec 011).
*   `daily_campaign_metrics` ya poblada; **sin re-ingesta**.

## Contrato JSON

### `GET /api/campaigns/35/daily?start_date=2026-09-01&end_date=2026-09-02`

```json
[
  {
    "fecha": "2026-09-01",
    "total_calls": 5800,
    "agent_answers": 334,
    "machine_answers": 900,
    "agent_answer_rate": 0.0576
  },
  {
    "fecha": "2026-09-02",
    "total_calls": 4900,
    "agent_answers": 216,
    "machine_answers": 800,
    "agent_answer_rate": 0.0441
  }
]
```

Rango vacío o campaña inexistente:

```json
[]
```

## Fuera de Alcance

*   Modificar archivos crudos en `/data`.
*   Cambiar esquema de la DB o contratos de endpoints existentes.
*   Cambiar fórmulas/umbrales de Specs 011–012.
*   UI / frontend / charts de serie diaria.
*   Rellenar días sin datos (gap-filling de calendario).
*   Reescribir Specs 001–012 in-place.
*   Añadir dependencias.

## Criterios de Finalización

*   `get_daily_trend` en `campaigns_repo.py` con `GROUP BY fecha` + `_rate`.
*   Endpoint `GET .../daily` registrado en `routers/campaigns.py`.
*   Tests en `test_api.py`: contrato exacto, orden ascendente, rates por día (seed 01 → `38/290`, 02 → `50/100`), `start=end` → 1 fila, rango vacío → `[]`, campaña inexistente → `[]`, fecha inválida → 422.
*   `pytest -q` en verde (123 existentes + los nuevos).
*   Smoke campaña 35: `daily` 01→02 devuelve rates **≈ 0.0576** y **≈ 0.0441** (idénticos a `summary?start_date=X&end_date=X`).
*   `/data` sin modificaciones (mtime intacto: 1790080283 / 1790080255).
