# Spec 053: Mejor y peor dispositivo u hora con volumen mínimo relativo

## Usuario

Agustin, al analizar toda la campaña 35. «Puntos destacados» muestra *«Mejor dispositivo del período: GW26 con 16.07% de contacto humano (9 de 56 intentos)»*. GW26 tiene el **0,09%** del volumen: su tasa es azar.

Pasa porque `buildBestDevice`, `buildWorstDevice`, `buildBestHour` y `buildWorstHour` (Specs 030, 032 y 035) solo exigen un mínimo **absoluto** de 50 llamadas, que no alcanza en campañas de decenas o cientos de miles de llamadas. Es el mismo problema que la Spec 050 corrigió para la mejor jornada. Casos reales, 01→30/09:

| Campaña | Hoy | Problema |
|---|---|---|
| 35 | Mejor dispositivo: GW26 16,07% (9 de 56) | 0,09% del volumen |
| 38 | Mejor dispositivo: GW26 10,94% (29 de 265) | 0,04% del volumen |
| 91 | Peor dispositivo: 66F1BB5474D33B01C029B111 0,00% (0 de 3090) | 0,19% del volumen; parece una troncal de prueba |
| 92 | Peor dispositivo: 66F1BB5474D33B01C029B111 0,00% (0 de 663) | 0,03% del volumen |

Decisión del usuario (2026-10-02): umbral del **1% del volumen del rango**.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — criterio]:**
    *   Un dispositivo u hora es candidato a mejor o peor solo si cumple tres condiciones: `agent_answer_rate ≠ null`, `total_calls ≥ 50` (`BEST_DEVICE_MIN_CALLS` / `BEST_HOUR_MIN_CALLS`, sin cambios) y `total_calls ≥ HIGHLIGHT_MIN_SHARE × total del rango`.
    *   El total del rango es la suma de `total_calls` de la misma lista, sean dispositivos u horas.
    *   `HIGHLIGHT_MIN_SHARE = 0.01` vive en `frontend/src/lib/rangeThresholds.ts`.
    *   *Por qué:* un mínimo relativo escala con el volumen de cada campaña.
*   **RF2 [Ubiquitous — alcance]:**
    *   Aplica a `buildBestDevice`, `buildWorstDevice`, `buildBestHour` y `buildWorstHour`.
    *   Por eso cubre Campaña completa, Por semana y Comparar campañas, que los usan por campaña.
    *   Orden y empates, sin cambios. Sin candidatos, no se emite (`null`), como hoy.
*   **RF3 [Unwanted behavior — aislamiento]:**
    *   Sin cambios de backend, endpoints, rankings (que usan el `min_calls` del filtro), CSV ni `/data`.
    *   Sin librerías nuevas; la cobertura no baja.
*   **RF4 [Testing]:** vitest en `rangeDiagnostics.test.ts` con valores reales:
    *   35: el mejor dispositivo es IPLAN y no GW26;
    *   91: el peor es SPX_GSM19_GW19_4G y no la troncal de prueba;
    *   una hora con menos del 1% queda afuera;
    *   sin candidatos, `null`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 030 | Candidatos de `BEST_HOUR` / `BEST_DEVICE`: solo ≥ 50 llamadas | Además, ≥ 1% del volumen del rango |
| 032, 035 | Candidatos del peor dispositivo u hora: solo ≥ 50 llamadas | Ídem |

## Datos de entrada

Sin cambios. Valores esperados (01→30/09, antes → después):

| Campaña | Mejor dispositivo | Peor dispositivo | Horas |
|---|---|---|---|
| 35 | GW26 16,07% → **IPLAN 7,80%** (3180 de 40755) | IPLAN2 3,54% (sin cambio) | sin cambio (9 h mejor, 17 h peor) |
| 38 | GW26 10,94% → **IPLAN 4,69%** (23118 de 493157) | GW20 2,31% (sin cambio) | sin cambio |
| 91 | GW35 4,14% (sin cambio) | 66F1… 0,00% → **SPX_GSM19_GW19_4G 1,82%** (474 de 26021) | sin cambio |
| 92 | IPLANPREMIUM 3,08% (sin cambio) | 66F1… 0,00% → **GW22 0,82%** (206 de 25264) | sin cambio |

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Ocultar del todo las troncales de prueba (como `66F1…` o `PRUEBA`) en tablas y rankings.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/053-spec-min-share-highlights/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Tests con los valores reales de la tabla.
*   `run_checks.py` en verde con cobertura; CI en verde; squash merge.
