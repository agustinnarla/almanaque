# Spec 041: Segmentos de negocio y resumen ejecutivo

## Usuario

Analista / supervisor del call center (usuario interno). Dos problemas de diseño:

1.  **Las campañas pertenecen a negocios distintos que no se comparan.** El usuario lo confirmó el 2026-10-01: **35 y 38 son Galicia Empresas**, **91 y 92 son Galicia Individuos**. Hoy el dashboard no lo sabe: los selectores las mezclan y «Comparar campañas» permite 35 vs 91, que da conclusiones erróneas (el AA de Individuos, 2–3%, no es comparable con el de Empresas, 5–6%).
2.  **Cada modo es una lista larga de secciones sin conclusión.** Para saber «cómo vamos y qué hago» hay que leer KPIs, diagnóstico y recomendaciones por separado.

Decisiones del usuario: **bloquear** la comparación entre segmentos y hacer **segmentos + resumen ejecutivo** en esta spec. Responsive y paleta van en la siguiente.

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — segmento en el backend]:**
    *   `config.py` define `CAMPAIGN_SEGMENTS = {"35": "Galicia Empresas", "38": "Galicia Empresas", "91": "Galicia Individuos", "92": "Galicia Individuos"}` y `DEFAULT_SEGMENT = "Sin segmento"`.
    *   `GET /api/campaigns` agrega `segment` a cada entrada; una campaña que no está en el mapa sale como `"Sin segmento"`. El orden no cambia.

*   **RF2 [UI — selectores agrupados]:** `CampaignSelect` agrupa las opciones con `<optgroup label="<segmento>">`, en el orden en que aparecen en el catálogo. La línea de contexto de Campaña completa / Por semana suma el segmento: «35 · Galicia Empresas · …».

*   **RF3 [Unwanted behavior — sin cruces entre segmentos]:**
    *   En `FilterCrossCampaignBar`, la **Campaña B solo ofrece campañas del segmento de A**.
    *   Si cambia A y B queda en otro segmento, B pasa a la primera otra campaña del segmento de A, o a A misma si es la única.
    *   `defaultCrossValues` elige B con la misma regla.
    *   Con los datos actuales el default sigue siendo 35 vs 38.

*   **RF4 [UI — resumen ejecutivo]:** Nuevo `components/Insights/ExecutiveSummary.tsx`, una `<section id="sec-resumen" aria-label="Resumen">` con `h2` «Resumen».
    *   Muestra hasta 4 líneas, cada una con ícono y etiqueta:
        | Línea | Contenido |
        |---|---|
        | **Contexto** | El número principal del modo |
        | **Principal problema** | La primera causa negativa ya compuesta |
        | **Punto fuerte** | El primer punto destacado / factor de mejora |
        | **Qué hacer** | La primera oración de la recomendación de mayor prioridad |
    *   Se ubica después de la línea de contexto y **antes del índice**. El índice suma el enlace «Resumen» después de «Filtros».
    *   Una línea sin dato, por ejemplo porque sigue cargando o no hay causas, no se muestra.
    *   Builders puros en `lib/executiveSummary.ts`:
        | Builder | Contexto |
        |---|---|
        | `rangeSummaryItems` (rango / semana) | «AA 2.77% sobre 734.207 llamadas · +0.80 pp vs el resto de Galicia Individuos (1.97%)» |
        | `compareSummaryItems` (2 días) | «AA 7.12% → 3.90% (−3.22 pp) entre 2026-09-14 y 2026-09-15» |
        | `crossSummaryItems` (campañas) | «Campaña 38 4.89% vs campaña 35 5.94% (−1.05 pp) · Galicia Empresas» |
    *   «El resto del segmento» es el AA combinado (`Σ agentes / Σ llamadas`) de las otras campañas del mismo segmento en el mismo rango. Se obtiene con un hook nuevo, `useSegmentPeers`, que reusa `fetchSummary`. Sin otras campañas en el segmento, no se muestra la comparación.

*   **RF5 [Unwanted behavior — aislamiento]:** Sin cambios en otros endpoints, el esquema, los CSV ni los cálculos existentes. El resumen solo reusa datos ya cargados, más el resumen de las campañas del mismo segmento. Sin librerías nuevas.

*   **RF6 [Testing]:**
    *   **pytest:** el test del catálogo incluye `segment`, más 1 nuevo (mapa conocido y «Sin segmento»).
    *   **vitest:**
        *   `executiveSummary.test.ts`: los 3 builders, la comparación con el segmento y la omisión de líneas sin dato.
        *   `CampaignSelect` agrupado.
        *   `FilterCrossCampaignBar`: B restringido al segmento y reajustado al cambiar A.
        *   `catalog.test`: B del mismo segmento.
        *   `ExecutiveSummary` render.
        *   Tests de `App`: «Resumen» presente y el índice con el enlace nuevo.
    *   Las fixtures suman `segment`.
    *   Regresión completa (`/cerrar-spec`).

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 023 | Comparar cualquier par de campañas | Solo dentro del mismo segmento |
| 038 | RF3 «B = 2ª del catálogo» | B = otra campaña del mismo segmento |
| 039 | RF5 enlaces del índice | Se agrega «Resumen» |

## Datos de entrada

*   Segmentos: Empresas = 35 (AA 5.94%), 38 (4.89%); Individuos = 91 (2.77%), 92 (1.97%), rango 01→15/09.
*   Valores esperados del contexto: 91 → «+0.80 pp vs el resto de Galicia Individuos (1.97%)»; 35 → «+1.05 pp vs el resto de Galicia Empresas (4.89%)».

## Contrato JSON

`GET /api/campaigns`: suma `segment` (aditivo).

## Fuera de Alcance

*   Responsive de tablas y paleta de gráficos (spec siguiente).
*   Editar segmentos desde la UI (se configuran en `config.py`).
*   Ranking de campañas del segmento.

## Criterios de Finalización

*   Docs `spec/041-spec-segments-summary/{spec,plan,task}.md`; `task.md` en `[x]`.
*   Chrome:
    *   Selectores agrupados por segmento; en Comparar campañas, con A = 91, B solo ofrece 92.
    *   Resumen con los valores esperados para la 35 y la 91.
    *   Consola sin errores.
*   `/cerrar-spec 041` en verde: pytest y vitest con los conteos finales, lint 0/0 y `/data` intacto.
*   Commit de cierre en español y push a GitHub.
