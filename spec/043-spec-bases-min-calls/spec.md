# Spec 043: Ranking de bases por volumen, con mínimo de llamadas

## Usuario

Analista / supervisor del call center. El usuario detectó (2026-10-01) que «Bases por AA %» premia bases con muy pocos intentos. `get_ranking` ordena solo por AA, sin volumen mínimo. Datos reales (01→15/09):

| Campaña | Primera hoy | Base con más volumen |
|---|---|---|
| 91 | base **27**: **1** llamada, 100% | base 4: 255.572 llamadas, 2.83% |
| 92 | base **4**: **5** llamadas, 100% | base 10: 378.399 llamadas, 1.98% |
| 38 | base **0**: **20** llamadas, 70% | base 76: 261.943 llamadas, 4.67% |

Un AA calculado sobre 1–35 llamadas es ruido estadístico. Criterio elegido por el usuario: **mínimo de llamadas** con el selector «Mín. llamadas» que ya existe (50 / 100 / 200). Las bases por debajo no compiten: se muestran abajo y en gris. Revisión del usuario durante la implementación: **entre las que compiten, primero las de más intentos**, con el AA como dato al lado.

## Requisitos Funcionales (EARS)

*   **RF1 [State-driven — backend]:** `GET /api/campaigns/{c}/bases-ranking` recibe `min_calls` (default **50**, `ge=1`; `0` → 422, igual que los demás rankings).
    *   Cada fila agrega **`ranked`** = `total_calls ≥ min_calls`.
    *   Orden: primero las rankeadas (**intentos desc** → AA desc → base), después las no rankeadas con el mismo criterio.
    *   Las filas existentes no pierden campos.
*   **RF2 [UI — tabla]:** `BasesRankingTable` recibe `minCalls`.
    *   Las bases rankeadas llevan `#1…#n` en orden de volumen. Se resalta en verde **la de mejor AA** entre las que compiten (`data-best-rate`), no la primera fila.
    *   Si hay no rankeadas, aparece una fila separadora (`bases-ranking-divider`) «Pocos intentos (menos de N llamadas) · no compiten en el ranking», y debajo esas bases en gris, con «—» como rank y `data-ranked="false"`.
    *   La tarjeta se llama «Bases por intentos», con el subtítulo «Las de más intentos primero, entre las bases con al menos N llamadas · en verde, la de mejor AA».
*   **RF3 [Event-driven — el selector manda]:** `fetchBasesRanking` y `useRangeRankings` envían `min_calls`, así que el ranking de bases sigue al selector «Mín. llamadas» en Campaña completa, Por semana y Comparar campañas.
*   **RF4 [UI — campañas]:**
    *   `mergeBaseRankings` marca cada fila `ranked` si la base es rankeada en A **o** en B. `compareBaseRows` ordena primero las rankeadas y, dentro de cada grupo, por la suma de intentos de A y B.
    *   `CrossRankingTable` atenúa las no rankeadas: texto gris y `data-ranked="false"`.
*   **RF5 [CSV]:** en `basesRankingRows`, la columna Rank vale `#n` para las rankeadas y «Pocos intentos» para las demás.
*   **RF6 [Unwanted behavior — aislamiento]:**
    *   Si una fila no trae `ranked` (respuestas viejas o fixtures), se trata como rankeada.
    *   Dispositivos, horas, diagnóstico y recomendaciones no cambian.
    *   Sin librerías nuevas.
*   **RF7 [Testing]:**
    *   **pytest:** el test de campos incluye `ranked`, más 2 nuevos (separación por `min_calls`, con las no rankeadas al final aunque tengan más AA; `min_calls=0` → 422).
    *   **vitest:**
        *   `BasesRankingTable`: separador, rank «—» y gris.
        *   `rankings.test`: rankeadas primero en la comparación.
        *   `exporters.test`: «Pocos intentos» en el CSV.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 003 / 026 / 030 | Ranking de bases solo por AA, sin volumen mínimo («todas las bases ordenadas») | Volumen mínimo con el selector; las de pocos intentos van aparte |

## Datos de entrada

*   Con `min_calls` 50, en la 91: 7 (461.369) → 4 (255.572) → 5 (17.135) → 14 (121); aparte quedan 0, 11 y 27.
*   Con `min_calls` 50, en la 38: 76 (261.943) → 34 (1.200); aparte quedan 80 y 0.

## Contrato JSON

`bases-ranking`: parámetro `min_calls` y campo `ranked` (aditivo).

## Fuera de Alcance

*   Otros criterios (participación en el volumen, agentes logrados).
*   Cambiar los rankings de dispositivos y horas (ya usan `min_calls`).

## Criterios de Finalización

*   Docs `spec/043-spec-bases-min-calls/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Smoke real: 91 → 7, 4, 5, 14 + aparte 0/11/27; 38 → 76, 34 + aparte 80/0.
*   Chrome: separador y filas en gris visibles; consola sin errores.
*   `/cerrar-spec 043` en verde; commit en español + push.
