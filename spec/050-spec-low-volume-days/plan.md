# Plan de implementación — Spec 050

## Contexto
- `frontend/src/lib/rangeDiagnostics.ts:151` `buildBestDay`: solo filtra por `BEST_DAY_MIN_CALLS = 50` (`lib/rangeThresholds.ts:6`).
- `frontend/src/lib/chartData.ts:10` `mapDailyPoints`: label, total y rate por día.
- `frontend/src/components/charts/RateVolumeChart.tsx`: puntos y barras uniformes.
- `frontend/src/components/overview/DailyTrendChart.tsx`: tabla = `dailyRows(points)`.

## Pasos
1. **Rama** `feat/050-low-volume-days` + docs.
2. **Lib** `lib/lowVolume.ts` + constantes en `rangeThresholds.ts`; `mapDailyPoints` suma `lowVolume` y `volumeShare`.
3. **Diagnóstico** `buildBestDay` excluye los días de poco volumen.
4. **Gráfico** `RateVolumeChart` con `lowVolumeKey` (barras con `Cell`, punto hueco y línea del tooltip); `DailyTrendChart` con nota y columna en la tabla.
5. **Tests** lib, diagnóstico, gráfico y serie diaria.
6. **Verificación** `/cerrar-spec 050` → PR → CI → squash merge.
