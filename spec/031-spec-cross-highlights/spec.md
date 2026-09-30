# Spec 031: Intentos, highlights por campaña y grillas comparadas (modo Campañas)

## Usuario

Analista / supervisor del call center (usuario interno). La Spec 030 llevó las mejoras al modo **Campaña completa**; el modo **Campaña vs Campaña** quedó atrás:

1.  Las tablas de «Rankings comparados» **no muestran intentos** (ni bases ni segmentos): una tasa del 70% sobre 20 llamadas se ve igual que una sobre 261.943.
2.  Las 3 tarjetas del grid (`gap-6`/`p-4`) con tablas de 6 columnas en `text-xs`/`px-1` quedan **apretadas**: hay que elegir entre leer las tasas o los health scores.
3.  El diagnóstico comparado no dice **cuál fue la mejor hora ni el mejor dispositivo de cada campaña** en el período.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — devices por campaña en el endpoint de comparación]:** `GET /api/campaigns/compare-campaigns` agregará al envelope **`devices_a`** y **`devices_b`** (`DeviceRangeRow[]` vía `get_device_metrics`, ya existente), siguiendo el patrón de `hourly_a`/`hourly_b`.
    *   Defaults `[]` cuando falta alguna campaña (mismo early-return actual); **cero** endpoints nuevos y sin cambios en los demás campos.
    *   Tipo front `CrossCampaignCompareResponse` += `devices_a: DeviceRangeRow[]` · `devices_b: DeviceRangeRow[]`.
*   **RF2 [State-driven — intentos en las 3 tablas comparadas]:** `CrossRankingRow` gana **`attemptsA: number | null`** y **`attemptsB: number | null`**, poblados por `mergeBaseRankings`/`mergeSegmentRankings` desde `total_calls` (lado faltante → `null`).
    *   `CrossRankingTable` columnas: **Bases (6)** `Base | Intentos A | AA A | Intentos B | AA B | Δ`; **Dispositivos/Horas (8)** `Segmento | Intentos A | AA A | H A | Intentos B | AA B | H B | Δ`.
    *   Intentos con `toLocaleString('es-AR')` y `font-mono`; health/delta conservan `data-good/warn/bad` y `data-delta-*`; fila #1 `bg-emerald-50`.
    *   CSV `crossRankingRows` con `Intentos A/B` en el mismo orden (hereda Spec 025).
*   **RF3 [UI — rankings comparados apilados]:** «Rankings comparados» pasa de `grid lg:grid-cols-3 gap-6` + tarjetas `p-4` a **1 columna apilada** (`grid items-start gap-8`), tarjetas `p-5`, subtítulo `text-xs` por tarjeta y CSV con `flex-wrap`.
    *   Al estar a lo ancho, `CrossRankingTable` vuelve a `text-sm` + `px-3 py-2.5` (se elimina el modo `compact text-xs/px-1`) y envuelve la tabla en `overflow-x-auto` como cortasía en pantallas angostas.
*   **RF4 [State-driven — mejor hora y mejor dispositivo por campaña]:** `buildBestHour` y `buildBestDevice` aceptan un parámetro opcional **`campaign?: string`** (criterio Spec 030 intacto: mayor `agent_answer_rate`, `total_calls ≥ 50`, empate → `agent_answers` → hora/device ASC):
    *   Sin campaña → copy y `entity` **intactos** (modo rango sin regresión).
    *   Con campaña → `entity: "11 · 35"` / `"IPLAN · 38"` (distingue A de B; IPLAN es mejor dispositivo en ambas campañas) y mensaje «Mejor hora de la campaña 35: 11h con 7.09% de contacto humano (366 de 5161 intentos).».
    *   Fuentes ya cargadas: `devices_a/b` (RF1) e `hourly_a/b` (existentes). **Cero requests extra.**
*   **RF5 [UI — Puntos destacados del modo campañas]:** nuevo builder puro `composeCrossPositives(backendPositives, campaignEvents)` en `frontend/src/lib/crossDiagnostics.ts`:
    *   **Garantiza** los highlights de campaña (hasta 4: hora/dispositivo de A y de B) y completa con los `positive_drivers` del backend **en su orden** hasta `POSITIVE_DRIVERS_MAX` (**5**).
    *   Salida: `[…positivos backend…, hora A, device A, hora B, device B]`; eventos `null` (campaña sin datos) se descartan.
    *   `DiagnosticsFeed` en `CampaignsCompareMode` recibe `positiveTitle="Puntos destacados"` y `positiveDescription="Fortalezas y señales positivas del período"` (igual que el modo rango); CompareMode (2 días) **intacto** con sus textos default.
*   **RF6 [Unwanted behavior — aislamiento]:**
    *   Un solo campo aditivo en backend (`devices_a/b`); el resto es front. `pytest` de 163 → **164**.
    *   Sin librerías nuevas; RangeMode y CompareMode sin cambios funcionales; conteo de botones CSV de campañas **12 → 12**.
*   **RF7 [Testing]:**
    *   `pytest`: test nuevo de `devices_a/b` en `compare-campaigns` con el seed de tests (campaña 35: `GW37` 300 intentos / `GW20` 90; campaña 40: `GW37` 80) y contrato de claves.
    *   `vitest`: `rankings.test` (attempts en ambos merges) · `CrossRankingTable.test` (headers/celdas e índices de Δ) · `exporters.test` (`crossRankingRows` con intentos) · `rangeDiagnostics.test` (copy/entity con campaña) · **nuevo** `crossDiagnostics.test` (garantía, orden, cap 5) · fixtures `devices_a/b` + `attemptsA/B` en `ModeTabs`/`ExportButtons`.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 028 | RF1 columnas/orden/layout de `CrossRankingTable` (`Base \| AA A \| AA B \| Δ` en 3 tarjetas `lg:grid-cols-3`, `text-xs`) y headers de `crossRankingRows` | Ahora 6/8 columnas con Intentos A/B, apilado a lo ancho con `text-sm`; CSV con intentos |

Spec 030 se **extiende** al modo campañas (intentos + highlights); Specs 023/024/027 y CompareMode **intactos**.

## Datos de entrada (smoke real 35 vs 38, 2026-09-01 → 2026-09-15)

*   `bases-ranking` intentos → 35: `34 = 198`, `76 = 17`, `80 = 35.198` · 38: `0 = 20`, `80 = 35`, `34 = 1.200`, `76 = 261.943`.
*   `devices_a/b` → 35 mejor **IPLAN** 7.19% (1195/16625) · 38 mejor **IPLAN** 6.79% (7794/114708).
*   `hourly_a/b` → 35 mejor hora **11** (7.09%, 366/5161) · 38 mejor hora **9** (8.10%, 1194/14736).
*   `positive_drivers` del backend (hoy) → **1** (`BASE_IMPROVEMENT` Base 34) → total de tarjetas = **5**.
*   `min_calls` = `cross.minCalls` (50) y `limit` = 5; umbrales Spec 030 (`BEST_*_MIN_CALLS = 50`).

## Contrato JSON

```jsonc
// GET /api/campaigns/compare-campaigns?campaign_a=35&campaign_b=38&start_date&end_date&min_calls=50
{
  "campaign_a": "35", "campaign_b": "38",
  "start_date": "2026-09-01", "end_date": "2026-09-15",
  "min_calls_applied": 50,
  "summary": { /* sin cambios */ },
  "gateways_comparison": [ /* sin cambios */ ],
  "bases_comparison": [ /* sin cambios */ ],
  "hourly_a": [ /* sin cambios */ ], "hourly_b": [ /* sin cambios */ ],
  "daily_a": [ /* sin cambios */ ], "daily_b": [ /* sin cambios */ ],
  "devices_a": [ { "device": "IPLAN", "total_calls": 16625, "agent_answer_rate": 0.0719, /* … */ } ],
  "devices_b": [ /* idem campaña 38 */ ]
}
```

`DiagnosticEvent.type` agrega `BEST_HOUR`/`BEST_DEVICE` también en el modo campañas (front-only); mensajes en español; UI en español.

## Fuera de Alcance

*   `/data`, esquema DB, routers, engines; renombrar campos existentes.
*   CompareMode (día A vs día B) y RangeMode; nuevas columnas en «Comparativa de bases/gateways».
*   Paginación; librerías nuevas; export a PDF.

## Criterios de Finalización

*   Docs `spec/031-spec-cross-highlights/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke 35 vs 38 (01→15/09):
    *   «Rankings comparados» **apilado** (`gap-8`, tarjetas `p-5`, subtítulos) con bases de 6 columnas (4 filas: `34 198|1200`, `76 17|261943`, `80 35198|35`, `0 —|20`) y dispositivos/horas de 8 columnas.
    *   «Puntos destacados» = **5** tarjetas: comparative `BASE_IMPROVEMENT` + `11 · 35` + `IPLAN · 35` + `9 · 38` + `IPLAN · 38`.
    *   CSV `campanas_35_vs_38_rank_bases.csv` con `Intentos A`/`Intentos B`.
*   `pytest -q` = **164**; `npm test` + `tsc` + `lint` + `build` en verde.
*   `package.json` sin dependencias nuevas; `/data` mtimes intactos.
