# Task 01: Implementación de Ingesta y Persistencia

## Preparación
- [x] Crear entorno virtual e instalar dependencias (`pip install pandas openpyxl xlrd pytest`). *Nota: `xlrd` para `.xls` antiguos, `openpyxl` para `.xlsx`.*
- [x] Crear estructura `backend/` con los módulos vacíos: `main.py`, `file_scanner.py`, `data_cleaner.py`, `metrics_engine.py`, `db_manager.py`.

## Módulo: Base de Datos (`backend/db_manager.py`)
- [x] Configurar conexión a SQLite local (`callcenter_metrics.db`), solo escritura sobre esta DB (nunca sobre `/data`).
- [x] Crear función `init_db` que cree `daily_campaign_metrics` si no existe, con PK compuesta (`fecha`, `base`) y columnas `total_calls`, `agent_answers`, `machine_answers`, `avg_wait_time_sec`, `avg_abandon_time_sec`.
- [x] Crear función `replace_day(fecha, df)` que dentro de una transacción haga `DELETE` de todas las filas de esa `fecha` y luego `INSERT` de los nuevos agregados (RF6).

## Módulo: Escáner de Archivos (`backend/file_scanner.py`)
- [x] Crear función que lea el directorio `/data` (solo lectura) y retorne la lista de rutas `.xls`/`.xlsx` a procesar.

## Módulo: Limpieza de Datos (`backend/data_cleaner.py`)
- [x] Crear función que reciba la ruta de un archivo y lo lea con Pandas.
- [x] Validar contrato de columnas (`FECHA`, `BASE`, `INICIO`, `CONEXION`, `FIN`, `ESTADO`, `SUB_ESTADO`). Si faltan, imprimir **alerta en español** indicando cuáles; si falta alguna crítica para métricas, abortar solo ese archivo con error claro y continuar con el resto.
- [x] Rellenar nulos de `BASE` con `"Campaña Sin Asignar"` y de `FECHA` con la fecha centinela `1970-01-01`.
- [x] Convertir `INICIO`, `CONEXION` y `FIN` a `datetime`.
- [x] Reemplazar la fecha falsa `2000-01-01 00:00:00` por `pd.NaT` en `CONEXION`.
- [x] Excluir filas con hora de `INICIO` `>= 20:00` (RF7): conservar solo `INICIO.hour < 20` (incluye 19:00–19:59).

## Módulo: Motor de Métricas (`backend/metrics_engine.py`)
- [x] Calcular `wait_time_sec` = `CONEXION − INICIO` solo donde `CONEXION` no es nula y `SUB_ESTADO != 'ANSWERING_MACHINE'`.
- [x] Calcular `abandon_time_sec` = `FIN − INICIO` solo donde `CONEXION` es nula (sin conexión válida); contestador no entra aquí.
- [x] Agrupar por `FECHA` y `BASE`.
- [x] Agregar: `total_calls`, `agent_answers` (`ESTADO == 'ANSWER'` y no contestador), `machine_answers` (`SUB_ESTADO == 'ANSWERING_MACHINE'`), `avg_wait_time_sec`, `avg_abandon_time_sec`.

## Orquestador (`backend/main.py`)
- [x] Crear pipeline que ejecute en orden: escanear `/data` → limpiar cada archivo → calcular métricas → `replace_day` en SQLite.
- [x] Manejar errores por archivo sin detener el proceso completo (mensaje en español).

## Testing (`backend/test_processor.py` y `backend/test_db.py`)
- [x] Test `data_cleaner`: columnas faltantes → alerta y no traba; nulos de `BASE`/`FECHA` → etiquetas genéricas.
- [x] Test filtro horario: `INICIO` 19:59 se conserva; `INICIO` 20:00 se excluye.
- [x] Test `metrics_engine`: `NaT`/año 2000 y contestador no suman al promedio de espera; abandono usa `FIN − INICIO` solo sin conexión.
- [x] Test DB con `:memory:`: insertar fecha, reinsertar con datos distintos y menos campañas → sin duplicados y sin filas viejas; otra fecha no se toca.
- [x] Ejecutar `pytest` y confirmar todos en verde.
