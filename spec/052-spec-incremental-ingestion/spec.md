# Spec 052: Ingesta incremental

## Usuario

Analista que carga los exportes del discador. `backend/main.py` reprocesa **todos** los archivos de `/data` cada vez: hoy son 104 archivos y unos 4,3 millones de llamadas, y la corrida tarda varios minutos. Cuando llegan los archivos de un día nuevo, hay que esperar la recarga completa o armar a mano una lista de archivos, como hicimos en la Spec 045 con un script aparte.

Es el ítem 7 de la segunda ronda de mejoras.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — registro]:** tabla `ingested_files` en `callcenter_metrics.db`, creada en `init_db` con `CREATE TABLE IF NOT EXISTS` (aditiva; no toca `daily_campaign_metrics`). Columnas:
    *   `name TEXT PRIMARY KEY`;
    *   `size INTEGER`;
    *   `mtime_ns INTEGER`;
    *   `days TEXT`: JSON con los `[campaña, fecha]` que aporta el archivo;
    *   `ingested_at TEXT`.
*   **RF2 [Event-driven — qué se procesa]:** `run_pipeline(data_dir, db_path, full=False)` compara cada archivo de `/data` contra el registro por nombre, tamaño y `mtime_ns`. Un archivo es:
    *   **nuevo o modificado:** no está en el registro, o cambió su tamaño o su `mtime_ns`. Se leen sus fechas.
    *   **eliminado:** está en el registro y ya no está en `/data`.
    *   **sin cambios:** el resto. No se lee.
*   **RF3 [State-driven — días afectados]:** se recalculan solo los `(campaña, fecha)` afectados:
    *   los de los archivos nuevos o modificados, tanto los actuales como los registrados antes del cambio;
    *   los de los archivos eliminados.
    *   Cada día afectado se recarga con **todos** sus archivos presentes, incluidos los que no cambiaron, con la misma unión de hojas y el mismo descarte de IDs repetidos (Specs 029 y 045) y `replace_day`. Así el total del día sale igual que con una recarga completa.
    *   Si a un día afectado no le queda ningún archivo, se imprime `Aviso: campaña C F: ya no hay archivos en /data; sus datos quedan en la base.` y no se borra nada.
*   **RF4 [Event-driven — registro al terminar]:**
    *   Se registran solo los archivos que se leyeron bien.
    *   Los que fallan (sin `FECHA`, columnas críticas faltantes, error inesperado) no se registran: se reintentan en la próxima corrida.
    *   Los archivos eliminados se borran del registro.
*   **RF5 [Ubiquitous — salida]:**
    *   Sin cambios: imprime `Sin archivos nuevos ni modificados: la base está al día.` y devuelve 0.
    *   Con cambios, imprime un resumen antes de procesar: `Nuevos o modificados: N · eliminados: M · días a recalcular: D.`
    *   La línea final sigue siendo `Pipeline finalizado. Archivos procesados: X/Y.`, donde Y es la cantidad de archivos que había que leer.
*   **RF6 [Ubiquitous — recarga completa]:** `python backend/main.py --full` (o `full=True`) procesa todo como antes y rehace el registro. Los argumentos posicionales `data_dir` y `db_path` se mantienen. El modo incremental detecta cambios en `/data`, no en el código: si cambia la lógica de limpieza o de métricas, hay que correr `--full`. Queda documentado en el README y en `/ingesta`.
*   **RF7 [Unwanted behavior — aislamiento]:**
    *   `/data` solo se lee: `stat()` y lectura de Excel.
    *   Sin cambios en endpoints, en `daily_campaign_metrics` ni en la interfaz.
    *   Sin librerías nuevas; la cobertura no baja.
    *   La primera corrida con una base sin registro procesa todo, una sola vez.
*   **RF8 [Testing]:** pytest en `backend/test_pipeline_incremental.py`:
    1.  La segunda corrida no lee nada.
    2.  Un archivo nuevo de un día nuevo: se lee solo ese.
    3.  Un fragmento nuevo de un día existente: se relee el día completo y el total es correcto.
    4.  Un archivo modificado: se reprocesa.
    5.  Un archivo eliminado: su día se recalcula con los que quedan; si no queda ninguno, aviso y datos intactos.
    6.  Un archivo que falla no se registra y se reintenta.
    7.  `--full` lee todo.
    8.  El registro sobrevive a `init_db`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 029 | RF4: cada corrida reprocesa todo `/data` | Incremental por defecto; `--full` mantiene el comportamiento anterior |

## Datos de entrada

`/data`: 104 archivos con las 4 campañas, del 01 al 30/09.

## Contrato JSON

Sin cambios (no hay endpoints nuevos).

## Fuera de Alcance

*   Detectar cambios por hash de contenido (alcanza con tamaño + `mtime_ns`).
*   Ingesta automática al llegar archivos.
*   Control de cobertura de días faltantes (ítem 8).
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/052-spec-incremental-ingestion/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Real, sobre una **copia** de la DB (la real no se toca):
    *   la primera corrida registra los 104 archivos;
    *   la segunda imprime «Sin archivos nuevos ni modificados» en segundos;
    *   los totales por campaña son iguales a los de la DB actual.
*   README y skill `/ingesta` actualizados.
*   `run_checks.py` en verde con cobertura; CI en verde; squash merge.
