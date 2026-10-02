# Spec 061: Modelos de respuesta de Pydantic

## Usuario

Agustin, mantenedor. Ninguno de los 21 endpoints declara su respuesta: devuelven `dict` sueltos. El contrato con el frontend vive solo en `frontend/src/types/api.ts` y en algunos tests de contrato. Si un cambio en el backend renombra o quita un campo, nada lo frena hasta que se rompe la pantalla, y `/docs` no muestra qué devuelve cada endpoint. Es la segunda parte del ítem 11; la primera fue la Spec 060.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — modelos]:** `backend/schemas.py` define un modelo por respuesta, derivado del inventario de campos de 194 respuestas reales.
    *   Todos heredan de `ApiModel`, con `extra="forbid"`: un campo que el endpoint devuelva y el modelo no declare **falla** en lugar de desaparecer del JSON.
    *   Las tasas son `float | None`, porque son `None` cuando no hay llamadas.
*   **RF2 [Ubiquitous — rutas]:** las 21 rutas `/api` declaran `response_model`.
    *   Las de recomendaciones usan además `response_model_exclude_unset=True`: `excluded_amd` solo aparece en las recomendaciones de ruteo, como hasta ahora.
*   **RF3 [Unwanted behavior — sin cambios visibles]:**
    *   Las 194 respuestas de la foto de referencia (Spec 060) quedan idénticas, incluidos los tipos: ningún entero pasa a decimal.
    *   Sin cambios en el frontend, el esquema ni `/data`; sin librerías nuevas (Pydantic ya es dependencia de FastAPI); la cobertura no baja.
*   **RF4 [Testing]:** `backend/test_response_models.py`:
    *   todas las rutas `/api` tienen un esquema de respuesta en OpenAPI;
    *   un campo no declarado da `ResponseValidationError`;
    *   `excluded_amd` aparece solo en las recomendaciones de ruteo;
    *   OpenAPI documenta los modelos.

## Specs superadas por esta revisión

Ninguna. El contrato es el mismo; ahora está declarado.

## Datos de entrada

Sin cambios.

## Contrato JSON

Sin cambios. Ahora documentado en `/docs` y `/openapi.json`.

## Fuera de Alcance

*   Generar `frontend/src/types/api.ts` a partir de OpenAPI.
*   Validar los parámetros de entrada más allá de lo que ya hace FastAPI.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/061-spec-response-models/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Foto de referencia: 194/194 respuestas idénticas.
*   `run_checks.py` en verde con cobertura; CI en verde (3/3 en el último commit); squash merge.
