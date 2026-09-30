# Task 14: Recomendaciones Estratégicas sobre Acumulado de Campaña

## 1. Docs
- [x] Reescribir `spec.md` (RF1–RF8, specs superadas, contrato, criterios).
- [x] Reescribir `plan.md`.
- [x] Reescribir `task.md` (este archivo).

## 2. Backend — config
- [x] `config.py`: `REC_MIN_VOLUME_SHARE = 0.10`.

## 3. Backend — repo (cambio mínimo)
- [x] `build_compare_recommendations`: devices/hourly con `(date_a, date_b)` en vez de `(date_b, date_b)`.

## 4. Backend — engine
- [x] ROUTING: filtro `share ≥ REC_MIN_VOLUME_SHARE` (denominador = total completo de la campaña, previo a `min_calls`) + texto de período (tasa + share).
- [x] PACING: texto nuevo (`AA%` + `busy%`, saturación como factor principal).
- [x] SCHEDULE: parámetro `total_agents` + texto `"X de Y en total"` + vecinas.
- [x] AMD: conservar `AMD_DIVERGENCE`; texto estilo negocio (automáticos vs. agentes).
- [x] VOLUME_DELTA: texto con absolutos (`bajó de A a B`); regla intacta.

## 5. Backend — tests
- [x] `test_recommendations.py`: share < 10% excluido; 12 devices < 10% → sin ROUTING; textos actualizados.
- [x] `test_api.py`: seed busy agregado ≥ 0.35 (PACING sigue disparando); contrato con textos/tipos nuevos; `len ≤ 5`; día faltante → `[]`.

## 6. Frontend
- [x] `Insights/RecommendationsPanel.tsx`: secciones «Estrategia de campaña» y «Alertas del período» (mapeo type→grupo; sección vacía se omite).
- [x] `RecommendationsPanel.test.tsx`: fixture con ambos grupos + sección omitted + empty-state.

## 7. Verificación y cierre
- [x] `pytest -q` en verde (**130 passed**: 128 previos + 2 share).
- [x] `npm test` (**22**) + `npx tsc -b` + `npm run lint` + `npm run build` en verde.
- [x] Smoke campaña 35 (01 vs 02): **PACING GW20** (AA 3.20% / ocupado 45.30%), **AMD IPLAN2** (130/22), **VOLUME −55.56%** (189→84), **ROUTING GW39** (7.03%, share 28.0%), **SCHEDULE 10h** (51 de 273, vecinas 9h/11h); día faltante → `[]`.
- [x] `/data` mtime intacto (1790080283 / 1790080255).
- [x] Marcar items `[x]`.
