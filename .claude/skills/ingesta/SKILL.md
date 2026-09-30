---
name: ingesta
description: Corre el pipeline de ingesta (backend/main.py) que carga los .xls/.xlsx de /data en callcenter_metrics.db, con controles antes y después — nombres con prefijo de campaña, /data intacto, resumen de la DB por campaña y comparación contra el estado previo.
disable-model-invocation: true
argument-hint: "[campaña a detallar, p. ej. 92]"
---

# Ingesta de /data

`/data` es **solo lectura** (AGENTS.md, constitución principio 2). El pipeline solo lee; esta skill lo verifica antes y después. Un hook (`.claude/hooks/protect_data.py`) bloquea las escrituras a `/data` y pide confirmación para comandos de shell que parezcan modificarla.

Todas las rutas son relativas a la raíz del proyecto. En PowerShell usar `.\.venv\Scripts\python.exe`.

## 1. Pre-chequeos

1. **Nombres de archivo**:
   ```bash
   .venv/Scripts/python .claude/scripts/baseline.py names
   ```
   `extract_campaign` toma la campaña del prefijo `NN_` del nombre. Si hay archivos **sin prefijo**:
   - **Detenerse.** No renombrar por iniciativa propia.
   - Informar qué archivos son, y proponer el renombre siguiendo el precedente de las Specs 022/029: `NN_DD-MM.xls`, fragmentos extra como `NN_DD-MM_h2.xlsx`, preservando el mtime.
   - El renombre requiere **autorización explícita** del usuario (y, de ser un cambio de proceso, una spec vía `/nueva-spec`). El hook va a pedir confirmación en ese comando.
2. **Estado de /data contra el baseline**:
   ```bash
   .venv/Scripts/python .claude/scripts/baseline.py check
   ```
   - `CAMBIADO/ELIMINADO` en `[data]` → detenerse y avisar (alguien tocó crudos).
   - `NUEVO` en `[data]` → archivos recién llegados; es lo esperado en una ingesta nueva. Listarlos.
3. **Foto de la DB antes**:
   ```bash
   .venv/Scripts/python .claude/skills/ingesta/scripts/db_summary.py --out <scratchpad>/db_before.json
   ```
   (`<scratchpad>` = el directorio temporal de la sesión, no el repo).

## 2. Pipeline

```bash
.venv/Scripts/python backend/main.py
```

- Procesa **todos** los archivos de `/data` cada vez (no es incremental): primero lee solo `FECHA` para agrupar por `(campaña, fecha)`, después une los fragmentos del mismo día y hace `replace_day` (DELETE + INSERT por fecha y campaña). Es idempotente (Spec 029 RF4).
- Con ~60 archivos tarda varios minutos: correrlo en background o con timeout alto (600000 ms).
- Pico de memoria ≈ un día de una campaña (~140K filas crudas); no paralelizar.
- Controlar la salida:
  - Última línea `Pipeline finalizado. Archivos procesados: X/Y.` → **X debe ser igual a Y**.
  - Cualquier `Error en <archivo>` o `Error inesperado` → reportarlo con el archivo y el motivo.
  - `Alerta: faltan columnas…` → informar.

## 3. Post-chequeos

1. **DB después, comparada con antes**:
   ```bash
   .venv/Scripts/python .claude/skills/ingesta/scripts/db_summary.py --compare <scratchpad>/db_before.json [--campaign <NN>]
   ```
   - Campañas que no recibieron archivos nuevos deben salir **intactas** (misma cantidad de filas y llamadas).
   - Campañas nuevas/actualizadas: 11 días hábiles esperados (o los que correspondan), `Chequeos: OK` (sin «Sin Campaña», sin fecha 1970, sin días faltantes).
   - Con `$ARGUMENTS` (o la campaña nueva) usar `--campaign` para ver el detalle por día y el rango de horas (días con horario recortado, como el 04-09 de la 92 con 11–17, merecen mencionarse).
2. **/data sigue intacto**:
   ```bash
   .venv/Scripts/python .claude/scripts/baseline.py check
   ```
   Ningún `CAMBIADO/ELIMINADO`. Los `NUEVO` deben ser exactamente los archivos listados en el pre-chequeo.
3. Si todo está bien y hubo archivos nuevos, **proponer** actualizar el baseline (`baseline.py save`) y hacerlo solo con el OK del usuario.

## 4. Reporte

Tabla por campaña (filas, días, llamadas, agentes, AA) con el antes/después, archivos procesados X/Y, errores y alertas, estado de `/data`. Sugerir `/smoke` para la campaña nueva o actualizada.
