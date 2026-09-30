# Spec 06: Health Score, Rankings y Diagnósticos

## Usuario

Desarrollador junior / frontend del dashboard.

## Requisitos Funcionales (EARS)

*   **RF1 [Cálculo de Score]:** Para cada **agregado por dispositivo** y cada **agregado por hora** (no el cruce device×hora), el sistema calculará un `health_score` en puntos porcentuales:
    `health_score = round((agent_answer_rate − busy_rate × HEALTH_WEIGHT_BUSY − congestion_rate × HEALTH_WEIGHT_CONGESTION) × 100, 2)`
    *   Pesos en `config.py` (0.5 busy, 1.5 congestión — congestión penaliza más por ser saturación de red).
    *   Si `agent_answer_rate`, `busy_rate` o `congestion_rate` es `null` (denominador ≤ 0) → `health_score: null`; los `null` **se excluyen** de los rankings.
    *   *Por qué:* Un score único que premia contacto efectivo y castiga ocupado/saturación para ordenar gateways y horas.
*   **RF2 [Filtro de Volumen]:** `GET /devices/ranking`, `GET /hours/ranking` y `GET /diagnostics` aceptan `min_calls` (entero, default **50**, `ge=1`). Segmentos con `total_calls < min_calls` se excluyen (evita distorsión con poco tráfico).
*   **RF3 [Ranking Dispositivos]:** `GET /api/campaigns/{name}/devices/ranking?start_date=&end_date=&min_calls=&limit=` responde `{min_calls_applied, limit_applied, best, worst}`:
    *   `best`: top-`limit` (default **5**) por `health_score` DESC (desempate: `total_calls` DESC, `device` ASC).
    *   `worst`: bottom-`limit` por `health_score` ASC (mismos desempates inversos: score ASC, `total_calls` ASC, `device` ASC).
    *   Si hay ≤1 segmento con score, puede aparecer en ambas listas. Sin segmentos → `best: []`, `worst: []`.
*   **RF4 [Ranking Horarios]:** `GET /api/campaigns/{name}/hours/ranking?...` misma estructura que RF3 con campo **`hora`** en lugar de `device`. Agregación multi-día = `SUM` de contadores por hora (igual que `hourly-trend`). Orden de `worst` por hora: score ASC, `hora` ASC.
*   **RF5 [Patrones y Alertas Críticas]:** `GET /api/campaigns/{name}/diagnostics?start_date=&end_date=&min_calls=` responde objeto con `min_calls_applied` y **3 listas** (cada elemento filtrado por `min_calls`; vacío → `[]`, HTTP 200):
    *   `congested_gateways`: gateways con `congestion_rate ≥ DIAG_CONGESTION_THRESHOLD` (0.05) → campos `device`, `total_calls`, `congestion_rate`, `health_score`, `message` (español).
    *   `burn_hours`: horas con `busy_rate ≥ DIAG_BUSY_THRESHOLD` (0.35) → `hora`, `total_calls`, `busy_rate`, `health_score`, `message`.
    *   `peak_hours`: horas con `agent_answer_rate ≥ DIAG_PEAK_THRESHOLD` (0.15) → `hora`, `total_calls`, `agent_answer_rate`, `health_score`, `message`.
    *   Umbrales en `config.py` (nombre distinto a `AGENT_ANSWER_THRESHOLD`, que es mínimo de alerta de patterns).
    *   *Por qué:* Separar “red llena”, “base quemada” y “pico bueno” en una sola llamada para el front.

## Contrato JSON (resumen)

### `GET .../devices/ranking`
```json
{
  "min_calls_applied": 50,
  "limit_applied": 5,
  "best": [
    {
      "device": "IPLAN2",
      "total_calls": 450,
      "agent_answer_rate": 0.172,
      "busy_rate": 0.1667,
      "congestion_rate": 0.04,
      "health_score": 0.57
    }
  ],
  "worst": [
    {
      "device": "GW20",
      "total_calls": 918,
      "agent_answer_rate": 0.0613,
      "busy_rate": 0.463,
      "congestion_rate": 0.0512,
      "health_score": -24.7
    }
  ]
}
```

### `GET .../hours/ranking`
Mismo shape; cada item lleva `"hora": 9` en lugar de `"device"`.

### `GET .../diagnostics`
```json
{
  "min_calls_applied": 50,
  "congested_gateways": [
    {"device": "GW37", "total_calls": 1644, "congestion_rate": 0.1527, "health_score": -22.03, "message": "GW37 en saturación de red (congestión 15.3%)."}
  ],
  "burn_hours": [],
  "peak_hours": []
}
```
Sin hallazgos → todas las listas `[]`. Rango vacío → mismas claves con listas vacías, 200.

## Fuera de Alcance

*   Ajuste dinámico de pesos/umbrales en runtime (viven en `config.py`).
*   Interfaz gráfica / dashboards (API pura).
*   Score por cruce device×hora (solo agregados separados).
*   Modificar el contrato existente de `GET .../devices` (sin `health_score` allí por ahora).

## Criterios de Finalización

*   `compute_health_score` puro y testeable; pesos/umbrales en `config.py`.
*   Rankings con `min_calls`, `limit`, orden y desempates según RF3/RF4; score `null` excluido.
*   `diagnostics` con 3 listas, `min_calls`, mensajes en español; vacío → `[]` y 200.
*   `pytest` en verde (Spec 01–06); re-ingesta y smoke de los 3 endpoints en campaña 35.
