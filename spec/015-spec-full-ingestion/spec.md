# Spec 015: Ingesta de campaña completa (11 archivos)

## Usuario

Analista / supervisor del call center (usuario interno). El análisis pasa de 2 días sueltos a la **campaña completa** del primer quincena de septiembre 2026.

## Requisitos Funcionales (EARS)

*   **RF1 [Event-driven — renombrado autorizado]:** Se renombrarán **una única vez** los 9 archivos nuevos de `/data` sin prefijo (`03-09.xls` … `15-09.xls`) a `35_DD-09.xls`, para que `extract_campaign` asigne `campaign = "35"` (mismo patrón que `35_01-09.xls` / `35_02-09.xls`).
    *   **Autorización explícita del usuario** (2026-09-24) para esta operación puntual: solo cambia el **nombre**; el **contenido** y el **mtime** de cada archivo se preservan y se verifican antes/después. El pipeline de ingesta **nunca** renombra, modifica ni borra archivos.
    *   *Por qué:* Sin el prefijo, `extract_campaign` (`data_cleaner.py:20-24`) clasificaría esos días como `"Sin Campaña"` y quedarían fuera del análisis de la campaña 35.

*   **RF2 [Event-driven — carga]:** Ejecutado `backend/main.py`, el sistema procesará los **11** `.xls` de `/data` con el flujo existente (Spec 001): limpieza → `compute_metrics` → `replace_day` por cada `fecha`.
    *   Idempotente: `35_01-09` y `35_02-09` se re-procesan y reemplazan sin duplicados.
    *   *Por qué:* El pipeline y el esquema ya soportan N archivos; no se requiere código nuevo.

*   **RF3 [State-driven — estado objetivo de la DB]:** Tras la ingesta, `daily_campaign_metrics` contendrá **exactamente 11 fechas** de la campaña `35`: `2026-09-01, 02, 03, 04, 07, 08, 09, 10, 11, 14, 15` (hábiles; 05/06 y 12/13 son fin de semana y no tienen archivo).
    *   **Solo** `campaign = '35'`; ninguna fila con `"Sin Campaña"` ni fecha centinela `1970-01-01`.

*   **RF4 [Ubiquitous — sin cambios de código]:** Esta spec **no** modifica código Python ni TypeScript: reutiliza Spec 001 (pipeline), Spec 011/012 (contadores/tasas) y todos los endpoints de rango existentes.
    *   *Por qué:* Constitución #6 (Simplicidad) y #2 (inmutabilidad de `/data` durante el proceso).

*   **RF5 [Unwanted behavior — evidencia de integridad]:** Se registran los `mtime` de los 11 archivos **antes** del renombrado y se comparan **después** de renombrar + ingesta: deben ser idénticos (el rename en Windows preserva LastWriteTime; el pipeline solo abre en lectura).

## Specs superadas por esta revisión

Ninguna. Spec **operativa** (datos + verificación); no cambia RFs ni contratos.

## Datos de entrada

*   9 archivos nuevos: `03,04,07,08,09,10,11,14,15-09.xls` (30.230 filas crudas, columnas idénticas al formato actual, `FECHA = 2026-09-DD`).
*   2 archivos existentes: `35_01-09.xls`, `35_02-09.xls`.

## Contrato JSON

Sin cambios (endpoints existentes de rango).

## Fuera de Alcance

*   Cambios de código (backend/frontend).
*   Renombrar o modificar archivos **fuera** de los 9 autorizados; contenido de cualquier `.xls`.
*   Nuevos endpoints, esquema o dependencias.
*   Specs 016+ (vista de campaña completa).

## Criterios de Finalización

*   Los 11 archivos en `/data` se llaman `35_DD-09.xls`; **mtime de cada uno idéntico** al registrado previo al rename.
*   `pytest -q` en verde (sin regresiones).
*   DB: 11 fechas (lista de RF3), `DISTINCT campaign = ('35',)`, sin `"Sin Campaña"` ni `1970-01-01`.
*   Smoke rango `2026-09-01 → 2026-09-15`: `summary` con totales > 0 y `agent_answer_rate` no nulo; `daily` devuelve **11** puntos con rates entre 0 y 1; `patterns` y `diagnostics` responden 200.
*   `task.md` en `[x]`.
