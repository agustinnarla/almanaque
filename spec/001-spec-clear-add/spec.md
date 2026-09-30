# Spec 01: Ingesta, Limpieza y Persistencia de Datos (Python)

## Usuario 

Desarrollador junior. Un solo usuario. 

## Requisitos Funcionales (EARS)

*   **RF1 [Event-driven]:** Cuando se ejecute el proceso de ingesta (comando manual), el sistema deberá escanear el directorio `/data`, detectar los archivos `.xls` o `.xlsx` pendientes y extraer/procesar sus registros de llamadas. 
    *   *Por qué:* Para iniciar el flujo de análisis de cada jornada con una única ejecución, sin manipulación manual de los datos ni demonios en segundo plano.
*   **RF2 [Unwanted behavior]:** Si el archivo carece de columnas requeridas (`FECHA`, `BASE`, `INICIO`, `CONEXION`, `FIN`, `ESTADO`, `SUB_ESTADO`), entonces el sistema deberá registrar una alerta en español indicando qué columnas faltan y continuar procesando solo si las ausencias lo permiten; si faltan columnas críticas para las métricas, abortar el archivo con error claro sin detener el proceso de los demás archivos. 
    *   *Por qué:* Para evitar que un cambio menor en el Excel bloquee toda la ingesta del día, manteniendo visibilidad sobre el error.
*   **RF3 [Unwanted behavior]:** Si un registro tiene `BASE` vacía o nula, entonces el sistema deberá clasificarlo como `"Campaña Sin Asignar"`; si tiene `FECHA` vacía o nula, deberá asignarle la fecha centinela `1970-01-01` (que la UI presentará como `"Fecha Desconocida"`). 
    *   *Por qué:* Para no perder el recuento del volumen total de llamadas de la jornada respetando el tipo `DATE` de la clave primaria.
*   **RF4 [State-driven]:** Mientras el sistema calcule las métricas diarias, deberá separar: (a) llamadas conectadas con humano → alimentan `avg_wait_time_sec` = promedio de (`CONEXION` − `INICIO`) solo con `CONEXION` válida (no nula, no año 2000) y no contestador; (b) llamadas sin `CONEXION` válida → alimentan `avg_abandon_time_sec` = promedio de (`FIN` − `INICIO`); (c) contestador → solo incrementa `machine_answers`, sin alimentar las métricas de espera ni de abandono. 
    *   *Por qué:* Para asegurar que el indicador de rendimiento (*Agent Answer*) refleje únicamente la interacción real humana.
*   **RF5 [Ubiquitous]:** El sistema deberá almacenar los datos diarios consolidados y agrupados en una base de datos local SQLite. 
    *   *Por qué:* Para garantizar una consulta rápida, estructurada y persistente desde el frontend sin necesidad de reprocesar los archivos crudos constantemente.
*   **RF6 [Event-driven]:** Cuando se procese un archivo cuya fecha ya exista en la base de datos, el sistema deberá eliminar todas las filas de esa `fecha` y volver a insertar las del archivo nuevo, sin duplicados. 
    *   *Por qué:* Para permitir la corrección o re-ingesta de un Excel diario sin dejar filas obsoletas de campañas que ya no aparecen y sin corromper los históricos.
*   **RF7 [Ubiquitous]:** El sistema deberá excluir del análisis las llamadas cuya hora de `INICIO` sea igual o posterior a las 20:00 (incluye toda la hora 19:00–19:59; excluye 20:00 en adelante). 
    *   *Por qué:* Para acotar la métrica a la franja horaria de interés del negocio.

## Contrato de Columnas de Origen

| Columna | Requerida | Uso |
|---|---|---|
| `FECHA` | Sí | Agrupación y PK |
| `BASE` | Sí | Agrupación y PK (campaña) |
| `INICIO` | Sí | Cálculo de espera/abandono y filtro horario |
| `CONEXION` | Sí | Espera y detección de no conectadas |
| `FIN` | Sí | Abandono |
| `ESTADO` | Sí | `agent_answers` (`== 'ANSWER'`) |
| `SUB_ESTADO` | Sí | `machine_answers` (`== 'ANSWERING_MACHINE'`) y exclusión de contestador |

## Fuera de Alcance

*   Generación de la interfaz gráfica o endpoints de la API (corresponde a la Spec del Hito 2/3).
*   Eliminación o modificación de los archivos Excel crudos originales ubicados en `/data`.
*   Análisis predictivo complejo o inteligencia artificial sobre los datos ingresados.
*   Ejecución automática programada (cron/watcher) de la ingesta.

## Criterios de Finalización

*   Un único comando procesa todos los `.xls`/`.xlsx` pendientes de `/data` y continúa aunque un archivo tenga columnas faltantes.
*   Los registros sin campaña se contabilizan como `"Campaña Sin Asignar"` y los sin fecha con la fecha centinela `1970-01-01`.
*   `avg_wait_time_sec` excluye llamadas sin `CONEXION` válida y contestadores; `avg_abandon_time_sec` es el promedio de `FIN − INICIO` solo para llamadas sin `CONEXION` válida.
*   Las llamadas con `INICIO` a las 20:00 o posteriores no aparecen en ningún agregado; las de 19:xx sí.
*   Los datos agrupados se insertan correctamente en una base de datos SQLite local.
*   Al reingresar un archivo de una fecha ya procesada, las filas viejas de esa fecha desaparecen y las nuevas las reemplazan sin duplicados.
*   `pytest` en verde, incluyendo tests de limpieza, métricas, filtro horario y re-ingesta en DB `:memory:`.
