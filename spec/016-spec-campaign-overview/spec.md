# Spec 016: Vista «Campaña completa» (overview por rango)

## Usuario

Analista / supervisor del call center (usuario interno del dashboard). Con la campaña 35 ya ingesta (Spec 015, 11 días), se necesita un análisis del **rango completo** sin obligar a elegir dos días.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — dos modos de vista]:** `App.tsx` ofrecerá dos modos accesibles desde tabs en el header: **«Campaña completa»** (nuevo, modo por defecto) y **«Comparar 2 días»** (vista existente **sin cambios** de componentes, contratos ni comportamiento).
    *   *Por qué:* Conservar el diagnóstico A/B (Specs 007–014) y añadir la lectura de período; Constitución #6.

*   **RF2 [Ubiquitous — filtro de rango]:** El modo nuevo usa `FilterRangeBar`: campos `Campaña`, `Desde`, `Hasta` (type `date`) y botón «Analizar».
    *   Defaults: campaña `35`, `2026-09-01` → `2026-09-15` (mismo patrón de defaults que `DEFAULT_FILTERS`).
    *   `Desde > Hasta` o campos vacíos → validación nativa del formulario (no se dispara la carga).

*   **RF3 [State-driven — KPIs acumulados]:** Cuatro `StatCard` alimentados por `GET /api/campaigns/{name}/summary?start_date&end_date`:
    *   **Total de llamadas** (`total_calls`).
    *   **Tasa de contacto** (`agent_answer_rate`, float 0–1 → `%` con 2 dec.; `null` → `—`).
    *   **Contestadores** (`machine_answers / total_calls` → `%` + absoluto en subtítulo).
    *   **Rechazadas** (`rejected_calls` + `%` del total en subtítulo).

*   **RF4 [State-driven — serie diaria del AA]:** Nuevo `DailyTrendChart` sobre `GET .../daily` (Spec 013):
    *   Eje X: fechas del rango (`DD/MM`). Eje izquierdo: barras `total_calls`. Eje derecho: línea `agent_answer_rate × 100`.
    *   Tooltip en español (fecha, intentos, Agent Answer); `rate: null` → `—`.
    *   `[]` → empty-state en español.

*   **RF5 [State-driven — tendencia horaria consolidada]:** Nuevo `HourlyAggregateChart` sobre `GET .../hourly-trend?start_date&end_date` (1 sola serie agregada del rango):
    *   Barras `total_calls` + línea `agent_answer_rate × 100` por `hora`.
    *   **No** se modifica `HourlyTrendChart` (A/B) — componente nuevo para no tocar su contrato (Spec 009).

*   **RF6 [State-driven — gateways del rango]:** Nueva `GatewaysRangeTable` sobre `GET .../devices` (orden `total_calls` DESC del repo):
    *   Columnas: Troncal, Intentos, AA %, Ocupado %, Congestión %; tasas `%` 2 dec. con `font-mono`; `null` → `—`.
    *   **No** se reutiliza `GatewaysTable` (contrato comparativo A/B, Spec 009 RF3).

*   **RF7 [Unwanted behavior — resiliencia]:** Cada sección maneja carga (skeleton), error de red (mensaje en español, sin romper layout) y datos vacíos (`[]` / `null`); el modo A/B nunca queda bloqueado por un error del modo rango.

*   **RF8 [Testing]:** Vitest cubre: `OverviewKpis` (valores y `null`), `DailyTrendChart` (datos/vacío), `HourlyAggregateChart` (datos/vacío), `GatewaysRangeTable` (filas/vacío), `FilterRangeBar` (submit con valores). Regresión: `pytest -q` y `vitest run` en verde.

## Specs superadas por esta revisión

Ninguna. Spec **aditiva** (nuevos componentes + modo en `App.tsx`); la vista A/B de Specs 008/009 permanece intacta.

## Datos de entrada

*   Endpoints de rango **ya existentes** ( Specs 002–006 y 013 ): `summary`, `daily`, `hourly-trend`, `devices`.
*   DB poblada por Spec 015 (11 fechas, campaña 35).
*   **Cero cambios de backend**, esquema o contratos.

## Contrato JSON

Sin cambios. Consumo de contratos existentes (ver Specs 002, 004, 005, 013).

## Fuera de Alcance

*   Cualquier cambio backend / DB / contratos.
*   Rankings, diagnósticos de rango, patrones y recomendaciones en el modo rango (candidatos a Spec 017).
*   Reemplazar o modificar la vista A/B; librerías nuevas (recharts ya instalado); auth; deploy.

## Criterios de Finalización

*   Dos tabs funcionales; al cambiar de modo no se pierde el estado del otro (cada modo conserva su filtro).
*   KPIs del rango `2026-09-01 → 2026-09-15` con smoke: total **35.413**, AA **5.94%**, contestadores **11.282** (31.86%), rechazadas **22.027**.
*   `DailyTrendChart` con **11** puntos (01→15 sin fines de semana); `HourlyAggregateChart` con horas 9–17; `GatewaysRangeTable` con los gateways del rango (GW39, GW37, GW20, IPLAN2…).
*   `pytest -q` en verde; `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` en verde.
*   Vista A/B: tests existentes (22) sin cambios de aserciones.
*   `/data` sin modificaciones (mtime intacto).
