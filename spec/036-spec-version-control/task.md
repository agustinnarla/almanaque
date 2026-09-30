# Task 36: Control de versiones, README y dependencias declaradas

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Archivos de proyecto
- [ ] `.gitignore` raíz (entornos, builds, cachés, `/data/`, `/callcenter_metrics.db`, estado local de `.claude/`).
- [ ] `requirements.txt` con los 8 paquetes directos fijados; `pip install --dry-run` sin nada para instalar.
- [ ] `README.md` raíz (10 secciones de RF5).

## 3. Prueba de comandos del README
- [ ] Pipeline sobre dir vacío + DB temporal (sin tocar la DB real).
- [ ] uvicorn con el comando del README + `/smoke` campaña 35 (AA 5.94%, peor hora 16h 4.91%).

## 4. Git
- [ ] `git init -b main` + identidad local del usuario.
- [ ] `git add -A` y revisión: ningún archivo de `data/`, DB, `.venv/`, `node_modules/`, `dist/`.
- [ ] Commit inicial en español con `Co-Authored-By`.

## 5. Verificación y cierre
- [ ] `/cerrar-spec 036`: pytest 164 · npm test 195 · tsc · lint · build · baseline OK.
- [ ] `git status --porcelain` vacío; `git log` = 1 commit; `git check-ignore` confirma `/data` y la DB.
- [ ] Marcar items `[x]`.
