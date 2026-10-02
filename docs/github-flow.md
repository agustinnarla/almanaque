# Proyecto Almanaque — GitHub Flow

`main` siempre está en verde y se puede usar. Todo cambio entra por una rama corta y un Pull Request que se integra con squash merge. No se hace push directo a `main`.

## 1. Ramas

Formato: `<tipo>/<NNN>-<slug>` cuando hay spec, y `<tipo>/<slug>` en el resto de los casos. El slug va en inglés, en minúsculas y separado por guiones (kebab-case).

| Tipo | Para qué |
|---|---|
| `feat` | Funcionalidad nueva visible para el usuario |
| `fix` | Corrección de un error |
| `docs` | Solo documentación o specs |
| `refactor` | Cambio interno sin cambio de comportamiento |
| `test` | Solo tests |
| `perf` | Mejora de rendimiento |
| `chore` | Mantenimiento: configuración, herramientas, nombres |
| `build` / `ci` | Build, dependencias aprobadas, integración continua |

Ejemplos: `feat/049-low-volume-days`, `fix/050-week-partial-badge`, `docs/readme-install`.

```powershell
git switch main
git pull
git switch -c feat/049-low-volume-days
```

## 2. Commits (Conventional Commits, en español)

```
<tipo>(<NNN>): <descripción>

<cuerpo opcional: qué y por qué, líneas de hasta 72 caracteres>

Co-Authored-By: …
```

- **Descripción:** en español, en minúscula, en imperativo («agrega», «corrige»), sin punto final. La primera línea no pasa de 72 caracteres.
- **Ámbito:** el número de spec (`048`); si no hay spec, se omite (`docs: corrige la instalación`).
- **Cambio incompatible:** se marca con `!` (`feat(052)!: …`) y se explica en el cuerpo.
- Un commit por paso lógico dentro de la rama. El squash los une al integrar.

Ejemplos:

```
feat(049): marca los días con poco volumen en la serie diaria
fix(050): corrige el badge «Parcial» en semanas de 5 días
chore(048): renombra el proyecto a Proyecto Almanaque
```

## 3. Pull Request

- **Título:** mismo formato que un commit. Es el mensaje del squash que queda en `main`.
- **Cuerpo:**
  - **Resumen:** qué cambia y por qué, enlazando la spec.
  - **Criterios de finalización:** tabla con la evidencia de `/cerrar-spec`.
  - **Decisiones a revisar:** lo que conviene mirar en la interfaz o en los datos.

## 4. Merge

1. `/cerrar-spec NNN` en verde: pytest y vitest con cobertura, tsc, lint, build y baseline de `/data`.
2. CI en verde en el PR: `gh pr checks <n> --watch --fail-fast`. `.github/workflows/ci.yml` corre tres jobs:
   - **Backend:** pytest con cobertura.
   - **Frontend:** lint, tipos, vitest con cobertura y build.
   - **Título del PR:** valida que el título cumpla las mismas reglas que un commit.
3. `gh pr merge --squash --delete-branch`: un commit por cambio en `main`, y la rama se borra.
4. `git switch main && git pull`.

La cobertura tiene un piso que hace fallar el CI:
- **Backend:** `.coveragerc` → `fail_under`.
- **Frontend:** `frontend/vite.config.ts` → `coverage.thresholds`.

El piso solo sube. Cuando una spec mejora la cobertura, se sube al nuevo valor redondeado hacia abajo.

El repo solo admite squash merge y borra las ramas integradas automáticamente.

## 5. Hooks locales

GitHub Free no protege ramas en repos privados, así que las reglas se controlan en cada máquina con los hooks de `.githooks/`:

- `commit-msg` rechaza mensajes fuera de formato. Acepta los que genera git: `Merge …`, `Revert …`, `fixup!` y `squash!`.
- `pre-push` rechaza los push a `main` y las ramas con nombre fuera de formato.

Se activan una vez por clon:

```powershell
git config core.hooksPath .githooks
```
