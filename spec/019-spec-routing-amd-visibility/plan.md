# Plan 19: Exclusión AMD visible en la tarjeta de Ruteo

## 1. Docs
*   `spec/019-spec-routing-amd-visibility/{spec,plan,task}.md`.

## 2. Backend — `services/recommendations_engine.py`
*   En `_routing_rec`, tras armar `candidates` pre-filtro AMD:
    *   `pre = [rate≠null ∧ share≥0.10]`
    *   `excluded = [d for d in pre if _is_amd_hit(d)]`
    *   `candidates = [d for d in pre if not _is_amd_hit(d)]`
    *   Si `best` y `excluded` no vacío → `item["excluded_amd"] = [str(d["device"]) for d in excluded]` (orden estable: como aparecen en devices, o por share DESC — decidir: **share DESC** para determinismo).
    *   Si `excluded` vacío → no agregar la clave.
*   `text` y firma de `build_recommendations` intactos.

## 3. Backend — tests
*   `test_routing_reports_excluded_amd_with_share`: GWAMD (share alto, ratio AMD) + GWOK (ganador) → ROUTING entity=GWOK y `excluded_amd == ["GWAMD"]`.
*   `test_routing_omits_excluded_amd_key_when_none`: solo devices sanos → `"excluded_amd" not in routing`.
*   `test_routing_excluded_amd_ignores_device_below_share`: AMD con share < 10% → no lista (aunque `_is_amd_hit` sea True).
*   Actualizar shape asserts:
    *   `test_recommendations.py` `test_item_shape`: base 5 claves; si ROUTING con excluded → subset.
    *   `test_api.py:799` y `:888` (contrato compare/range): para cada item, base ⊆ keys ∧ keys ⊆ base ∪ {"excluded_amd"}; ROUTING con excluded_ok.

## 4. Frontend
*   `types/api.ts`: `excluded_amd?: string[]` en `Recommendation`.
*   `RecommendationsPanel.tsx` `RecommendationCard`:
    *   Si `rec.type === 'ROUTING' && rec.excluded_amd?.length` → bloque badge `data-testid="routing-excluded-amd"` con título + una línea por device (o frase unificada con la lista).
    *   Icono `AlertTriangle` de lucide; clases amber sobre `bg-slate-900`.
*   `RecommendationsPanel.test.tsx`:
    *   Con `excluded_amd: ['IPLAN']` → badge presente, contiene «Descartado» e «IPLAN».
    *   Sin campo → `queryByTestId('routing-excluded-amd')` null.
    *   Regresión de los 4 tests existentes.

## 5. Verificación
1.  `.venv/Scripts/python -m pytest -q` → 0 failed.
2.  `cd frontend && npm test && npx tsc -b && npm run lint && npm run build`.
3.  Smoke repo: rango 01→15 → ROUTING GW37 + `excluded_amd=["IPLAN"]`; compare 01→02 → GW39 + `["IPLAN2"]`; sin AMD relevante → sin clave.
4.  `stat` mtime `/data` 11 XLS intacto.
5.  `task.md` items en `[x]`.

## Fuera de alcance
*   Texto ROUTING, config AMD, otras reglas, esquema, `/data`, renombrar tipos.
