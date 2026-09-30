# Spec 02: API Backend y Detección de Patrones

## Usuario

Desarrollador junior / consumidor frontend interno.

## Stack aprobado (adicional a Spec 01)

`fastapi`, `uvicorn`, `pydantic`, `httpx` (solo testing). Aprobado explícitamente y reflejado en `AGENTS.md` y `docs/constitution.md`.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven]:** Mientras la API exponga el rendimiento diario de las campañas, el sistema deberá calcular la "Tasa de Contacto Humano Real" por (`fecha`, `base`) como `agent_answers / (total_calls - machine_answers)`, expresada como **float entre 0 y 1**.
    *   *Por qué:* Para evaluar el equilibrio entre el esfuerzo de discado y las conexiones humanas reales, excluyendo contestadoras.
*   **RF2 [Event-driven]:** Cuando la Tasa de Contacto Humano Real de una campaña en un día caiga por debajo del umbral configurable (0.15) **y el denominador sea mayor que cero**, el sistema deberá incluirla en la respuesta de patrones con `pattern_alert: true`. Si `total_calls - machine_answers == 0`, la campaña **se excluye** de las alertas (sin intentos reales no hay evaluación).
    *   *Por qué:* Detectar desviaciones críticas sin generar falsos positivos por divisiones por cero.
*   **RF3 [Ubiquitous]:** El sistema deberá exponer endpoints separados: `GET /api/metrics` (volúmenes y tiempos) y `GET /api/patterns` (alertas matemáticas).
    *   *Por qué:* Para que el frontend de React consuma solo la información que necesita cada componente.
*   **RF4 [Unwanted behavior]:** Si la API recibe un rango de fechas sin registros, deberá responder **HTTP 200** y `[]`.
    *   *Por qué:* Para que React maneje el estado "Sin Datos" sin romper la aplicación con 404.
*   **RF5 [Ubiquitous]:** Ambos endpoints aceptarán `start_date` y `end_date` (query params, formato `YYYY-MM-DD`, tipo `date`). Un formato inválido deberá responder **HTTP 422**.
    *   *Por qué:* Para análisis de tendencias por rango y validación temprana de entradas.

## Fuera de Alcance

*   Generación de textos o "planes de mejora" redactados.
*   Interfaz gráfica React (Hito 3).
*   Tasa agregada multi-día en un solo renglón (el frontend puede agreguar si necesita).
*   Filtros distintos al rango de fechas.

## Contrato JSON

### `GET /api/metrics?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

Granularidad: **una fila por `fecha` + `base`** dentro del rango (inclusive).

```json
[
  {
    "fecha": "2026-09-01",
    "base": "80",
    "total_calls": 3196,
    "agent_answers": 253,
    "machine_answers": 597,
    "avg_wait_time_sec": 15.25,
    "avg_abandon_time_sec": 24.26
  }
]
```

### `GET /api/patterns?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

Solo campañas-día con denominador > 0 y `agent_answer_rate < AGENT_ANSWER_THRESHOLD`.

```json
[
  {
    "fecha": "2026-09-01",
    "base": "34",
    "agent_answer_rate": 0.12,
    "pattern_alert": true
  }
]
```

Nombres de campos en inglés (lógica); mensajes de error de la API en español.

## Criterios de Finalización

*   `uvicorn main_api:app --app-dir backend --reload` levanta el servidor con CORS habilitado para el futuro frontend.
*   `/api/metrics` devuelve filas diarias por campaña en el rango pedido; rango vacío → 200 + `[]`.
*   `/api/patterns` solo incluye campañas-día bajo umbral con denominador > 0; nunca evalúa denominador 0.
*   `agent_answer_rate` es float 0–1.
*   Tests con `TestClient` + DB `:memory:` vía inyección de dependencia; `pytest` en verde (RF4, RF5, RF1, RF2).
