# Spec 045: Leer todas las hojas de cada Excel

## Usuario

Analista que carga los exportes del discador. Un día con más de 65.530 llamadas viene en un `.xls` con varias hojas (`1`, `2`, `3`). El pipeline solo leía la primera, así que hubo que separar las hojas a mano en «NN_DD-MM Hoja N.xlsx». Eso dejó copias repetidas (Hoja 1 = primera hoja del `.xls`) y un archivo roto (`91_23-09 Hoja 2.xlsx`).

Con esta spec, el `.xls` original alcanza: el usuario puede borrar los «Hoja N.xlsx» y conservar solo el original.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — todas las hojas]:** `load_and_clean` lee **todas** las hojas del archivo y las concatena antes de limpiar. Se ignoran las hojas vacías. `_read_dates` (agrupación por fecha en `main.py`) también mira todas las hojas.
*   **RF2 [State-driven — sin duplicados]:** al unir los archivos de un mismo `(campaña, fecha)`, si existe la columna `Id. llamada`, se descartan las filas con un ID ya visto. Así, mientras convivan el `.xls` y sus «Hoja N.xlsx», nada se cuenta dos veces. Sin esa columna, se comporta como antes.
*   **RF3 [Event-driven — aviso]:** si se descartan duplicados, el pipeline imprime `Aviso: campaña C F: N llamadas repetidas entre archivos; se cuentan una sola vez.`
*   **RF4 [Unwanted behavior]:** `/data` se sigue leyendo en modo lectura; sin cambios de esquema, endpoints ni librerías nuevas (`xlrd`/`openpyxl` ya están).
*   **RF5 [Testing]:** pytest: archivo con dos hojas se carga completo; `.xls`-equivalente + copia de una hoja no duplica; archivo sin `Id. llamada` mantiene el comportamiento anterior.

## Specs superadas

Spec 029 (fragmentos del mismo día): se mantiene; se suma la lectura multi-hoja y el descarte de IDs repetidos.

## Fuera de Alcance

*   Borrar archivos de `/data` (lo hace el usuario). Ingesta incremental (ítem 7 del plan).

## Criterios de Finalización

*   Recarga real de los 21 `.xls` multi-hoja (91 y 92, 16→30/09): totales iguales a los actuales, salvo la 91 del 23/09, que suma su hoja 2 (~31.5 mil llamadas).
*   Un día real con `.xls` + «Hoja 1/2» juntos da el mismo total que el `.xls` solo.
*   `/cerrar-spec 045` en verde; commit en español + push.
