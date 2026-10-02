# Proyecto Almanaque — Contexto del Asistente (AGENTS.md)

## Visión del Proyecto
**Objetivo:** Analizar datos históricos de telefonía de un Call Center para encontrar patrones, detectar áreas de mejora e incrementar la métrica de *Agent Answer*.
**Naturaleza:** Herramienta interna de análisis de datos y visualización rápida.

## Stack y Tecnologías
- **Backend / Procesamiento:** Python (Pandas para manejo de datos; FastAPI + Uvicorn para la API; Pydantic para validación).
- **Frontend:** React + Tailwind CSS.
- **Testing:** `pytest` + `httpx`/`TestClient` (para Python) y `Vitest` o `Jest` (para React).
- **Regla de versiones:** Utilizar siempre la versión más actual y estable de cada tecnología o librería.

## Estilo y Convenciones
- **Idioma del Código:** Variables, funciones, clases, componentes y nombres de archivos estrictamente en **Inglés**.
- **Idioma de Interfaz:** Todos los textos visuales de la UI, respuestas de la API, alertas y mensajes de commit deben estar en **Español**.
- **Enfoque:** Código limpio, legible y directo. Evitar arquitecturas sobre-ingeniadas.

## Reglas de Datos y Arquitectura
- **Protección de Datos Crudos:** Los archivos de origen (ej. `01-09.xls`) ubicados en `/data` son intocables. El código **NUNCA** debe modificar, sobreescribir ni eliminar estos archivos; solo se accede en modo lectura.
- **Separación de Entornos:** Mantener el procesamiento de datos (`/backend`) completamente aislado de la interfaz (`/frontend`).

## Reglas de Operación (Para la IA)
1. **Contexto Activo:** Siempre lee este archivo y la especificación (spec) activa antes de escribir o modificar código.
2. **Restricción de Iniciativa:** Nunca añadas dependencias, librerías o funcionalidades extra sin preguntar, salvo que se solicite explícitamente.
3. **Alineación:** Ajustate estrictamente a las reglas de negocio y los *Inputs/Outputs* definidos en la spec actual.

## Git (GitHub Flow)
Reglas completas en `docs/github-flow.md`.
- **Nunca** commitear ni hacer push directo a `main`: cada spec o cambio va en su rama `<tipo>/<NNN>-<slug>` (p. ej. `feat/049-low-volume-days`).
- Commits con Conventional Commits en español: `<tipo>(<NNN>): <descripción en minúscula, imperativo, sin punto>` (≤ 72 caracteres en la primera línea).
- Stagear rutas explícitas (`git add frontend backend spec docs`), nunca `git add -A`.
- Cierre: `/cerrar-spec` en verde → push de la rama → PR con la tabla de criterios → `gh pr merge --squash --delete-branch` → `git switch main && git pull`.

## Cierre de Tareas
- Al terminar cualquier tarea, verificar siempre con los tests locales para garantizar que la nueva lógica no rompa funciones anteriores.
- Validar que el código cumpla con todos los "Criterios de Aceptación" de la spec antes de darla por finalizada.
