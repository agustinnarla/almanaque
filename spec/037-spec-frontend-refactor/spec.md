# Spec 037: Hook genérico de carga y separación de modos de `App.tsx`

## Usuario

Analista / desarrollador del dashboard (usuario interno). Cada spec de UI hoy es más cara de lo necesario:

1.  **11 hooks copiados y pegados** (`frontend/src/hooks/use*.ts`): cada uno repite ~40 líneas con el mismo patrón `AbortController` + `tick`/`reload` + `setState({loading: true})` + `then/catch`. Un cambio de comportamiento (p. ej. cómo se maneja un error) hay que replicarlo 11 veces.
2.  Ese patrón genera **11 de los 18 warnings de lint** (`react(set-state-in-effect)`: `setState` sincrónico dentro de un effect).
3.  **`App.tsx` tiene 1.296 líneas** con los 4 modos, sus constantes, `ModeTabs` y `mapRangeDiagnostics` (lógica de negocio) en un mismo archivo; cualquier cambio en un modo obliga a navegar todo el archivo.

Es el ítem «044» del plan de mejora (Fase 3), adelantado porque abarata las specs de UI siguientes. **Refactor puro: el usuario final no debe ver ningún cambio.**

## Requisitos Funcionales (EARS)

*   **RF1 [Ubiquitous — hook genérico]:** Nuevo `frontend/src/hooks/useApiResource.ts` que exporta:
    ```ts
    useApiResource<T>(
      fetcher: (signal: AbortSignal) => Promise<T>,
      deps: readonly unknown[],
      options: { errorMessage: string; keepDataOnError?: boolean },
    ): { data: T | null; loading: boolean; error: string | null; reload: () => void }
    ```
    *   Cada cambio de `deps` o llamada a `reload()` dispara un pedido nuevo y **aborta** el anterior; la respuesta de un pedido abortado se **descarta**.
    *   `loading` se **deriva en el render** (clave del pedido actual ≠ clave del último pedido resuelto), sin `setState` sincrónico en el effect → elimina `set-state-in-effect`.
    *   Mientras carga: `data` = último dato resuelto (se conserva el anterior, igual que hoy); `error` = `null`.
    *   Error: `error` = `err.message` si es `Error`, si no `options.errorMessage`; `data` = `null`, salvo `keepDataOnError: true` que conserva el último dato (comportamiento actual de `useCampaignOverview`).
    *   *Por qué:* un único lugar para la semántica de carga/abort/reload.

*   **RF2 [State-driven — hooks existentes como envoltorios]:** Los 11 hooks conservan **nombre, archivo, firma de parámetros y forma exacta del objeto devuelto**, delegando en `useApiResource`:

    | Hook | Devuelve | `errorMessage` | `keepDataOnError` |
    |---|---|---|---|
    | `useCampaignOverview` | `summary, daily, hourly, devices` (arrays `[]` si no hay dato) | «No se pudo cargar la campaña» | **true** |
    | `useRangeDiagnostics` | `data` | «No se pudo cargar el diagnóstico» | false |
    | `useRangeRecommendations` | `data` | «No se pudieron cargar las recomendaciones» | false |
    | `useRangeRankings` | `bases, devices, hours` (`null` si no hay dato) | «No se pudieron cargar los rankings» | false |
    | `usePatternAlerts` | `alerts` | «No se pudieron cargar las alertas de patrones» | false |
    | `useCompareDiagnostics` | `data` | «No se pudo cargar el diagnóstico» | false |
    | `useRecommendations` | `data` | «No se pudieron cargar las recomendaciones» | false |
    | `useHourlyTrend` | `pointsA, pointsB` (`[]` si no hay dato) | «No se pudo cargar la tendencia horaria» | false |
    | `useCrossCampaignCompare` | `data` | «No se pudo cargar la comparación de campañas» | false |
    | `useCrossCampaignDiagnostics` | `data` | «No se pudo cargar el diagnóstico entre campañas» | false |
    | `useCrossCampaignRecommendations` | `data` | «No se pudieron cargar las recomendaciones entre campañas» | false |

    Todos agregan `loading`, `error`, `reload`. Los mensajes son los actuales, sin cambios.
    *   *Por qué:* los tests de `App` (`ModeTabs.test.tsx`, `ExportButtons.test.tsx`) mockean cada hook por ruta de módulo; conservar la API pública los deja intactos.

*   **RF3 [Ubiquitous — separación de modos]:** `App.tsx` se divide sin cambiar JSX, textos, `data-testid`, clases ni orden de secciones:
    *   `src/modes/defaults.ts`: `DEFAULT_MIN_CALLS`, `RANKING_LIMIT`, `CROSS_START_DATE`, `CROSS_END_DATE`, `DEFAULT_FILTERS`, `DEFAULT_RANGE`, `DEFAULT_CROSS`, `DEFAULT_WEEK_RANGE` (hoy `App.tsx:92-121`).
    *   `src/modes/RangeMode.tsx` (con `variant: 'range' | 'week'`, hoy `App.tsx:233-626`).
    *   `src/modes/CompareMode.tsx` (hoy `App.tsx:628-824`).
    *   `src/modes/CampaignsCompareMode.tsx` (hoy `App.tsx:826-1265`).
    *   `App.tsx` conserva solo `ViewMode`, `ModeTabs` y `App` (header + tabs + render del modo) → **≤ 150 líneas**.

*   **RF4 [Ubiquitous — lógica de negocio fuera de la UI]:** `mapRangeDiagnostics` (hoy `App.tsx:189-231`) se mueve **sin cambios de lógica** a `src/lib/rangeDiagnostics.ts` como export, junto a los builders que usa.

*   **RF5 [Event-driven — único cambio observable permitido]:** En el primer render de cada modo, `loading` ya es `true` (antes era `false` un instante hasta que corría el effect). Efecto: desaparece el parpadeo del mensaje vacío «Elegí un rango y presioná «Analizar»…» antes del skeleton. Ningún otro cambio visible.

*   **RF6 [Unwanted behavior — aislamiento]:** **Cero** cambios en backend, API, `types/api.ts`, `api/*.ts`, componentes de `components/`, exportadores CSV, textos de UI o estilos. Las **aserciones** de los 195 tests existentes **no se modifican** (solo se permiten ajustes de imports si un test importara algo movido; hoy ninguno lo hace). `pytest` = **164**; sin librerías nuevas.

*   **RF7 [Unwanted behavior — lint]:** `react(set-state-in-effect)` pasa de **11 → 0** warnings; total de lint **18 → 7** (quedan los 7 `only-export-components`, que se resuelven al unificar formateadores en la spec de jerarquía visual). 0 errores.

*   **RF8 [Testing]:**
    *   Nuevo `src/hooks/__tests__/useApiResource.test.ts` (`renderHook`), 7 casos:
        1. `loading` es `true` desde el primer render y pasa a `false` con `data` al resolver.
        2. Error `Error('x')` → `error = 'x'`, `data = null`.
        3. Error no-`Error` → `error = options.errorMessage`.
        4. `keepDataOnError: true` conserva el dato previo ante un error posterior.
        5. `reload()` vuelve a pedir y pasa por `loading = true` conservando el dato anterior.
        6. Cambio de `deps` aborta el pedido previo (`signal.aborted`) y descarta su respuesta tardía.
        7. `error` vuelve a `null` mientras se recarga tras un error.
    *   `src/lib/__tests__/rangeDiagnostics.test.ts`: 2 casos de `mapRangeDiagnostics` (negativas = backend + peor hora/dispositivo con tope 5; positivas priorizadas con `BEST_HOUR`/`BEST_DEVICE` garantizados).
    *   Total vitest: **195 + 9 = 204**.
    *   Regresión: `npm test` + `npx tsc -b` + `npm run lint` + `npm run build` + `pytest -q`.

## Specs superadas por esta revisión

Ninguna. Refactor sin cambio de comportamiento. Spec 017 RF5 (hooks propios con abort + reload por sección) **se mantiene**: cada sección sigue con su hook y su manejo de loading/error independiente.

## Datos de entrada

*   11 hooks en `frontend/src/hooks/` (idéntico patrón; `useCampaignOverview` es el único que conserva datos ante error).
*   `App.tsx` (1.296 líneas): constantes `:92-121`, `ModeTabs` `:125-187`, `mapRangeDiagnostics` `:189-231`, `RangeMode` `:233-626`, `CompareMode` `:628-824`, `CampaignsCompareMode` `:826-1265`, `App` `:1267-1293`.
*   Lint actual: 18 warnings (11 `set-state-in-effect`, 7 `only-export-components`), 0 errores.

## Contrato JSON

Sin cambios.

## Fuera de Alcance

*   Warnings `only-export-components` (formateadores exportados desde componentes) → spec de jerarquía visual/formateadores.
*   Cambios de UI, textos, estilos, fechas por defecto o selector de campañas.
*   Librerías de data fetching (React Query, SWR): **no** se agregan.
*   Backend, `/data`, dependencias.

## Criterios de Finalización

*   Docs `spec/037-spec-frontend-refactor/{spec,plan,task}.md`; `task.md` en `[x]`.
*   `App.tsx` ≤ 150 líneas; 3 modos en `src/modes/`; `mapRangeDiagnostics` en `lib/rangeDiagnostics.ts`.
*   Los 11 hooks delegan en `useApiResource` (ninguno contiene `AbortController` propio).
*   `npm test` = **204** (195 existentes con aserciones intactas + 9 nuevos); `tsc -b`, `build` en verde; `lint` = **7 warnings / 0 errores**.
*   `pytest -q` = **164**; `/data` mtimes intactos; `package.json` sin dependencias nuevas.
*   Smoke de API campaña 35 (01→15/09) sin cambios (AA 5.94%, peor hora 16h 4.91%) y verificación visual en `npm run dev` de los 4 tabs (carga, skeleton, datos).
*   Commit de cierre en español.
