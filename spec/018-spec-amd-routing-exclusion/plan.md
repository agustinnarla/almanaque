# Plan 18: Exclusión AMD del ruteo prioritario

## 1. Docs
*   `spec/018-spec-amd-routing-exclusion/{spec,plan,task}.md`.

## 2. Backend — engine (`services/recommendations_engine.py`)
*   Extraer predicado compartido `_is_amd_hit(device) -> bool`:
    *   `machines == 0 and agents == 0` → `False`
    *   `machines >= REC_AMD_RATIO * agents` → `True` (agents=0, machines>0 → infinito → `True`)
*   Reusar `_is_amd_hit` en `_amd_recs` (sin cambio de lógica, solo refactor del `if`).
*   En `_routing_rec`: filtrar candidatos con `not _is_amd_hit(d)` **además** de rate/share actuales.
*   Sin candidatos restantes → `None` (ya manejado por `if not candidates`).
*   Firma de `build_recommendations` intacta; orden/cap/config intactos.

## 3. Backend — tests (`test_recommendations.py`)
*   `test_routing_excludes_amd_device_picks_second`:
    *   GWAMD: mejor AA, `machine ≥ 4×agent`, share ≥ 10%; GWOK: segundo AA, share ≥ 10%, no AMD → ROUTING = GWOK; AMD_DIVERGENCE = GWAMD.
*   `test_routing_absent_when_only_amd_candidate_has_share`:
    *   Único con share ≥ 10% es AMD → sin ROUTING; AMD_DIVERGENCE presente.
*   `test_routing_excludes_amd_even_without_emitted_amd_rec`:
    *   Dos AMD-flagged; el peor ratio recibe la rec (cap=1); el segundo AMD-flagged (no emitido) también queda fuera de ROUTING → ROUTING = candidato sano o ausente.
*   Regresión: `test_routing_picks_best_aa_rate`, `..._below_min_volume_share`, `..._absent_when_no_device_reaches_share` intactos (fixtures no AMD).

## 4. Verificación
1.  `.venv/Scripts/python -m pytest -q` → 0 failed.
2.  Smoke repo rango 01→15: ROUTING GW37 (no IPLAN), AMD IPLAN, PACING GW20, SCHEDULE 11.
3.  Smoke repo compare 01→02: ROUTING GW39, AMD IPLAN2 (sin cambio).
4.  `stat` mtime `/data` intacto.
5.  `task.md` items en `[x]`.

## Fuera de alcance
*   Contrato, UI, config, PACING/SCHEDULE/VOLUME, AMD cap/umbral, esquema, `/data`.
