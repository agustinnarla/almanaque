# Task 37: Hook genérico de carga y separación de modos de App.tsx

## 1. Docs
- [x] Escribir `spec.md`, `plan.md`, `task.md`.

## 2. Hook genérico
- [x] `hooks/useApiResource.ts` con `loading` derivado (sin `setState` sincrónico en el effect).
- [x] `hooks/__tests__/useApiResource.test.ts` (7 casos).

## 3. Hooks existentes
- [x] Los 11 hooks delegan en `useApiResource` con la misma API pública y los mismos mensajes.
- [x] `useCampaignOverview` con `keepDataOnError: true`.

## 4. Separación de App.tsx
- [x] `mapRangeDiagnostics` → `lib/rangeDiagnostics.ts` + 2 tests.
- [x] `modes/defaults.ts`, `modes/RangeMode.tsx`, `modes/CompareMode.tsx`, `modes/CampaignsCompareMode.tsx`.
- [x] `App.tsx` ≤ 150 líneas (ViewMode + ModeTabs + App).

## 5. Verificación y cierre
- [x] `/cerrar-spec 037`: pytest 164 · npm test 204 · tsc · lint 7 warnings / 0 errores · build · baseline OK.
- [x] Aserciones de los 195 tests existentes sin cambios (`git diff` sobre `__tests__`).
- [x] Smoke API campaña 35 + revisión visual de los 4 tabs en `npm run dev`.
- [x] Commit de cierre en español.
- [x] Marcar items `[x]`.
