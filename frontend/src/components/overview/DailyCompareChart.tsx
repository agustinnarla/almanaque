import type { ReactNode } from 'react'
import type { DailyTrendPoint } from '../../types/api'
import { mergeDailyPoints } from '../../lib/chartData'
import { SERIES_COLORS } from '../../lib/chartPalette'
import { RateVolumeChart } from '../charts/RateVolumeChart'

interface DailyCompareChartProps {
  pointsA: DailyTrendPoint[]
  pointsB: DailyTrendPoint[]
  labelA?: string
  labelB?: string
  headerAction?: ReactNode
}

export function DailyCompareChart({
  pointsA,
  pointsB,
  labelA = 'Campaña A',
  labelB = 'Campaña B',
  headerAction,
}: DailyCompareChartProps) {
  const data = mergeDailyPoints(pointsA, pointsB)

  if (data.length === 0) {
    return (
      <p
        data-testid="daily-compare-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay datos diarios para las campañas seleccionadas.
      </p>
    )
  }

  return (
    <div
      data-testid="daily-compare-chart"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Serie diaria comparada
          </h2>
          <p className="text-xs text-slate-500">
            Tasa de contacto % (arriba) y llamadas (abajo) por día · {labelA} vs{' '}
            {labelB}
          </p>
        </div>
        {headerAction}
      </div>
      <RateVolumeChart
        data={data}
        xKey="label"
        xLabel="Día"
        syncId="daily-compare"
        series={[
          { name: labelA, rateKey: 'rateA', totalKey: 'totalA', color: SERIES_COLORS[0] },
          { name: labelB, rateKey: 'rateB', totalKey: 'totalB', color: SERIES_COLORS[1] },
        ]}
      />
    </div>
  )
}
