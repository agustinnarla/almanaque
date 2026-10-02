# Plan de implementación — Spec 061

## Contexto
- `backend/routers/{campaigns,metrics,patterns,methodology}.py`: 21 rutas `@router.get` sin `response_model`.
- La foto de referencia de la Spec 060 (194 respuestas reales) da el inventario de campos y tipos de cada respuesta.
- `excluded_amd` es opcional (solo `ROUTING`, `services/recommendations_engine.py:92`). `burn_hours` viene vacío en los datos reales; su forma sale del código (`campaigns_repo.get_campaign_diagnostics`).

## Pasos
1. **Rama** `refactor/061-response-models` + docs.
2. **Modelos** `backend/schemas.py` (`ApiModel` estricto).
3. **Rutas** `response_model` en las 21; `exclude_unset` en las de recomendaciones.
4. **Tests** `backend/test_response_models.py`.
5. **Verificación** foto idéntica · `/cerrar-spec 061` → PR → CI (3/3 en el último commit) → squash merge.
