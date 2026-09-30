# Spec 09: Gráficos y Tabla Comparativa (Dashboard)

## Usuario

Analista / supervisor del call center (usuario interno del dashboard).

## Requisitos Funcionales (EARS)

*   **RF1 [Verificación - sin código]:** El badge de la tarjeta Congestión ya alinea semántica con el delta (Opción A, Spec 008):
    *   `delta < 0` → “Mejorando” (emerald); `delta > 0` → “Empeorando” (rose); `delta == 0` → “Sin cambios”; `null` → “Sin datos”.
    *   *Por qué:* Cerrado en Spec 008; esta spec solo verifica, **no reimplementa**.

*   **RF2 [Gráfico Intradía - Recharts]:** Nuevo componente `HourlyTrendChart` que consume `GET /api/campaigns/{name}/hourly-trend` con **dos requests** (una por fecha: `start_date = end_date = date_a` y otra `= date_b`).
    *   **Eje X:** Franjas horarias presentes en la unión de ambas respuestas (orden ascendente; no hardcodear 09–18).
    *   **Eje Y Izquierdo:** Volumen `total_calls` — **barras**: Día A gris tenue (`slate-300`), Día B sólido (p.ej. `indigo-500`).
    *   **Eje Y Derecho:** `agent_answer_rate` en % (`×100`, 2 dec. en tooltip) — **líneas**: Día A **discontinua**, Día B **continua**.
    *   **Tooltips** en español: hora, volumen A/B, contacto A/B; rate `null` → “—”.
    *   Sin datos (`[]` en ambas) → empty-state en español; error de red → mensaje defensivo (RF5).

*   **RF3 [Tabla Comparativa de Gateways]:** Nuevo componente `GatewaysTable` sobre `gateways_comparison` de `GET .../compare/diagnostics`.
    *   Columnas: `Troncal / Gateway`, `Congestión Día A`, `Congestión Día B`, `Variación (pp)`, `Estado`.
    *   Tasas en % con 2 decimales; **Variación (pp)** = `delta_congestion × 100` con 2 decimales y signo (el API entrega **fracción**).
    *   Tipografía `font-mono` y alineación a la derecha en métricas.
    *   **Precedencia de badge `Estado` (confirmada):**
        1.  **Saturado** si `congestion_rate_b ≥ 0.05` (aunque haya mejorado).
        2.  **Aliviado** si `congestion_rate_b < 0.05` **y** `delta_congestion ≤ -0.02` (−2 pp).
        3.  **Normal** en el resto.
    *   `gateways_comparison` en `null` o `[]` → empty-state en español (no romper layout).

*   **RF4 [Layout e Integración]:** En `App.tsx`, estructura en niveles:
    1.  Filtros globales (`FilterBar`).
    2.  Tarjetas KPI (`StatCard` ×4).
    3.  Diagnósticos (`DiagnosticsFeed`).
    4.  **Nuevo:** análisis temporal + infraestructura — `HourlyTrendChart` (~7–8 col) y `GatewaysTable` (~4–5 col) en `md`/`lg`; apilados en mobile. Títulos de sección en **español**.

*   **RF5 [Testing y Resiliencia]:** Vitest cubre al menos: `GatewaysTable` (filas, precedencia Saturado>Aliviado, `null`/`[]`) y `HourlyTrendChart` (render con datos y vacío). Estados: carga (skeleton simple), error y colecciones vacías en español. Regresión: `pytest -q` y `vitest run` en verde.

## Fuera de Alcance

*   Nuevos endpoints o cambios de contrato backend.
*   Recharts ya instalado: **no** agregar librerías de chart nuevas.
*   Ranking de devices/hours en la UI (sigue fuera, Spec 008).
*   Colección `insights` en el feed; auth; deploy.

## Criterios de Aceptación

*   `npm run dev` + backend `:8000`, campaña **35**, **2026-09-01** vs **2026-09-02**:
    *   Gráfico muestra ambos días (A atenuado / B sólido) con volumen + línea de contacto.
    *   `GatewaysTable` con **GW37** en **Saturado** (cong. B ≥ 5%) y variación en pp (ej. ≈ −4.83).
*   Badge Congestión KPI sigue “Mejorando” con delta verde (RF1 sin regresión).
*   `npx vitest run` en verde; `pytest -q` en verde; `tsc -b` sin errores.
*   UI en español; nombres de archivos/variables en inglés.
