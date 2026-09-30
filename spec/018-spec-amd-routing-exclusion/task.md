# Task 18: Exclusión AMD del ruteo prioritario

## 1. Docs
- [x] `spec.md`, `plan.md`, `task.md`.

## 2. Backend — engine
- [x] `_is_amd_hit(device)` compartido (refactor de `_amd_recs`).
- [x] `_routing_rec` excluye dispositivos AMD del pool de candidatos.

## 3. Backend — tests
- [x] `test_routing_excludes_amd_device_picks_second`.
- [x] `test_routing_absent_when_only_amd_candidate_has_share`.
- [x] `test_routing_excludes_amd_even_without_emitted_amd_rec`.
- [x] Regresión de tests de ROUTING existentes.

## 4. Verificación y cierre
- [x] `pytest -q` en verde.
- [x] Smoke rango 01→15: ROUTING GW37 (no IPLAN), AMD IPLAN intacto.
- [x] Smoke compare 01→02: ROUTING GW39 sin cambio.
- [x] `/data` mtime intacto.
- [x] Marcar items `[x]`.

