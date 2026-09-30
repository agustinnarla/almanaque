# Spec 036: Control de versiones, README y dependencias declaradas

## Usuario

Analista / desarrollador del dashboard (usuario interno). El proyecto tiene 35 specs implementadas, pero:

1.  **No está en git** (`git status` → «not a git repository»): no hay historial, no se puede volver atrás si una spec rompe algo y no hay forma de revisar qué cambió entre specs.
2.  **No hay README en la raíz**: el único es la plantilla de Vite (`frontend/README.md`). Cómo correr el pipeline, levantar uvicorn/vite o los tests solo está disperso en las specs.
3.  **Las dependencias de Python no están declaradas**: no existe `requirements.txt`; el entorno solo se puede reconstruir mirando el `.venv` actual (`fastapi 0.141.1`, `pandas 3.0.6`, …).

Es la Fase 0 del plan de mejora: todas las specs siguientes (037+) se apoyan en tener historial.

## Requisitos Funcionales (EARS)

*   **RF1 [Event-driven — repositorio]:** Se inicializará un repositorio git en la raíz del proyecto con rama por defecto **`main`** (`git init -b main`).
    *   La identidad del autor (`user.name`, `user.email`) se configura **a nivel de repositorio** (`git config --local`) con los datos que indique el usuario; no se toca la configuración global.
    *   *Por qué:* historial y reversibilidad por spec.

*   **RF2 [Ubiquitous — `.gitignore` raíz]:** Nuevo `.gitignore` en la raíz que excluya:
    *   Entornos y dependencias: `.venv/`, `node_modules/`.
    *   Build y cachés: `frontend/dist/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`, `*.tsbuildinfo`.
    *   **Datos locales: `/data/` (decisión del usuario: crudos fuera del repo, ~831 MB) y `/callcenter_metrics.db`** (se regenera con el pipeline).
    *   Estado local de Claude Code: `.claude/baseline.json` (mtimes propios de esta máquina) y `.claude/settings.local.json`.
    *   Logs y archivos del SO: `*.log`, `.DS_Store`, `Thumbs.db`.
    *   Los `.gitignore` existentes (`frontend/.gitignore`, `.opencode/.gitignore`, `.venv/.gitignore`) se **mantienen** sin cambios.
    *   Se versionan: `backend/`, `frontend/` (sin lo ignorado), `spec/`, `docs/`, `AGENTS.md`, `pytest.ini`, `.opencode/plans/`, `.claude/settings.json`, `.claude/hooks/`, `.claude/scripts/`, `.claude/skills/`, `README.md`, `requirements.txt`.

*   **RF3 [Unwanted behavior — nada de datos en el repo]:** Tras el commit inicial, `git ls-files` **no** SHALL listar ningún archivo bajo `data/`, ni `callcenter_metrics.db`, ni `.venv/`, `node_modules/` o `frontend/dist/`.
    *   *Por qué:* los crudos son grandes y sensibles (datos de llamadas); se quedan locales y protegidos por el hook + baseline.

*   **RF4 [Ubiquitous — `requirements.txt`]:** Nuevo `requirements.txt` en la raíz con las dependencias **directas** ya instaladas, fijadas a la versión actual del `.venv` (**sin agregar ni actualizar ninguna**):
    *   `fastapi==0.141.1`, `uvicorn==0.53.0`, `pydantic==2.13.5`, `pandas==3.0.6`, `xlrd==2.0.2`, `openpyxl==3.1.5`, `pytest==9.1.1`, `httpx==0.28.1`.
    *   *Por qué:* reconstruir el entorno en otra máquina sin adivinar versiones. Las transitivas las resuelve pip.

*   **RF5 [Ubiquitous — `README.md` raíz]:** Nuevo `README.md` en español con:
    1.  Objetivo del proyecto (resumen de `AGENTS.md`) y stack.
    2.  Estructura de carpetas (`backend/`, `frontend/`, `data/`, `spec/`, `docs/`, `.claude/`).
    3.  Requisitos: Python 3.14, Node 24 / npm 11.
    4.  Instalación: `python -m venv .venv` + `pip install -r requirements.txt`; `npm install` en `frontend/`.
    5.  Datos: convención de nombres `NN_DD-MM[_hN].xls[x]` (campaña = prefijo), `/data` de **solo lectura**, que no está en git.
    6.  Ingesta: `.venv/Scripts/python backend/main.py` (o `/ingesta`).
    7.  Ejecución: `uvicorn main_api:app --app-dir backend --port 8000` + `npm run dev` (Vite con proxy `/api` → `:8000`).
    8.  Tests: `pytest -q`, `npm test`, `npx tsc -b`, `npm run lint`, `npm run build` (o `/cerrar-spec`).
    9.  Flujo SDD: spec → aprobación → implementación → cierre; skills `/nueva-spec`, `/cerrar-spec`, `/ingesta`, `/smoke`, y el hook que protege `/data`.
    10. Nota: `.claude/settings.json` usa **rutas absolutas** al `.venv` de esta máquina; en otra máquina hay que ajustarlas.
    *   Todos los comandos del README SHALL ejecutarse tal cual están escritos durante la verificación (ver Criterios).

*   **RF6 [Event-driven — commit inicial]:** Un único commit inicial en `main` con todo lo versionable, mensaje en español: `Commit inicial: dashboard de Agent Answer (specs 001–036)`, con el trailer `Co-Authored-By` de la sesión. Sin push (no hay remoto; fuera de alcance).

*   **RF7 [Unwanted behavior — aislamiento]:** **Cero** cambios en `backend/`, `frontend/src/`, esquema DB, API o `/data`. `pytest` = **164**, `vitest` = **195**; sin dependencias nuevas en `package.json` ni en el `.venv` (`baseline.py check` en OK).

*   **RF8 [Testing]:** Spec de infraestructura, sin tests nuevos. Verificación:
    *   `git ls-files` sin rutas prohibidas (RF3); `git check-ignore -v data/35_01-09.xls callcenter_metrics.db` confirma la regla.
    *   `git status --porcelain` vacío tras el commit.
    *   `pip install -r requirements.txt --dry-run` sobre el `.venv` → «Would install» vacío (todas ya satisfechas).
    *   Regresión con `/cerrar-spec 036`.

## Specs superadas por esta revisión

Ninguna. Spec aditiva (infraestructura).

## Datos de entrada

*   Versiones reales: Python 3.14.7, Node v24.20.0, npm 11.19.0; `pip freeze` actual (30 paquetes, 8 directos).
*   Tamaños: `/data` ≈ 831 MB (60 archivos); `callcenter_metrics.db` ≈ 0.4 MB.
*   Git 2.55.0 instalado, sin `user.name` / `user.email` globales.

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Remoto (GitHub/GitLab), push, CI.
*   Versionar `/data` o la DB; Git LFS.
*   Hacer portable el hook (rutas relativas / `$CLAUDE_PROJECT_DIR`): solo se documenta.
*   Actualizar o agregar dependencias (incluido el warning `httpx` → `httpx2`).
*   Cambios de código de backend/frontend.

## Criterios de Finalización

*   Docs `spec/036-spec-version-control/{spec,plan,task}.md`; `task.md` en `[x]`.
*   `git log --oneline` = 1 commit en `main`; `git status --porcelain` vacío.
*   `git ls-files | grep -E '^(data/|callcenter_metrics\.db|\.venv/|frontend/node_modules/|frontend/dist/)'` → vacío.
*   `requirements.txt` con 8 paquetes; `pip install -r requirements.txt --dry-run` sin nada para instalar.
*   Comandos del README probados: pipeline sobre un directorio vacío temporal (imprime «No se encontraron archivos…», **sin tocar la DB real**), uvicorn + `/smoke` campaña 35 (01→15/09) con los valores de siempre (AA 5.94%, peor hora 16h 4.91%), tests.
*   `pytest -q` = **164**; `npm test` = **195** + `tsc` + `lint` + `build` en verde; `/data` mtimes intactos; sin dependencias nuevas.
