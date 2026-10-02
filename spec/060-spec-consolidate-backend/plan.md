# Plan de implementación — Spec 060

## Contexto
- `backend/repositories/campaigns_repo.py`:
  - `get_day_totals` y `get_range_totals`; `get_breakdown_by_base` y `_range`; `get_breakdown_by_device` y `_range`;
  - `build_compare_diagnostics`, con el resumen, las bases y los gateways a mano;
  - `_rate(agent_answers, total_calls, machine_answers)`, que no usa el tercer parámetro (14 llamadas).
- `backend/db_manager.py`: `get_db_connection` llama a `init_db` en cada request.

## Pasos
1. **Rama** `refactor/060-consolidate-backend` + docs + foto de referencia antes del cambio.
2. **Repo** eliminar las tres funciones por día; `build_compare_diagnostics` con los helpers de rango; `_rate` con dos parámetros.
3. **DB** `get_db_connection` con inicialización única por ruta.
4. **Tests** inicialización única; regresión completa.
5. **Verificación** foto de referencia idéntica · `/cerrar-spec 060` → PR → CI (3/3 en el último commit) → squash merge.
