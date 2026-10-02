---
name: nueva-spec
description: Crea una nueva spec del proyecto (spec/NNN-spec-<slug>/{spec,plan,task}.md) con el formato SDD del repo — requisitos EARS, specs superadas, datos de entrada, contrato, fuera de alcance y criterios de finalización. Usar SIEMPRE que el usuario pida una funcionalidad, cambio, fix o análisis nuevo que vaya a tocar código, antes de escribir una sola línea (constitución, principio 5 "Cero improvisación").
---

# Nueva spec

El repo sigue Spec-Driven Development: **ningún cambio de código sin una spec aprobada**. Esta skill arma los 3 documentos y se detiene para pedir aprobación.

## 1. Contexto obligatorio

1. Leer `AGENTS.md` y `docs/constitution.md` (reglas innegociables).
2. Número siguiente: listar `spec/` y tomar el mayor `NNN` + 1 (3 dígitos). Carpeta: `spec/NNN-spec-<slug-en-inglés-kebab>/` (p. ej. `036-spec-week-over-week`).
3. Buscar specs relacionadas (Grep en `spec/**/spec.md` por los archivos, endpoints o conceptos que se van a tocar) y **leerlas completas**. Se necesitan para:
   - saber qué RF quedan superados (tabla «Specs superadas»);
   - no contradecir decisiones cerradas (p. ej. AA = `agent_answers / total_calls` — Spec 012; umbrales en `backend/config.py` y su espejo `frontend/src/lib/rangeThresholds.ts`).
4. Leer el código real que se va a tocar y citarlo con `archivo:línea` en el plan.
5. Conteo actual de tests para los criterios: `.venv/Scripts/python -m pytest -q --co | tail -1` y el último conteo de vitest mencionado en la spec previa (o correr `npm test` en `frontend/`).

Si falta información de negocio (umbrales, qué campaña, qué rango), **preguntar al usuario** en vez de inventar.

## 1.b Rama (GitHub Flow)

Antes de escribir los documentos, desde `main` actualizado (`docs/github-flow.md`):

```bash
git switch main && git pull
git switch -c <tipo>/NNN-<slug>   # p. ej. feat/049-low-volume-days
```

`<tipo>`: `feat` (funcionalidad), `fix` (error), `docs`, `refactor`, `test`, `perf`, `chore`, `build`, `ci`. El slug es el mismo de la carpeta de la spec. Nunca se trabaja sobre `main`.

## 2. `spec.md`

```markdown
# Spec NNN: <Título en español>

## Usuario

Analista / supervisor del call center (usuario interno). <Problema concreto que tiene hoy, con evidencia: pantalla, número, archivo>.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven | Event-driven | Ubiquitous | Unwanted behavior — <tema>]:** <Mientras/Cuando/El sistema…> SHALL … (archivo, función, fórmula, orden, límites, casos vacíos).
    *   *Por qué:* <motivo de negocio>.
*   **RFn [Unwanted behavior — aislamiento]:** qué NO cambia (endpoints, otros modos, CSV, backend/frontend); `pytest` = **<N>**; sin librerías nuevas.
*   **RFn+1 [Testing]:**
    *   <tests nuevos por archivo, con nombre descriptivo>.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| … | … | … |

(o «Ninguna. Spec aditiva.»)

## Datos de entrada

*   <Endpoints / tablas / archivos que consume y valores reales esperados (campaña, rango, números del smoke)>.

## Contrato JSON

<Payload nuevo o «Sin cambios.»>

## Fuera de Alcance

*   Modificar `/data` (solo lectura); nuevas dependencias; <lo que queda para otra spec>.

## Criterios de Finalización

*   Docs `spec/NNN-…/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke real: <campaña, rango, valores exactos esperados>.
*   `pytest -q` = **<N>**; `npm test` + `tsc` + `lint` + `build` en verde; `/data` mtimes intactos; `package.json` sin dependencias nuevas.
```

Reglas de redacción:
- RF numerados, cada uno verificable (números, nombres de funciones/archivos, orden, límites, qué pasa con vacíos/null).
- Constantes nuevas: nombre en inglés MAYÚSCULAS y dónde viven.
- Textos de UI, mensajes de API y commits en **español** (Conventional Commits: `<tipo>(NNN): <descripción>`); identificadores, archivos y ramas en **inglés**.

## 3. `plan.md`

```markdown
# Plan de implementación — Spec NNN

## Contexto
- <estado actual con `archivo:línea`>.

## Pasos
1. **Docs** `spec/NNN-…/{spec,plan,task}.md`.
2. **<archivo>** → <cambio concreto>.
3. **Tests** <archivos y casos>.
4. **Verificación**: `/cerrar-spec` (pytest <N> · npm test · tsc · lint · build · baseline) · smoke real · `task.md` en `[x]`.
```

## 4. `task.md`

Checklist con `- [ ]` agrupada en secciones numeradas (`## 1. Docs`, `## 2. <área>`, …, `## N. Verificación y cierre`). El ítem de Docs se marca `[x]` al crear los archivos; el resto queda `[ ]`.

## 5. Cierre de esta skill

- **No implementar.** Mostrar al usuario un resumen corto (RF principales, specs superadas, archivos a tocar, conteo de tests esperado) y pedir aprobación o ajustes.
- Si la spec implica agregar una dependencia, señalarlo explícitamente: requiere aprobación aparte (AGENTS.md, regla 2).
- Tras la aprobación: implementar siguiendo el plan y cerrar con `/cerrar-spec`.
