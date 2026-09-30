# Task 36: Control de versiones, README y dependencias declaradas

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Archivos de proyecto
- [x] `.gitignore` raíz (entornos, builds, cachés, `/data/`, `/callcenter_metrics.db`, estado local de `.claude/`).
- [x] `requirements.txt` con los 8 paquetes directos fijados; `pip install --dry-run` sin nada para instalar.
- [x] `README.md` raíz (10 secciones de RF5).

## 3. Prueba de comandos del README
- [x] Pipeline sobre dir vacío + DB temporal (sin tocar la DB real).
- [x] uvicorn con el comando del README + `/smoke` campaña 35 (AA 5.94%, peor hora 16h 4.91%).

## 4. Git
- [x] `git init -b main` + identidad local del usuario.
- [x] `git add -A` y revisión: ningún archivo de `data/`, DB, `.venv/`, `node_modules/`, `dist/`.
- [x] Commit inicial en español con `Co-Authored-By`.

## 5. Verificación y cierre
- [x] `/cerrar-spec 036`: pytest 164 · npm test 195 · tsc · lint · build · baseline OK.
- [x] `git status --porcelain` vacío; `git log` = 1 commit; `git check-ignore` confirma `/data` y la DB.
- [x] Marcar items `[x]`.
