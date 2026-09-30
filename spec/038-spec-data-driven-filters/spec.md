# Spec 038: Campañas y fechas desde los datos (sin valores fijos en el código)

## Usuario

Analista / supervisor del call center (usuario interno). El dashboard está **atado a septiembre de 2026 y a la campaña 35**:

1.  La campaña se escribe a mano en un campo de texto libre (4 barras de filtros): hay que saber de memoria qué campañas existen (hoy 35, 38, 91, 92) y un typo devuelve una pantalla vacía.
2.  Los valores por defecto están escritos en el código (`modes/defaults.ts`): rango `2026-09-01 → 2026-09-15`, días `01` vs `02`, campañas `35` vs `38`.
3.  «Comparar campañas» usa un **rango fijo no editable** (`CROSS_START_DATE`/`CROSS_END_DATE`).
4.  «Por semana» ofrece 3 semanas escritas a mano (`lib/weeks.ts: WEEK_OPTIONS`) con días de datos contados a mano.

Cuando lleguen datos de octubre, la app no los ofrece sin tocar código. Es el ítem 037 del plan de mejora (Fase 1).

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — catálogo de campañas (backend)]:** Nuevo `GET /api/campaigns` → lista de campañas presentes en `daily_campaign_metrics`:
    ```json
    [{ "campaign": "35", "first_day": "2026-09-01", "last_day": "2026-09-15",
       "days": 11, "total_calls": 35413, "dates": ["2026-09-01", "…", "2026-09-15"] }]
    ```
    *   Repo: `campaigns_repo.list_campaigns(conn)`, un `GROUP BY campaign, fecha`. `dates` ascendente y sin repetidos; `days = len(dates)`.
    *   Orden: campañas numéricas por valor (`35 < 38 < 91 < 100`), luego las no numéricas alfabéticamente.
    *   Se excluye la fecha centinela `1970-01-01` (FECHA inválida en la ingesta) para que no contamine los rangos.
    *   DB vacía → `[]`, HTTP 200.

*   **RF2 [Ubiquitous — selector de campaña]:** Nuevo `components/Filters/CampaignSelect.tsx` (`<label>` + `<select>`, opción `«35 · 11 días»` con `value="35"`), usado en las 4 barras en lugar del `<input type="text">`: `FilterRangeBar` y `FilterWeekBar` («Campaña»), `FilterBar` («Campaña»), `FilterCrossCampaignBar` («Campaña A», «Campaña B»). Etiquetas y `data-testid` actuales se conservan.

*   **RF3 [State-driven — valores por defecto derivados]:** Nuevo `lib/catalog.ts` (funciones puras) calcula los estados iniciales a partir del catálogo:
    | Modo | Campaña(s) | Fechas |
    |---|---|---|
    | Campaña completa | 1ª del catálogo | `first_day → last_day` de esa campaña |
    | Comparar 2 días | 1ª del catálogo | **Día A = anteúltimo, Día B = último día con datos** (con un solo día, A = B) |
    | Comparar campañas | A = 1ª, B = 2ª (si hay una sola, B = A) | min `first_day` → max `last_day` del catálogo |
    | Por semana | 1ª del catálogo | semana por defecto de RF5 |
    *   Con los datos actuales: 35 · 01→15/09; **35 · 14/09 vs 15/09** (antes 01 vs 02); 35 vs 38 · 01→15/09; S37.
    *   Se eliminan de `modes/defaults.ts` `DEFAULT_FILTERS`, `DEFAULT_RANGE`, `DEFAULT_CROSS`, `DEFAULT_WEEK_RANGE`, `CROSS_START_DATE`, `CROSS_END_DATE` (quedan `DEFAULT_MIN_CALLS`, `RANKING_LIMIT`).
    *   Los `<input type="date">` reciben `min`/`max` = rango con datos de la campaña elegida (en «Comparar campañas», el del catálogo).

*   **RF4 [Ubiquitous — rango editable en «Comparar campañas»]:** `FilterCrossCampaignBar` reemplaza el texto «Rango fijo: …» por inputs **Desde** / **Hasta**; `CrossCampaignValues` suma `from`/`to` y `CampaignsCompareMode` usa ese rango en los 6 hooks (compare, diagnostics, recommendations, rankings A/B, patrones) en lugar de `CROSS_*`.

*   **RF5 [State-driven — semanas calculadas]:** `lib/weeks.ts` reemplaza `WEEK_OPTIONS`/`DEFAULT_WEEK` por:
    *   `buildWeekOptions(dates)`: una opción por semana ISO (lunes → domingo) que contenga al menos una fecha; `dataDays` = fechas de esa semana; `partial = dataDays < WORKING_DAYS_PER_WEEK` (**5**, constante nueva); `label` = `Semana NN (DD–DD/MM)` o `Semana NN (DD/MM–DD/MM)` si cruza de mes. Orden cronológico.
    *   `defaultWeek(weeks)`: la semana **no parcial más reciente**; si todas son parciales, la más reciente; sin semanas → `null`.
    *   `findWeekByStart(weeks, start)`.
    *   `FilterWeekBar` recibe el catálogo y recalcula las semanas al cambiar de campaña; si la semana elegida no existe en la nueva campaña, vuelve a su `defaultWeek` (en el handler del cambio, no en un effect).
    *   Con los datos actuales: S36 `31/08–06/09` (4 días, parcial), **S37 `07–13/09` (5, completa, default)**, S38 `14–20/09` (2, parcial). Único cambio visible: la etiqueta de S36 pasa de «01–06/09» a «31/08–06/09» (la semana ISO real).

*   **RF6 [Event-driven — carga del catálogo]:** `App.tsx` carga el catálogo con un hook `useCampaigns` (sobre `useApiResource`, Spec 037) y recién entonces monta el modo activo:
    *   Cargando → skeleton (`aria-label="Cargando lista de campañas"`; distinto del «Cargando campañas» que ya usa el modo campañas).
    *   Error → alerta «No se pudo cargar la lista de campañas: … ¿Está corriendo el backend en el puerto 8000?».
    *   Lista vacía → aviso «No hay campañas cargadas. Ejecutá la ingesta de /data para empezar.».
    *   Header y tabs visibles en los tres casos.

*   **RF7 [Unwanted behavior — aislamiento]:** sin cambios en los endpoints existentes, en el esquema de la DB, en los exportadores ni en los textos o secciones de los modos. Los nombres de los CSV siguen el patrón actual; solo cambian las fechas del modo comparar por RF3. Sin librerías nuevas.

*   **RF8 [Testing]:**
    *   **pytest** (`test_api.py`), 3 nuevos: catálogo con campos, orden numérico y `dates`/`days` consistentes; exclusión de `1970-01-01`; DB vacía → `[]`. Total **167**.
    *   **vitest**, 12 nuevos:
        *   `lib/__tests__/weeks.test.ts` (4): las 3 semanas reales (inicio, fin, días, parcial, etiquetas); semana que cruza de mes y de año (S53); `defaultWeek` (completa más reciente / fallback parcial / vacío → `null`); `findWeekByStart`.
        *   `lib/__tests__/catalog.test.ts` (4): defaults de los 4 modos con el catálogo real; una sola campaña (B = A); un solo día (A = B); rango global del catálogo.
        *   `FilterRangeBar.test.tsx` (+1): opciones del catálogo, `min`/`max` y cambio de campaña.
        *   `FilterWeekBar.test.tsx` (+1): al cambiar a una campaña con otras fechas, recalcula las semanas y vuelve a su semana por defecto.
        *   `ModeTabs.test.tsx` (+2): error del catálogo y catálogo vacío.
    *   Fixture compartida `src/test/catalog.ts` (campañas 35 y 38 con las 11 fechas reales).
    *   **Tests existentes que se ajustan** (cambio de comportamiento, no de cobertura):
        *   `FilterRangeBar`, `FilterWeekBar` y `FilterCrossCampaignBar`: reciben el catálogo por prop.
        *   `FilterCrossCampaignBar`: `selectOptions` en lugar de escribir texto, y Desde/Hasta en lugar de «Rango fijo».
        *   Conteo de `<option>` acotado al select «Semana».
        *   `ModeTabs` / `ExportButtons`: mock de `useCampaigns`.
        *   `comparar_35_2026-09-01_2026-09-02_diagnosticos.csv` pasa a `comparar_35_2026-09-14_2026-09-15_diagnosticos.csv`.
    *   Total **216**.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Specs superadas por esta revisión

| Spec | RF / sección superado | Motivo |
|------|------------------------|--------|
| 008 | RF2 defaults de `FilterBar` (35, 01/09, 02/09) y campaña como texto | Campaña por selector; días = los dos últimos con datos |
| 016 | RF1 defaults del modo rango (35, 01→15/09) | Derivados del catálogo |
| 023 | RF2 campañas como texto y **rango fijo** no editable | Selectores + Desde/Hasta editables |
| 033 | RF1 `WEEK_OPTIONS`/`DEFAULT_WEEK` fijos; RF2 campaña como texto; RF3 estado inicial | Semanas calculadas desde las fechas de la campaña |

## Datos de entrada

*   DB actual: campañas `35, 38, 91, 92`, cada una con las mismas 11 fechas hábiles `2026-09-01 … 2026-09-15` (sin 05, 06, 12, 13); llamadas 35413 / 263198 / 734207 / 1000709.
*   Semanas ISO: S36 = 2026-08-31 → 09-06 (01–04 → 4 días), S37 = 09-07 → 09-13 (07–11 → 5), S38 = 09-14 → 09-20 (14–15 → 2).

## Contrato JSON

*   Nuevo `GET /api/campaigns` (RF1). Resto sin cambios.

## Fuera de Alcance

*   Selector de «Mín. llamadas» en el modo rango, jerarquía visual y unificación de formateadores (spec de jerarquía visual).
*   Validar que Campaña A ≠ Campaña B o que Desde ≤ Hasta más allá de `min`/`max` del navegador.
*   Persistir filtros en la URL o en localStorage.
*   `/data`, esquema DB, dependencias.

## Criterios de Finalización

*   Docs `spec/038-spec-data-driven-filters/{spec,plan,task}.md`; `task.md` en `[x]`.
*   `GET /api/campaigns` real → 4 campañas `35, 38, 91, 92`, 11 días cada una, `first_day 2026-09-01`, `last_day 2026-09-15`.
*   Sin fechas ni campañas fijas en `frontend/src/modes/` ni en `lib/weeks.ts` (`grep "2026-"` sobre `frontend/src` excluyendo `__tests__/` y la fixture `src/test/` → vacío).
*   Revisión visual en Chrome de los 4 modos:
    *   Selectores con las 4 campañas.
    *   Comparar 2 días abre en 14/09 vs 15/09.
    *   Comparar campañas con Desde/Hasta editables: un rango 07→11/09 se refleja en la cabecera.
    *   Por semana con S37 por defecto y S36 «31/08–06/09 · parcial».
    *   Elegir la campaña 91 en Campaña completa carga sus datos.
*   `pytest -q` = **167**; `npm test` = **216**; `tsc`, `lint` (≤ 7 warnings, 0 errores) y `build` en verde; `/data` intacto; sin dependencias nuevas.
*   Commit de cierre en español.
