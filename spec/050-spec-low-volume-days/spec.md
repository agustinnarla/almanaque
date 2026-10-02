# Spec 050: Marca de días con poco volumen

## Usuario

Analista / supervisor del call center. Un día con poco volumen puede tener un AA muy alto por azar. Hoy el dashboard lo presenta igual que los demás:

*   **Campaña 35, 01→30/09:** «Puntos destacados» muestra *«Mejor jornada del período: 2026-09-18 con 14.60% de contacto humano (168 de 1151 intentos)»*. Ese día tuvo el 44% de la mediana diaria del rango (2.618 llamadas).
*   En la serie diaria, el 18/09 aparece como el pico del AA, sin ninguna señal de que tiene menos de la mitad del volumen habitual.
*   **Campaña 91:** el 04/09 tuvo 34.932 llamadas, el 48% de su mediana (73.114).

Es el ítem 5 de la segunda ronda de mejoras.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — criterio]:** `frontend/src/lib/lowVolume.ts`, función pura `lowVolumeDays(points)`:
    *   Devuelve `{ median, days: Set<fecha> }`.
    *   Un día es de **poco volumen** si `total_calls < LOW_VOLUME_DAY_SHARE × mediana`, siendo la mediana la del `total_calls` diario del rango.
    *   `LOW_VOLUME_DAY_SHARE = 0.5`.
    *   Con menos de `LOW_VOLUME_MIN_DAYS = 3` días no se marca ninguno, porque la mediana no es representativa. Sin días, `median = 0` y el conjunto vacío.
    *   Las dos constantes viven en `lib/rangeThresholds.ts`.
    *   *Por qué:* es un umbral relativo. Uno absoluto no sirve, porque cada campaña tiene volúmenes muy distintos (de ~2,6 mil a ~88 mil llamadas por día).
*   **RF2 [State-driven — mejor jornada]:** `buildBestDay` excluye los días de poco volumen, además del mínimo absoluto `BEST_DAY_MIN_CALLS`.
    *   Si todos los candidatos quedan excluidos, no hay mejor jornada (`null`).
*   **RF3 [UI — serie diaria]:** en `DailyTrendChart` (Campaña completa y Por semana), los días de poco volumen se marcan sin depender solo del color:
    *   **Barra de llamadas:** atenuada, con opacidad 0,35.
    *   **Punto del AA:** hueco, con borde del color de la serie y relleno del color de la superficie.
    *   **Tooltip:** suma la línea «Poco volumen: NN% de la mediana del rango».
    *   **Nota bajo el gráfico:** «Poco volumen (menos del 50% de la mediana del rango, N llamadas): 18/09. Su AA se lee con cautela.», con la clave del punto hueco. Si no hay días marcados, no se muestra.
    *   **«Ver tabla»:** suma la columna «Poco volumen» («Sí» o «—»).
    *   **CSV:** no cambia.
*   **RF4 [Ubiquitous — componente]:** `RateVolumeChart` acepta `lowVolumeKey?` (campo booleano del dato). Sin esa prop se comporta como antes, así que los gráficos comparados no cambian.
*   **RF5 [Unwanted behavior — aislamiento]:**
    *   Sin cambios de backend, endpoints, CSV ni `/data`.
    *   `pytest` = **203**.
    *   Sin librerías nuevas.
    *   El piso de cobertura no baja.
*   **RF6 [Testing]:**
    *   `lowVolume.test.ts`: mediana; marca debajo del 50%; menos de 3 días; vacío.
    *   `buildBestDay`: excluye el día de poco volumen; devuelve `null` si solo quedaban días de poco volumen.
    *   `RateVolumeChart`: barras atenuadas y punto hueco solo con `lowVolumeKey`.
    *   `DailyTrendChart`: nota y columna de la tabla; sin nota si no hay días marcados.
    *   Regresión con cobertura: `run_checks.py` y el CI.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 020 | `BEST_DAY`: candidato con ≥ `BEST_DAY_MIN_CALLS` llamadas | Además excluye los días de poco volumen (RF2) |

## Datos de entrada

Serie diaria (`/api/campaigns/{c}/daily`), sin cambios. Valores reales:

| Campaña · rango | Mediana | Poco volumen | Mejor jornada hoy → nueva |
|---|---|---|---|
| 35 · 01→30/09 | 2.618 | 18/09 (1.151) | 18/09 14,60% → **22/09 11,13%** (191 de 1716) |
| 35 · 14→18/09 | 2.998 | 18/09 | 18/09 14,60% → **14/09 7,12%** (263 de 3693) |
| 91 · 01→30/09 | 73.114 | 04/09 (34.932) | 15/09 4,13% (sin cambio) |
| 38 y 92 · 01→30/09 | 27.548 / 87.712 | ninguno | sin cambio |

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   La serie diaria comparada entre campañas (cada campaña tiene su propia mediana) y las horas de poco volumen.
*   Cambiar el CSV.
*   Modificar `/data`; nuevas dependencias.

## Criterios de Finalización

*   Docs `spec/050-spec-low-volume-days/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Tests con los valores reales de la tabla de «Datos de entrada»: lo que `lowVolumeDays` marca y la nueva mejor jornada.
*   `run_checks.py` en verde con cobertura (pytest **203**); CI en verde en el PR; squash merge.
