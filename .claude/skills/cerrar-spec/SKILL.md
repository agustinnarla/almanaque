---
name: cerrar-spec
description: Verifica y cierra una spec del repo — corre la regresión completa (pytest, vitest, tsc, lint, build), controla que /data y las dependencias no cambiaron contra el baseline, revisa cada Criterio de Finalización y marca task.md. Usar al terminar de implementar cualquier spec o cuando el usuario pida verificar/cerrar/validar una spec.
argument-hint: "[número de spec, p. ej. 036]"
---

# Cerrar spec

`AGENTS.md` exige, antes de dar una tarea por terminada, verificar con los tests locales y validar **todos** los Criterios de Aceptación de la spec. Esta skill lo hace de forma repetible.

## 1. Identificar la spec

- Si hay argumento (`$ARGUMENTS`), usar `spec/<NNN>-*/`. Si no, la de número más alto.
- Leer completos `spec.md`, `plan.md` y `task.md`. Extraer:
  - el conteo esperado de `pytest` (p. ej. «`pytest -q` = **164**»);
  - los valores del smoke (campaña, rango, números exactos);
  - cualquier criterio extra (CSV, cantidad de tarjetas, archivos renombrados…).

## 2. Regresión completa

```bash
.venv/Scripts/python .claude/skills/cerrar-spec/scripts/run_checks.py --expected-pytest <N>
```

Corre en orden `pytest -q` · `npm test` · `npx tsc -b` · `npm run lint` · `npm run build` · `baseline.py check` y resume OK/FALLA por paso (tarda ~1–2 min; usar timeout amplio).

- `baseline check` compara `/data` (tamaño + mtime de cada archivo) y las dependencias npm/pip contra `.claude/baseline.json`.
  - Si reporta **CAMBIADO/ELIMINADO en `[data]`** → incumplimiento grave de la constitución: detenerse y avisar al usuario.
  - **NUEVO en `[data]`** es legítimo solo si la spec es de ingesta de archivos nuevos.
  - Dependencias nuevas → solo válido si la spec las aprobó explícitamente.
- Si falla algo: mostrar la salida relevante, **no marcar la spec como cerrada**, y proponer el arreglo.

## 3. Smoke real (si la spec lo pide)

Usar la skill `smoke` con los parámetros de la spec y comparar los números impresos contra los de «Criterios de Finalización» / «Datos de entrada».

## 4. Checklist de criterios

Presentar una tabla con **cada** criterio de finalización y cada RF de Testing:

| Criterio | Evidencia | Estado |
|---|---|---|
| `pytest -q` = 164 | run_checks: 164 passed | ✅ |
| Smoke: peor hora 16h 4.91% | smoke.py: `peor 16 4.91% (120/2446)` | ✅ |

Nunca marcar ✅ sin evidencia de esta sesión. Si algo no se pudo verificar (p. ej. requiere mirar la UI), decirlo como pendiente.

## 5. Marcar `task.md`

- Pasar a `[x]` solo los ítems verificados. Los que fallan o no se verificaron quedan `[ ]` y se informan.
- Si la spec agregó archivos a `/data` o aprobó dependencias nuevas, y todo lo demás está en verde, proponer actualizar el baseline (`.venv/Scripts/python .claude/scripts/baseline.py save`) y hacerlo solo con el OK del usuario.

## 6. Reporte final

Resumen corto en español: estado de cada paso con conteos (pytest N, vitest N, lint warnings/errores), smoke, `/data` intacto, dependencias, y qué quedó pendiente si algo quedó.
