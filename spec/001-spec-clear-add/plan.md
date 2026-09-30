# Plan 01: Arquitectura de Ingesta y Persistencia

## 1. Módulos del Sistema

El flujo de backend en Python se dividirá en cinco módulos. El punto de entrada es manual (una ejecución = un escaneo completo de `/data`).

*   **`main` (`backend/main.py`)**: Orquestador. Ejecuta el pipeline en orden: `file_scanner` → `data_cleaner` → `metrics_engine` → `db_manager`. *(Cubre RF1)*.
*   **`file_scanner`**: Lee el directorio `/data` y retorna la lista de archivos `.xls`/`.xlsx` a procesar. No hay watcher ni loop: la detección ocurre al invocar `main`. *(Cubre RF1)*.
*   **`data_cleaner`**: Lee el Excel, valida el contrato de columnas (alerta en español si faltan, aborta el archivo solo si faltan críticas), normaliza nulos (`"Campaña Sin Asignar"`, fecha centinela `1970-01-01`), convierte `INICIO`/`CONEXION`/`FIN` a datetime, reemplaza `2000-01-01` por `NaT` en `CONEXION` y descarta filas con `INICIO >= 20:00`. *(Cubre RF2, RF3, RF7)*.
*   **`metrics_engine`**: Aplica la lógica de negocio. Calcula `wait_time` (`CONEXION − INICIO`) solo en conectadas humanas, `abandon_time` (`FIN − INICIO`) solo sin `CONEXION` válida, excluye contestador de ambas métricas de tiempo, y agrupa por `FECHA` + `BASE`. *(Cubre RF4)*.
*   **`db_manager`**: Conexión SQLite y persistencia: `DELETE` de todas las filas de la `fecha` procesada y luego `INSERT` de los agregados nuevos (reescribir día, no upsert por fila). *(Cubre RF5, RF6)*.

## 2. Modelo de Datos (SQLite)

Tabla principal `daily_campaign_metrics`, agregada por jornada y campaña.

**Clave Primaria Compuesta:** `fecha` + `base` (Campaña).

| Columna | Tipo | Descripción |
|---|---|---|
| `fecha` | Date | Fecha de la jornada (incluye centinela `1970-01-01`) |
| `base` | Text | Campaña (`"Campaña Sin Asignar"` si era nula) |
| `total_calls` | Int | Llamadas del día/campaña dentro de la ventana horaria |
| `agent_answers` | Int | `ESTADO == 'ANSWER'` y no contestador |
| `machine_answers` | Int | `SUB_ESTADO == 'ANSWERING_MACHINE'` |
| `avg_wait_time_sec` | Float | Promedio `CONEXION − INICIO` solo en conectadas humanas |
| `avg_abandon_time_sec` | Float | Promedio `FIN − INICIO` solo en llamadas sin `CONEXION` válida |

Nota: la especificación original usaba `answered_calls` en tareas; se unifica como **`agent_answers`** para alinear spec, plan y esquema.

## 3. Decisiones Técnicas Justificadas

*   **Decisión A: SQLite + reescritura por fecha (DELETE + INSERT).**
    *   *Por qué:* Reingresar un Excel debe reflejar exactamente el archivo nuevo. Un upsert por fila dejaría vivas campañas ausentes en el nuevo archivo y inflaría totales. Borrar por `fecha` y reinsertar es simple, atómico con transacción y evita duplicados (RF6).
    *   *Alternativa descartada:* Upsert por PK `(fecha, base)`. Descartada porque no elimina filas obsoletas de campañas que desaparecieron del archivo corregido.
*   **Decisión B: Validaciones tempranas con Pandas (`data_cleaner`).**
    *   *Por qué:* Identificar columnas faltantes (RF2) y aplicar el filtro horario (RF7) al cargar el DataFrame evita que `metrics_engine` falle con operaciones inválidas y que entren llamadas fuera de franja.
    *   *Alternativa descartada:* `try/except` en cada cálculo. Descartada porque ensucia la lógica de negocio y oculta la causa raíz.
*   **Decisión C: Ingesta por ejecución manual (`main.py`).**
    *   *Por qué:* Un solo usuario junior; correr el proceso es suficiente para RF1 sin demonios ni dependencias extra.
    *   *Alternativa descartada:* Watcher de archivos (`watchdog`) o loop con `sleep`. Descartadas por agregar complejidad/librería fuera de lo aprobado.
*   **Decisión D: Filtro horario en `data_cleaner`, no en `metrics_engine`.**
    *   *Por qué:* Las llamadas de 20:00 en adelante no deben aparecer en ningún agregado; filtrarlas una sola vez al limpiar evita reglas olvidadas en cada métrica.

## 4. Estrategia de Tests (Testing)

`pytest`, sin tocar nunca `/data` real; DB en `:memory:`.

*   **Limpieza (DataFrames mock):** columnas faltantes → alerta en español y no traba el resto; `BASE`/`FECHA` nulas → etiquetas genéricas; `INICIO` con hora `19:59` se conserva y con `20:00` se descarta; `2000-01-01` en `CONEXION` → `NaT`. *(Valida RF2, RF3, RF7)*.
*   **Métricas aisladas:** `CONEXION` nula o año 2000 no suman al divisor de espera; contestador no alimenta espera ni abandono; abandono = `FIN − INICIO` solo sin conexión. *(Valida RF4)*.
*   **DB en memoria:** insertar día 1; reinsertar el mismo día con datos modificados y menos campañas → verificar que solo quedan las filas nuevas de esa fecha y no hay duplicados; fechas distintas coexisten. *(Valida RF5, RF6)*.
*   **Pipeline:** `main` con `/data` simulado (tmp_path) encadena escaneo → limpieza → métricas → DB sin escribir sobre los crudos.
