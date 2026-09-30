# Plan de implementación — Spec 036

## Contexto
- La raíz no es un repositorio git; git 2.55 está instalado sin identidad global.
- `.gitignore` existentes: `frontend/.gitignore` (node_modules, dist, logs, editor), `.opencode/.gitignore` (node_modules, package*.json, bun.lock), `.venv/.gitignore` (`*`).
- `/data` ≈ 831 MB (60 archivos) → fuera del repo por decisión del usuario.
- Sin `requirements.txt`; dependencias directas deducidas de los imports: `fastapi`, `uvicorn`, `pydantic`, `pandas`, `xlrd` (.xls), `openpyxl` (.xlsx), `pytest`, `httpx` (TestClient).
- Único README: plantilla de Vite en `frontend/README.md`.
- `.claude/settings.json` apunta a `C:/Users/aarla/Desktop/Analisis-SDD/.venv/Scripts/python.exe` (ruta absoluta).

## Pasos
1. **Docs** `spec/036-spec-version-control/{spec,plan,task}.md`.
2. **`.gitignore`** raíz (RF2) con reglas ancladas a la raíz para `/data/` y `/callcenter_metrics.db`.
3. **`requirements.txt`** (RF4) con los 8 paquetes directos fijados a la versión del `.venv`; verificar con `pip install -r requirements.txt --dry-run`.
4. **`README.md`** (RF5) con las 10 secciones; cada comando copiado de lo que efectivamente se ejecuta.
5. **Probar los comandos del README**:
   - Pipeline contra un dir vacío y DB temporales en el scratchpad: `python backend/main.py <tmp_dir> <tmp_db>` → «No se encontraron archivos…» (no toca `callcenter_metrics.db`).
   - uvicorn con el comando del README + `/smoke` campaña 35.
6. **Git** (RF1, RF6):
   - `git init -b main`; `git config --local user.name/user.email` con los datos del usuario.
   - `git add -A`; revisar `git status` / `git ls-files` contra RF3 **antes** del commit.
   - `git commit` con el mensaje de RF6 + `Co-Authored-By`.
7. **Verificación**: `/cerrar-spec 036` (pytest 164 · npm test 195 · tsc · lint · build · baseline) · chequeos git de RF8 · `task.md` en `[x]`.
