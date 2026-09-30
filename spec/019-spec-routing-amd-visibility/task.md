# Task 19: Exclusión AMD visible en la tarjeta de Ruteo

## 1. Docs
- [x] `spec.md`, `plan.md`, `task.md`.

## 2. Backend — engine
- [x] `_routing_rec` calcula `excluded_amd` (share ≥ 10% ∧ AMD hit) y lo adjunta solo a ROUTING si no-vacío.
- [x] `text` de ROUTING intacto; otras reglas sin la clave.

## 3. Backend — tests
- [x] `test_routing_reports_excluded_amd_with_share`.
- [x] `test_routing_omits_excluded_amd_key_when_none`.
- [x] `test_routing_excluded_amd_ignores_device_below_share`.
- [x] Actualizar 3 asserts de shape (base 5 claves + opcional `excluded_amd` en ROUTING).
- [x] Regresión `pytest -q`.

## 4. Frontend — tipo, badge, tests
- [x] `Recommendation.excluded_amd?: string[]`.
- [x] Badge en `RecommendationCard` (`data-testid="routing-excluded-amd"`) con título y plan de acción.
- [x] Vitest: badge con campo, aserción negativa sin él, regresión del panel.

## 5. Verificación y cierre
- [x] `pytest -q` en verde (143).
- [x] `npm test` + `tsc -b` + `lint` + `build` en verde.
- [x] Smoke: rango GW37 + `["IPLAN"]`; compare GW39 + `["IPLAN2"]`; badge presente en componente.
- [x] `/data` mtime intacto.
- [x] Marcar items `[x]`.

