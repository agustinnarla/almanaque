# Spec 029: Procesamiento multi-archivo por día (exports partidos)

## Usuario

El exportador / analista del call center que entrega los `.xls/.xlsx` diarios en `/data`. Al exportar en formato `.xls` existe un **límite de filas (~65530)**, por lo que los días con mucho volumen salen **partidos en dos archivos**: la *Hoja 1* (primeras 65530 filas, desde 09:00 hasta el instante del corte) y el resto en un `.xls` que continúa exactamente desde ese instante (mismo día, misma cola, intersección de `Id. llamada` = 0). Ejemplo real: el 08-09 de la campaña 91 → `91_08-09.xlsx` (65530 filas, 09:00→14:48:37) + `91_08-09.xls` (49248 filas, 14:48:37→19:55). El pipeline actual (`run_pipeline`) hace `replace_day` (DELETE por fecha+campaña y luego INSERT) **por archivo**, así que el segundo fragmento **borra** al primero y se pierden 81373 llamadas de la 91 (DB quedó en 652834 de ~734207 reales). Este spec arregla la orquestación del pipeline para **unir los fragmentos antes de medir**.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — unión por campaña]:** `run_pipeline` (backend/main.py) SHALL leer todos los archivos primero y agrupar los `cleaned` **por campaña** (`extract_campaign(file_path)`), para luego hacer un **único flush por campaña**: `compute_metrics(pd.concat(frames, ignore_index=True))` seguido de un `replace_day` por cada fecha de esa campaña.
    *   Los crudos se concatenan **antes** de `compute_metrics` (no las métricas): los fragmentos comparten la hora del corte (ej. hora 14 en ambos lados del corte de las 14:48), por lo que unir métricas ya agregadas produciría colisión de PK `(fecha, hora, campaign, base, device)` y promedios (`avg_wait_time_sec`, `avg_abandon_time_sec`) incorrectos. `compute_metrics` re-agrega sobre la unión con su lógica existente.
    *   Un solo flush por campaña mantiene el DELETE de `replace_day` acotado a las campañas presentes en el df → campañas distintas del mismo día (35, 38, 91) coexisten sin pisarse.
*   **RF2 [Unwanted behavior — aislamiento de errores]:** un archivo con `MissingCriticalColumnsError` u otro error SHALL excluirse individualmente (mismo manejo que hoy: mensaje en español + `traceback` para errores inesperados) **sin perder** los demás fragmentos del mismo día/campaña; el resto de los archivos se procesa normalmente.
*   **RF3 [Functional — retorno y progreso]:** `run_pipeline` SHALL seguir devolviendo el **número de archivos procesados sin error** (contados como *paths* únicos que pasaron `load_and_clean`) y SHALL imprimir progreso en español: `Leído: <archivo> (<n> filas).` por archivo (una sola vez aunque el archivo tenga varias fechas) y `Cargado: campaña <c> <fecha> (<n> grupos).` por flush de día, más el resumen final inalterado.
*   **RF4 [Functional — idempotencia]:** re-ejecutar el pipeline con los mismos archivos SHALL producir exactamente los mismos conteos en la DB (sin duplicación), dado que `replace_day` sigue haciendo DELETE+INSERT por fecha+campaña.
*   **RF5 [Ubiquitous — sin cambios de contrato]:** cero cambios en `data_cleaner`, `metrics_engine`, `db_manager`, routers, engines, esquema DB o API; `contracto JSON` intacto; cero dependencias nuevas (`package.json` y `requirements` intocados).
*   **RF6 [Testing]:**
    *   Nuevo `backend/test_pipeline_multi_file.py` (6 tests de integración con `tmp_path`, `.xlsx` escritos con pandas/openpyxl y DB en archivo temporal): unión de fragmentos con hora de corte compartida (la suma de la hora 10 = fragmento A + fragmento B), idempotencia (2 corridas), campañas distintas coexistiendo en el mismo día, archivo roto excluido sin romper el resto, directorio sin archivos → 0, **archivo sin columna FECHA excluido con mensaje → 0**.
    *   Regresión: `pytest -q` = **162** (156 base + 5 de la revisión inicial + 1 de esta revisión); ninguna fixture existente modificada.
*   **RF7 [Unwanted behavior — memoria acotada] (revisión):** `run_pipeline` SHALL procesar en **dos pasadas** para acotar el pico de memoria:
    *   *Pasada 1 (barata):* por cada archivo, leer **solo la columna `FECHA`** (`pd.read_excel(usecols=...)`) y parsearla con el mismo `_parse_fecha` de `data_cleaner` → agrupar *paths* por clave `(campaña, fecha_ISO)`. Archivos sin `FECHA` legible SHALL excluirse con mensaje de error en español (equivalen a un archivo roto, RF2).
    *   *Pasada 2:* por cada grupo `(campaña, fecha)`, leer sus fragmentos (`load_and_clean`), **concatenar los crudos**, `compute_metrics` y `replace_day(conn, fecha, day_rows)` con las filas de esa fecha → el pico de memoria es **un día de una campaña** (máx. 142615 filas crudas en la 92) en vez de acumular todas las campañas (≈2.1M filas / >4 GB).
    *   La semántica de RF1–RF4 queda intacta: unión de fragmentos **antes** de `compute_metrics`, DELETE por campaña, idempotencia y aislamiento de errores.

## Specs superadas por esta revisión

Ninguna *supersede* completa. Corrige un defecto de orquestación del pipeline definido en las specs de ingesta iniciales (no afecta a las Specs 026–028 de UI ni al contrato de datos). Los comportamientos de `replace_day`, `load_and_clean` y `compute_metrics` quedan intactos.

## Datos de entrada (smoke real)

*   5 pares fragmentados en `/data` (cola `200091`, intersección de IDs = 0, columnas idénticas de 34):
    *   07-09: xlsx 65530 (09:00→19:50:14) + xls 752 (19:50:15→19:57).
    *   08-09: xlsx 65530 (09:00→14:48:37) + xls 49248 (14:48:37→19:55).
    *   09-09: xlsx 65530 (09:00→16:24:42) + xls 18251 (16:24:42→19:59).
    *   11-09: xlsx 65530 (09:00→18:54:47) + xls 6286 (18:54:47→19:56).
    *   14-09: xlsx 65530 (09:00→18:13:00) + xls 6836 (18:13:01→19:43).
*   Estado pre-fix en DB: `91 = 1657 filas / 652834 llamadas`, `35 = 333`, `38 = 441`.
*   Volumen faltante: **81373 llamadas crudas** (≈76K válidas tras filtros de hora ≥20 y FECHA inválida) → total esperado post-fix ≈ 734K.
*   Los 5 `.xls` residen en `data/_sin_procesar/` (movidos en la operación previa); vuelven a `data/` renombrados `91_DD-09.xls` antes de re-correr el pipeline.

### Revisión (campaña 92)

*   **22 archivos nuevos sin prefijo** en `/data` (cola `200092`, 11 días, ~**1.000.787 filas crudas**): 11 `.xls` + 10 `*Hoja 1.xlsx` + **`08-09 Hoja 2.xlsx`** (día con 3 fragmentos: Hoja 1 09:00→14:44:48 · Hoja 2 14:44:48→18:14:38 · .xls 18:14:38→19:58).
*   Verificación: intersección de `Id. llamada` = **0** en los 11 días, columnas requeridas OK (22/22), fechas internas = nombres de archivo. Días con par: 01, 02, 03, 07, 08(×3), 09, 10, 11, 14, 15; **04-09 solo `.xls`** (64243 filas, 11:31→17:56) — confirmado por el usuario como día completo, se carga tal cual.
*   **Motivo de la revisión (RF7):** la máquina tiene 7.8 GB RAM (≈2.4 GB libres); el diseño de "agrupar todos los `cleaned` por campaña" requeriría ~2.1M de filas en memoria (≈5 GB) con la 92 → refactor a doble pasada con flush por día.
*   Renombres: 11 `.xls` → `92_DD-MM.xls`, 10 Hoja 1 → `92_DD-MM.xlsx`, Hoja 2 → `92_08-09_h2.xlsx`; sin carpeta auxiliar (el pipeline une los fragmentos).
*   Estado pre-92 en DB: `35 = 333 / 35413`, `38 = 441 / 263198`, `91 = 1772 / 734207`.

## Contrato JSON

**Sin cambios.** `pytest` debe pasar intacto con los 156 tests base (más los 6 de esta spec).

## Fuera de Alcance

*   Modificar `extract_campaign` (identificación por prefijo de nombre se mantiene) o inferir campaña por COLA.
*   `data_cleaner`, `metrics_engine`, `db_manager`, routers, services, esquema DB, API y frontend.
*   Unir/reescribir los archivos de `/data` con scripts externos (la unión ocurre en memoria, en el pipeline).
*   Nuevas dependencias; detección automática del límite de filas; soporte para formatos sin writer disponible en el entorno (`.xls` de escritura).

## Criterios de Finalización

**Revisión inicial (campaña 91):**

*   Docs `spec/029-spec-pipeline-multi-file/{spec,plan,task}.md`; `task.md` en `[x]`.
*   `run_pipeline` agrupa por campaña y concatena crudos antes de `compute_metrics`; `Leído:`/`Cargado:` en consola; retorno = archivos OK.
*   `backend/test_pipeline_multi_file.py` con los 5 tests iniciales; `pytest -q` = **161**.
*   Migración: 5 `.xls` de `data/_sin_procesar/` → `data/91_DD-09.xls` (mtimes preservados); pipeline 38/38.
*   DB: los 5 días fragmentados con `SUM(total_calls)` superior al pre-fix; `35 = 333` y `38 = 441` intactos; `91` completo (≈734K llamadas).
*   Smoke de endpoints de 91 + regresión 35/38 + vite/proxy en verde.
*   `vitest` 152, `tsc -b`, `lint` 0 errores y `build` en verde; nuevo baseline de mtimes `/data` (38 archivos); `data/_sin_procesar/` retirada.

**Revisión (campaña 92 + RF7 memoria):**

*   `run_pipeline` en doble pasada (FECHA → grupos `(campaña, fecha)` → flush por día); print `Cargado: campaña <c> <fecha> (… grupos).`.
*   `backend/test_pipeline_multi_file.py` con **6** tests; `pytest -q` = **162**; los 5 previos intactos.
*   Renombres: 22 archivos → `92_…` (mtimes preservados, verificados); pipeline **60/60**.
*   DB: `92` con 11 fechas y `SUM(total_calls)` ≈ crudas (descartando solo INICIO ≥ 20:00); `35/38/91` intactos (333/441/1772).
*   Smoke de endpoints de 92 + regresión 35/38/91 + vite/proxy en verde.
*   `vitest` 152, `tsc -b`, `lint` 0 errores y `build` en verde; nuevo baseline `/data` = 60 archivos.
