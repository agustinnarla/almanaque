# Plan 13: Serie diaria de Agent Answer (endpoint /daily)

## 1. Repositorio (`backend/repositories/campaigns_repo.py`)

Nueva función `get_daily_trend(conn, campaign_name, start_date, end_date) -> list[dict]`:

*   SQL: `SELECT fecha, {AGG_COLUMNS} FROM daily_campaign_metrics WHERE campaign = ? AND fecha BETWEEN ? AND ? GROUP BY fecha ORDER BY fecha ASC`.
*   Por cada fila:
    ```python
    {
        "fecha": str(row["fecha"]),
        "total_calls": int(...),
        "agent_answers": int(...),
        "machine_answers": int(...),
        "agent_answer_rate": _rate(agents, total, machines),  # Spec 012
    }
    ```
*   `_rate` ya maneja `total ≤ 0 → None` (RF2). No se duplica la fórmula.
*   Posición: junto a `get_hourly_trend` para mantener la cohesión de "trends".

## 2. Router (`backend/routers/campaigns.py`)

*   Importar `get_daily_trend`.
*   Nuevo handler:
    ```python
    @router.get("/{campaign_name}/daily")
    def campaign_daily(campaign_name, start_date: date = Query(...), end_date: date = Query(...), conn=Depends(get_db_connection)):
        return get_daily_trend(conn, campaign_name, start_date, end_date)
    ```
*   FastAPI valida tipo `date` → 422 automático (RF1). Rango vacío / campaña inexistente → SQL sin filas → `[]` (RF4).

## 3. Tests (`backend/test_api.py`)

*   `test_daily_trend_contract_order_and_rates` — con `seed_metrics`: fechas `["2026-09-01", "2026-09-02"]` en orden asc; día 01 → `38/290`; día 02 → `50/100`; `set(row) == {fecha, total_calls, agent_answers, machine_answers, agent_answer_rate}`; campaña 40 excluida.
*   `test_daily_trend_single_day_start_equals_end` — `start=end=01` → 1 fila.
*   `test_daily_trend_empty_range_returns_200_and_empty_list` — rango futuro → `[]`.
*   `test_daily_trend_unknown_campaign` → `[]`.
*   `test_daily_trend_invalid_date_returns_422` → 422.

## 4. Docs

*   `spec/013-spec-daily-series/{spec,plan,task}.md` (patrón Spec 012; sin reescribir 001–012).

## 5. Sin cambios

*   `metrics_engine`, `config.py`, esquema DB, frontend, engines (diagnostics/recommendations/patterns).
*   `/data` solo lectura; **sin re-ingesta**.

## 6. Verificación

1.  `.venv/Scripts/python -m pytest -q` → 0 failed.
2.  Smoke campaña 35 (script sobre DB local o curl con uvicorn): `daily?start_date=2026-09-01&end_date=2026-09-02` → rates ≈ **0.0576** / **0.0441** (coinciden con `summary` por día).
3.  `stat` mtime de `/data`: 1790080283 / 1790080255 intactos.
4.  `task.md` items en `[x]`.

## Flujo

1.  Docs Spec 013 (spec/plan/task)
2.  `get_daily_trend` → router → tests
3.  `pytest -q` → smoke → mtime → `task.md [x]`
