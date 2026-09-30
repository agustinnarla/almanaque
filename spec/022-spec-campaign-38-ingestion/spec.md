# Spec 022: Ingesta de campaña 38 + `replace_day` multi-campaña

## Usuario

Analista / supervisor del call center (usuario interno). Llegan los datos de una **segunda campaña (38)** con el mismo rango de fechas (01→15 sep 2026) que la campaña 35 ya cargada; se necesita analizar ambas **sin que una pise a la otra**.

## Requisitos Funcionales (EARS)

*   **RF1 [Event-driven — renombrado autorizado]:** Se renombrarán **una única vez** los 11 archivos nuevos de `/data` sin prefijo (`01-09.xls` … `15-09.xls`) a `38_DD-09.xls`, para que `extract_campaign` asigne `campaign = "38"` (mismo patrón que `35_DD-09.xls`).
    *   **Autorización explícita del usuario** (2026-09-24): solo cambia el **nombre**; contenido y **mtime** de cada archivo se preservan y verifican antes/después. El pipeline **nunca** renombra ni modifica `/data`.
    *   *Por qué:* Sin prefijo, `extract_campaign` (`data_cleaner.py:20-24`) clasificaría esos días como `"Sin Campaña"` y quedarían fuera del análisis.

*   **RF2 [Unwanted behavior — `replace_day` no pisa campañas distintas]:** `replace_day` (`db_manager.py`) dejará de borrar **solo por `fecha`** y borrará por **`(fecha, campaign)`**: `DELETE … WHERE fecha = ? AND campaign IN (<campaigns presentes en el metrics_df>)`.
    *   Motivo: ambos juegos cubren **las mismas 11 fechas**; con el DELETE actual, ingerir 38 **borraría todas las filas de 35** de cada fecha (orden alfabético: `35_*` < `38_*` → sobreviviría solo 38).
    *   `metrics_df` vacío → **sin DELETE** (no hay campaña conocida que reemplazar; el pipeline nunca llama con df vacío).
    *   Si `metrics_df` no trae columna `campaign` → se usa `DEFAULT_CAMPAIGN` (coherente con el `INSERT` actual).
    *   Retrocompatible: una sola campaña en el df → mismo efecto que hoy (reemplaza horas/devices/stale de **esa** campaña en la fecha).

*   **RF3 [Event-driven — carga dual]:** Ejecutado `backend/main.py`, el sistema procesará los **22** `.xls` (11 de `35_*` + 11 de `38_*`) con el flujo existente: limpieza → `compute_metrics` → `replace_day` por `fecha`. Idempotente.

*   **RF4 [State-driven — estado objetivo de la DB]:** Tras la ingesta, `daily_campaign_metrics` contendrá **ambas campañas en paralelo**:
    *   `DISTINCT campaign = ('35', '38')`; **0** filas `"Sin Campaña"`; **0** con fecha `1970-01-01`.
    *   11 fechas × 2 campañas = **22** pares `(fecha, campaign)`.
    *   `campaign='35'` conserva sus **333 filas** (intacta: el fix impide que 38 la borre).
    *   `campaign='38'` con filas > 0 y las 11 fechas.

*   **RF5 [Testing]:**
    *   Nuevo test `test_replace_day_keeps_other_campaigns_same_date`: insertar 35 y luego 38 en la **misma fecha** → coexisten; reemplazar 38 no toca 35; reemplazar 35 no toca 38.
    *   Regresión: los tests `replace_day` actuales de `test_db.py` siguen en verde.
    *   Regresión total: `pytest -q` en verde.

*   **RF6 [Unwanted behavior — integridad de `/data`]:** `mtime` de los 11 archivos renombrados idénticos al snapshot previo; tras la ingesta, mtimes de **los 22** = snapshot (pipeline solo lectura).

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 001 | RF6 («replace por fecha» como única granularidad) | Reemplazo ahora es por `(fecha, campaign)`; multi-campaña coexiste |
| 003 | RF1 (asunción implícita de una campaña por fecha) | PK ya incluía `campaign`; el DELETE se alinea con la PK |
| 015 | RF3 (estado «solo campaign 35») | Estado objetivo ahora es 35 **y** 38 en paralelo |

## Datos de entrada

*   11 archivos nuevos: `01,02,03,04,07,08,09,10,11,14,15-09.xls` (~10–20 MB c/u; columnas idénticas a campaña 35; `FECHA` numérica `20260901`, 28.508 filas en `01-09`).
*   11 archivos existentes: `35_01-09.xls` … `35_15-09.xls` (ya en DB: 333 filas).
*   Ambos juegos cubren **las mismas 11 fechas hábiles** (05/06 y 12/13 son fin de semana).

## Contrato JSON

Sin cambios de endpoints. Los endpoints ya aceptan `campaign` como path param (`/api/campaigns/{campaign_name}/…`); `38` funciona como `35`.

## Fuera de Alcance

*   Frontend (defaults siguen en `'35'`; input de campaña es texto libre → el usuario tipea `38`).
*   Nuevos endpoints, esquema, dependencias.
*   Renombrar o modificar archivos de campaña 35 o el **contenido** de cualquier `.xls`.
*   Specs 023+ (visión/analyítica específica de campaña 38).

## Criterios de Finalización

*   Docs `spec/022-…/{spec,plan,task}.md`; `task.md` en `[x]`.
*   `backend/db_manager.py`: DELETE con `campaign IN (…)`; test nuevo multi-campaña en `test_db.py`.
*   11 archivos en `/data` se llaman `38_DD-09.xls`; **mtime idéntico** al snapshot previo.
*   `backend/main.py` → **22/22** procesados.
*   DB: `DISTINCT campaign = ('35','38')`; 22 pares fecha-campaña; `35` = 333 filas; `"Sin Campaña"` = 0; `1970-01-01` = 0.
*   Smoke campaña 38: `summary` totales > 0; `daily` 11 puntos rates ∈ [0,1]; diagnostics responden.
*   `pytest -q` en verde (143 + nuevos tests).
*   mtimes de los 22 archivos = snapshot.
