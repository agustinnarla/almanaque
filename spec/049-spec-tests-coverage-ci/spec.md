# Spec 049: Más tests, cobertura y CI

## Usuario

Agustin, dueño del repo. Hoy los checks corren solo en la máquina local antes del merge, y nadie mide cuánto código cubren los tests. Quiere:
1. **Más tests.**
2. **Cobertura en vitest.**
3. **CI en GitHub** que verifique todo antes del squash merge.

Medición inicial (2026-10-02):

*   **Vitest:** 85,1% de sentencias, 74,6% de ramas, 81,2% de funciones y 85,1% de líneas. Huecos:
    *   `src/api/*` al 0%: URLs y errores HTTP;
    *   los hooks de datos al 0%: los tests de los modos los mockean;
    *   `ChartTooltip` al 0%: Recharts está mockeado;
    *   los estados de recarga y error de los modos.
*   **Pytest:** ~96% del código de producción. Faltan:
    *   las migraciones de `db_manager.py` (78%);
    *   los errores de `main.py` (86%);
    *   el directorio inexistente en `file_scanner.py` (80%).

Decisiones del usuario:
*   Sumar `pytest-cov` además de la cobertura de vitest.
*   Umbral = piso al nivel alcanzado, redondeado hacia abajo. La cobertura no puede bajar, y se sube en cada spec.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — dependencias aprobadas]:**
    *   `@vitest/coverage-v8` **5.0.1** como dependencia de desarrollo, con versión exacta igual a la de vitest.
    *   `pytest-cov` **7.1.0** en `requirements.txt`.
    *   Ninguna otra.
*   **RF2 [Ubiquitous — cobertura frontend]:**
    *   `vite.config.ts → test.coverage`:
        *   proveedor `v8`;
        *   `include: src/**/*.{ts,tsx}`, excluyendo tests, `src/test/**`, `main.tsx` y `*.d.ts`;
        *   reportes `text-summary`, `html`, `json-summary` y `lcov` en `frontend/coverage/`;
        *   `thresholds` en las 4 métricas.
    *   Script `npm run test:coverage`. `npm test` sigue sin cobertura, para que sea rápido.
*   **RF3 [Ubiquitous — cobertura backend]:**
    *   `.coveragerc` con:
        *   `source = backend`;
        *   `omit` de los tests;
        *   `branch = True`;
        *   `fail_under` (el piso);
        *   `exclude_lines` para `if __name__ == "__main__":`.
    *   Comando: `pytest --cov --cov-report=term-missing`.
*   **RF4 [Ubiquitous — tests nuevos, frontend]:**
    *   `api/*`: URL con parámetros codificados y error con el código HTTP.
    *   Hooks de datos: el mapeo de la respuesta y que propagan `refreshing`.
    *   `ChartTooltip`: orden valor-primero, formato, `reverse`, pie e inactivo.
    *   Modos: la recarga mantiene el contenido atenuado, sin esqueleto, y se muestra el error.
*   **RF5 [Ubiquitous — tests nuevos, backend]:**
    *   Migraciones: columna `campaign` faltante; tabla inexistente.
    *   `get_db_connection` abre y cierra la conexión.
    *   `replace_day`: sin columna `campaign` o con campaña vacía.
    *   `scan_data_dir` con un directorio inexistente.
    *   `_read_dates` con un archivo ilegible.
    *   Error inesperado al limpiar un archivo: se saltea y sigue con el resto.
*   **RF6 [Event-driven — CI]:** `.github/workflows/ci.yml` corre en cada `pull_request` a `main` y en cada push a `main`, con estos jobs:
    *   **Backend:** Python 3.14, `pip install -r requirements.txt` y pytest con cobertura y umbral.
    *   **Frontend:** Node 24, `npm ci`, lint, `tsc -b`, `test:coverage` con umbral y build. Sube `frontend/coverage/` como artefacto.
    *   **Título del PR:** corre `.githooks/commit-msg` sobre el título, que es el mensaje del squash en `main`.
    *   *Por qué:* hoy nada valida el título del PR, y es lo que queda en el historial.
*   **RF7 [Ubiquitous — flujo]:**
    *   `/cerrar-spec` y `run_checks.py` corren pytest y vitest **con cobertura**, igual que el CI.
    *   El merge espera al CI: `gh pr checks <n> --watch --fail-fast` y solo con todo en verde `gh pr merge --squash --delete-branch`.
    *   Se documenta en `docs/github-flow.md`, `AGENTS.md` y el README (sección Tests).
*   **RF8 [Unwanted behavior — aislamiento]:**
    *   Sin cambios de lógica de producción, endpoints, UI ni `/data`.
    *   `.gitignore` suma `frontend/coverage/`, `.coverage` y `htmlcov/`.
    *   El baseline de dependencias se actualiza solo con las dos aprobadas.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 048 | Merge con checks solo locales | El merge espera además al CI |

## Datos de entrada

Sin cambios.

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Tests end-to-end con navegador (Playwright): requiere otra dependencia.
*   Publicar la cobertura en servicios externos o comentarla en el PR.
*   Proteger `main` en GitHub: no está disponible en Free para repos privados.

## Criterios de Finalización

*   Docs `spec/049-spec-tests-coverage-ci/{spec,plan,task}.md`; `task.md` en `[x]`.
*   La cobertura de vitest y de pytest sube respecto de la medición inicial, y los umbrales quedan en el piso alcanzado.
*   El CI en verde en el PR de esta spec (3 jobs), y el merge se hace después del CI.
*   `run_checks.py` en verde con cobertura; `/data` intacto; solo las 2 dependencias aprobadas.
