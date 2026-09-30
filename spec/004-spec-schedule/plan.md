# Plan 04: Granularidad Horaria y Tendencia Intradía

## 1. Módulos Modificados (Ingesta y DB)

*   **`data_cleaner`**: tras convertir `INICIO` a datetime y aplicar el filtro `< 20`, poblar `hora = INICIO.dt.hour` (ENTERO). NaT ya se descartan antes → sin nulos de hora.
*   **`metrics_engine`**: `groupby(['FECHA', 'HORA', 'campaign', 'BASE'])` — nombre de columna **`campaign`**, jamás `CAMPAÑA`. Salida con `hora` en minúscula para la DB.
*   **`db_manager`**:
    *   `CREATE TABLE` con `hora INTEGER NOT NULL` y PK `(fecha, hora, campaign, base)`.
    *   `migrate_recreate_hourly(conn)`: si la PK actual no es la de 4 columnas, `DROP TABLE` + `CREATE` con el nuevo esquema (los datos se recuperan re-ingestando `/data`).
    *   `get_db_connection` y `main.py` llaman la migración al abrir.
    *   `replace_day` **sigue haciendo `DELETE` solo por `fecha`** (borra todas las horas del día y reinserta).
*   **`main.py`**: sin cambios de orquestación; al iniciar migra y procesa todos los xls de `/data`.

## 2. Repositorios y Endpoints

*   **`campaigns_repo.get_hourly_trend(conn, name, start, end)`**: agrupa por `hora` con `SUM(total_calls)`, `SUM(agent_answers)`, `SUM(machine_answers)`; rate = Σagent / (Σtotal − Σmachine) (null si denom ≤ 0); orden `hora ASC`.
*   **`routers/campaigns.py`**: `GET /{campaign_name}/hourly-trend` con `start_date`/`end_date` tipo `date`; sin filas → `[]`.
*   **`metrics_repo`**: SELECT agrega `hora`; `ORDER BY fecha, hora, campaign, base`.
*   **`pattern_detector`**: propaga `hora` en cada alerta (evaluación por fila horaria).

## 3. Contrato JSON

Ver `spec.md`. Resumen de impacto:

| Endpoint | Cambio |
|---|---|
| `/api/metrics` | + campo `hora` |
| `/api/patterns` | + campo `hora`; alertas por hora |
| `.../hourly-trend` | nuevo; `hora, total_calls, agent_answers, machine_answers, agent_answer_rate` |

## 4. Decisiones Técnicas Justificadas

*   **Decisión A: Hora desde `INICIO`.** Misma columna que el filtro horario de 001; las no conectadas también tienen hora de discado.
*   **Decisión B: Recrear tabla en código vs borrar `.db`.** La PK de SQLite no admite `ALTER`; recrear + re-ingesta es idempotente y no depende de pasos manuales. *Descartado:* borrar el archivo a mano (contradice Spec 003 y es pasible de olvido).
*   **Decisión C: Rate multi-día = Σ/Σ.** Nunca promedio de ratios (misma razón que 002 Decisión C).
*   **Decisión D: Patterns horarios.** Consistencia total con la nueva PK; el front puede agregar a nivel día si lo necesita.
*   **Decisión E: groupby con `campaign` en inglés.** Continuidad con Spec 003; `CAMPAÑA` rompería el código real.

## 5. Estrategia de Tests (Testing)

*   **Cleaner:** `INICIO` 10:35 → `hora == 10`; fila de 20:00 ya no existe por filtro 001.
*   **Metrics:** salida con columna `hora`; mismo `(fecha, campaign, base)` en dos horas → 2 filas.
*   **DB:** PK de 4 columnas; migración deja la tabla con `hora`; `replace_day` limpia todas las horas de la fecha.
*   **Repo/HTTP hourly-trend:** dos días con datos en hora 9 → contadores **sumados** y rate Σ/Σ (no promedio de rates); rango vacío → `200 []`; orden 0…n.
*   **Contrato:** `metrics` y `patterns` incluyen `hora`.
*   **Regresión:** suites 001–003 en verde (actualizando seeds/schema donde haga falta).
