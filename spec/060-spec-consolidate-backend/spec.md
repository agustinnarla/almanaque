# Spec 060: Consolidar el backend (duplicados e inicialización de la base)

## Usuario

Agustin, mantenedor. `backend/repositories/campaigns_repo.py` tiene 1.245 líneas, con lógica duplicada:
*   **Funciones por día:** `get_day_totals`, `get_breakdown_by_base` y `get_breakdown_by_device` son copias de sus versiones por rango (`get_range_totals`, `get_breakdown_by_base_range` y `get_breakdown_by_device_range`) con `inicio = fin = día`.
*   **Comparar 2 días:** `build_compare_diagnostics` vuelve a armar a mano el resumen A/B, la intersección de bases y la de gateways. Desde la Spec 057, los helpers de Comparar campañas aceptan un rango por lado, y un día es un rango de un día.
*   **`_rate`:** recibe un parámetro `machine_answers` que no usa desde la Spec 012.
*   **Inicialización de la base:** `get_db_connection` corre `init_db` en **cada request**, con varios `PRAGMA table_info` cada vez, unas 15 requests por pantalla.

Es la primera parte del ítem 11 de la segunda ronda. La segunda parte, los modelos de respuesta de Pydantic, va en la Spec 061.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — sin duplicados]:**
    *   Se eliminan `get_day_totals`, `get_breakdown_by_base` y `get_breakdown_by_device`.
    *   `build_compare_diagnostics` usa `get_range_totals`, `_cross_summary`, `_cross_base_intersection` y `_cross_gateway_intersection`, con la misma campaña de los dos lados y `[día, día]` como rango de cada lado.
    *   El sobre de la respuesta (`campaign`, `date_a`, `date_b`, …) no cambia.
*   **RF2 [Ubiquitous — `_rate`]:** pasa a ser `_rate(agent_answers, total_calls)`, sin el parámetro que no usaba. La fórmula de la Spec 012 no cambia.
*   **RF3 [State-driven — inicialización única]:**
    *   `get_db_connection` ejecuta `init_db` solo la **primera vez** por proceso para cada ruta de base. Las siguientes requests solo abren la conexión.
    *   La ingesta (`run_pipeline`) sigue llamando a `init_db` como hasta ahora.
*   **RF4 [Unwanted behavior — sin cambios visibles]:**
    *   Las respuestas de **todos** los endpoints quedan idénticas byte por byte. Se verifica con una foto de referencia: 194 respuestas sobre la base real, tomadas antes y después.
    *   Sin cambios de contrato, esquema, interfaz ni `/data`; sin librerías nuevas; la cobertura no baja.
*   **RF5 [Testing]:**
    *   pytest: `get_db_connection` inicializa una sola vez (un segundo uso no vuelve a llamar a `init_db`);
    *   los tests existentes de Comparar 2 días siguen en verde sin cambios;
    *   foto de referencia idéntica.

## Specs superadas por esta revisión

Ninguna. Es un refactor sin cambios de comportamiento.

## Datos de entrada

Sin cambios.

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Modelos de respuesta de Pydantic (Spec 061).
*   Partir `campaigns_repo.py` en varios archivos.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/060-spec-consolidate-backend/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Foto de referencia: 194/194 respuestas idénticas.
*   `run_checks.py` en verde con cobertura; CI en verde (3/3 en el último commit); squash merge.
