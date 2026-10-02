# Plan de implementación — Spec 056

## Contexto
- `frontend/src/components/methodology/MethodologyModal.tsx`, función `Data()`: reglas Origen, Nombres, Hojas y repetidos, e Ingesta.
- La regla de cobertura vive en `frontend/src/lib/coverage.ts` (Spec 055).

## Pasos
1. **Rama** `feat/056-methodology-coverage` + docs.
2. **Modal** regla «Cobertura de días» en la pestaña «Datos».
3. **Test** en `MethodologyModal.test.tsx`.
4. **Verificación** `/cerrar-spec 056` → PR → CI → squash merge.
