# Spec 048: Proyecto Almanaque y GitHub Flow

## Usuario

Agustin, dueño del repo. Quiere profesionalizar el proyecto:
*   **Nombre:** se llama **Proyecto Almanaque**. Hasta ahora era «Diagnóstico de Agent Answer»; la pestaña del navegador decía `frontend` y el repo, `analisis-sdd`.
*   **Flujo:** todo se commiteaba directo en `main`, con mensajes «Spec NNN: …». Pasa a GitHub Flow: una rama y un Pull Request por cambio, y Conventional Commits en español.

Decisiones del usuario (2026-10-02):
*   Renombrar documentación, interfaz y repo.
*   Usar Conventional Commits.
*   Claude abre el PR y, con los checks en verde, hace el squash merge y borra la rama.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — nombre]:** «Proyecto Almanaque» aparece en:
    *   el título del README;
    *   `AGENTS.md` y `docs/constitution.md`;
    *   el encabezado del dashboard: el eyebrow dice «Proyecto Almanaque», y el título sigue siendo «Diagnóstico de Agent Answer», como descripción de lo que hace;
    *   el `<title>` de `frontend/index.html` (además, `lang="es"`);
    *   `name` de `frontend/package.json` y de su `package-lock.json` (`almanaque-frontend`).
*   **RF2 [Ubiquitous — repo]:** el repo de GitHub pasa a llamarse `almanaque`. El remoto `origin` local apunta al nombre nuevo; GitHub redirige la URL vieja. Ajustes del repo:
    *   solo squash merge (merge commit y rebase desactivados);
    *   las ramas se borran al hacer merge;
    *   el título del squash es el del PR.
*   **RF3 [Ubiquitous — reglas]:** `docs/github-flow.md` documenta:
    *   **Ramas:** `<tipo>/<NNN>-<slug>` para specs, o `<tipo>/<slug>` para el resto. El slug va en inglés kebab-case. Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`.
    *   **Commits:** `<tipo>(<NNN>): <descripción en español>`, en minúscula, en imperativo, sin punto final y con un máximo de 72 caracteres en la primera línea. El cuerpo es opcional. `!` marca un cambio incompatible.
    *   **PR:** el título sigue el formato del commit. El cuerpo lleva Resumen, Criterios de finalización con evidencia y Decisiones a revisar.
    *   **Merge:** squash merge cuando `/cerrar-spec` está en verde, y la rama se borra. `main` siempre queda desplegable; no se hace push directo.
    *   `AGENTS.md` lo resume y enlaza.
*   **RF4 [Unwanted behavior — hooks]:** `.githooks/` (activado con `git config core.hooksPath .githooks`, documentado en el README):
    *   `commit-msg` rechaza mensajes fuera de formato con un error en español; acepta los «Merge …», «Revert …», `fixup!` y `squash!` que genera git.
    *   `pre-push` rechaza los push a `main` y las ramas con nombre fuera de formato.
    *   Son scripts `sh`, sin dependencias.
    *   *Por qué:* GitHub Free no protege ramas en repos privados (la API responde 403 «Upgrade to GitHub Pro»).
*   **RF5 [Ubiquitous — skills]:**
    *   `/nueva-spec` crea la rama antes de escribir los documentos.
    *   `/cerrar-spec` termina con commit, push, `gh pr create` y `gh pr merge --squash --delete-branch`, y actualiza `main` local.
*   **RF6 [Unwanted behavior — aislamiento]:**
    *   Sin cambios de lógica, endpoints, datos ni `/data`, y sin librerías nuevas.
    *   El historial anterior no se reescribe.
    *   La carpeta local `Analisis-SDD` no se renombra: lo hace el usuario si quiere y después ajusta las rutas absolutas de `.claude/settings.json`.
*   **RF7 [Testing]:**
    *   `backend/test_git_hooks.py` corre los hooks con `sh`: mensajes válidos e inválidos; merge/revert; push a `main` rechazado; rama válida e inválida. Se saltea si no hay `sh`.
    *   Vitest: el encabezado muestra «Proyecto Almanaque».
    *   Regresión completa.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 036 (git/README) | Commits «Spec NNN: …» directo en `main` | GitHub Flow + Conventional Commits |

## Datos de entrada

Sin cambios.

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   CI en GitHub Actions: se propone aparte, porque requiere aprobación.
*   Reescribir commits anteriores.
*   Renombrar la carpeta local.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/048-spec-project-almanaque/{spec,plan,task}.md`; `task.md` en `[x]`.
*   `gh repo view` → `name: almanaque`, solo squash merge, `deleteBranchOnMerge: true`; `git remote -v` apunta a `almanaque`.
*   Hooks activos: un commit fuera de formato falla y uno válido pasa.
*   Este mismo cambio entra por la rama `chore/048-project-almanaque`, con PR y squash merge.
*   `pytest -q` = **194**; `npm test` + `tsc` + `lint` + `build` en verde; `/data` intacto; sin dependencias nuevas.
