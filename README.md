# Proyecto Almanaque

Diagnóstico de Agent Answer para el call center.


Herramienta interna para analizar la telefonía histórica de un call center, encontrar patrones y áreas de mejora, y así **subir el Agent Answer (AA)**: la proporción de intentos que termina atendida por un agente humano.

- **AA** = `agent_answers / total_calls`, donde `agent_answers` cuenta las llamadas con `ESTADO = ANSWER` y `SUB_ESTADO = AGENT` (Specs 011 y 012).
- El dashboard tiene 4 modos: **Campaña completa**, **Comparar 2 días**, **Comparar campañas** y **Por semana**. Cada uno muestra KPIs, diagnóstico, recomendaciones, rankings, alertas de patrones, gráficos y exportación CSV/PDF.

## Stack

| Capa | Tecnologías |
|---|---|
| Backend / procesamiento | Python 3.14 · pandas · FastAPI + Uvicorn · Pydantic · SQLite |
| Frontend | React 19 · TypeScript · Tailwind CSS 4 · Recharts · Vite |
| Tests | pytest + httpx/TestClient · Vitest + Testing Library |

## Estructura

```
backend/        Pipeline de ingesta, API FastAPI, motores de diagnóstico y recomendaciones, tests (pytest)
frontend/       Dashboard React (Vite); tests junto a cada componente en __tests__/
data/           Archivos crudos .xls/.xlsx — SOLO LECTURA, no se versionan
spec/           Specs SDD numeradas (NNN-spec-*/{spec,plan,task}.md)
docs/           constitution.md (principios innegociables) y github-flow.md (ramas, commits y PR)
.githooks/      Hooks de git: formato de commits y bloqueo de push a main
.claude/        Skills, hook de protección de /data y scripts de verificación
AGENTS.md       Reglas de trabajo para asistentes de IA
```

## Requisitos

- Python 3.14
- Node 24 / npm 11

## Instalación

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt

cd frontend
npm install
```

## Datos

- Los crudos van en `data/` y **nunca se modifican**: el código solo los lee. No están en git porque pesan unos 830 MB y contienen datos de llamadas; se copian a mano en cada máquina.
- Convención de nombres: `NN_DD-MM.xls[x]`, donde `NN` es la campaña, que se toma del prefijo. Si un día viene partido en varios archivos por el límite de filas del `.xls`, los fragmentos extra se llaman `NN_DD-MM_h2.xlsx`, y el pipeline los une en memoria.
- Columnas requeridas: `FECHA`, `BASE`, `INICIO`, `CONEXION`, `FIN`, `ESTADO`, `SUB_ESTADO` y, de forma opcional, `Dispositivo`.

## Ingesta

Carga todos los archivos de `data/` en `callcenter_metrics.db`. Es idempotente, así que re-ejecutarlo no duplica filas.

```powershell
.venv\Scripts\python backend\main.py
```

Desde Claude Code, `/ingesta` hace lo mismo y además controla antes y después los nombres, la integridad de `/data` y el resumen de la DB.

## Ejecución

En dos terminales:

```powershell
# API en http://localhost:8000 (documentación en /docs)
.venv\Scripts\python -m uvicorn main_api:app --app-dir backend --port 8000

# Dashboard en http://localhost:5173 (proxy /api → :8000)
cd frontend
npm run dev
```

## Tests y verificación

```powershell
.venv\Scripts\python -m pytest -q --cov --cov-report=term-missing   # piso en .coveragerc

cd frontend
npm test                  # rápido, sin cobertura
npm run test:coverage     # con cobertura y umbrales; reporte HTML en frontend/coverage/
npx tsc -b
npm run lint
npm run build
```

Desde Claude Code, `/cerrar-spec` corre todo lo anterior y además verifica que `/data` y las dependencias no hayan cambiado.

**CI:** `.github/workflows/ci.yml` corre los mismos checks en cada Pull Request y en cada push a `main`, y además valida el título del PR. Un PR se integra solo con el CI en verde.

## Flujo de trabajo (Spec-Driven Development)

Ningún cambio de código se hace sin una spec aprobada (`docs/constitution.md`, principio 5):

1. **`/nueva-spec`**: crea la rama `<tipo>/NNN-<slug>` y `spec/NNN-spec-<slug>/{spec,plan,task}.md`, y se detiene hasta que se aprueba.
2. Implementación según `plan.md`.
3. **`/cerrar-spec NNN`**: regresión completa, control de `/data` y dependencias, criterios de finalización y `task.md` en `[x]`. Termina con commit, Pull Request y squash merge.
4. **`/smoke`**: valida los números con la API real (campaña, rango, 3 modos).

## Git: GitHub Flow

Cada cambio va en una rama (`feat/049-low-volume-days`), con commits en formato Conventional Commits en español (`feat(049): marca los días con poco volumen`) y un Pull Request que se integra con squash merge. Las reglas completas están en [`docs/github-flow.md`](docs/github-flow.md).

Después de clonar, hay que activar los hooks que controlan el formato de los commits y bloquean los push directos a `main`:

```powershell
git config core.hooksPath .githooks
```

## Protección de `/data`

Un hook de Claude Code (`.claude/hooks/protect_data.py`) **bloquea** cualquier escritura en `data/` y **pide confirmación** ante comandos de shell que parezcan modificarla.

> **Nota:** `.claude/settings.json` usa rutas absolutas al `.venv` de la máquina original (`C:/Users/aarla/Desktop/Analisis-SDD/...`). En otra máquina hay que ajustarlas para que el hook funcione.
