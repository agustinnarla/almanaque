# Plan de implementación — Spec 037

## Contexto
- 11 hooks en `frontend/src/hooks/` con el mismo patrón (p. ej. `useCompareDiagnostics.ts:24-42`): `abortRef` + `tick` + `setState({loading:true})` sincrónico en el effect (`:28`, origen del warning) + `then/catch` con chequeo `signal.aborted`.
- Diferencias reales entre hooks: forma del objeto devuelto (`data` / `summary+daily+hourly+devices` / `bases+devices+hours` / `pointsA+pointsB` / `alerts`), mensaje de error por defecto, y `useCampaignOverview.ts:78-85` que conserva datos ante error (el resto los pone en `null`/`[]`).
- Los tests de `App` mockean los hooks por ruta (`ModeTabs.test.tsx:5-266`, `ExportButtons.test.tsx:21-386`); vitest resuelve `vi.mock` por módulo, así que mover los modos a `src/modes/` (que importan `../hooks/...`) sigue usando los mocks.
- `.oxlintrc.json`: solo `rules-of-hooks` (error) y `only-export-components` (warn); `set-state-in-effect` viene del plugin `react` por defecto.
- Ningún test importa `mapRangeDiagnostics`, `ModeTabs` ni constantes de `App.tsx`.

## Pasos
1. **Docs** `spec/037-spec-frontend-refactor/{spec,plan,task}.md`.
2. **`hooks/useApiResource.ts`** (RF1):
   - `const [tick, setTick] = useState(0)`; `key = JSON.stringify([...deps, tick])`.
   - `const [result, setResult] = useState<{ key: string | null; data: T | null; error: string | null }>` inicial `{ key: null, … }`.
   - `useEffect(() => { controller; fetcher(signal).then(→ setResult({key, data, error:null})).catch(→ setResult(prev => ({key, data: keep ? prev.data : null, error}))); return () => controller.abort() }, [key])` — `setState` solo en callbacks asíncronos.
   - `loading = result.key !== key`; `error = loading ? null : result.error`.
3. **Tests del hook** `hooks/__tests__/useApiResource.test.ts` (7 casos de RF8) con `renderHook` / `act` / `waitFor` de `@testing-library/react` y promesas controladas manualmente (sin fetch real).
4. **Reescribir los 11 hooks** como envoltorios (RF2), conservando `export interface …Params` y firmas; los que usan `Promise.all` (overview, rankings, hourly) lo hacen dentro del `fetcher`.
5. **`lib/rangeDiagnostics.ts`**: mover `mapRangeDiagnostics` (RF4) + 2 tests en `lib/__tests__/rangeDiagnostics.test.ts`.
6. **Separar `App.tsx`** (RF3): `modes/defaults.ts`, `modes/RangeMode.tsx`, `modes/CompareMode.tsx`, `modes/CampaignsCompareMode.tsx`; mover bloques tal cual y ajustar imports; `App.tsx` queda con `ViewMode`, `ModeTabs`, `App`.
7. **Verificación**:
   - `/cerrar-spec 037` (pytest 164 · npm test 204 · tsc · lint 7/0 · build · baseline).
   - `git diff --stat` de los tests existentes: solo archivos nuevos, ninguna aserción tocada.
   - `/smoke` campaña 35 y `npm run dev` + backend para mirar los 4 tabs.
   - Commit de cierre.
