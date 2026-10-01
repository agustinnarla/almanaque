import type { ReactNode } from 'react'
import type { HourlyTrendPoint } from '../../types/api'
import { mergeHourlyPoints } from '../../lib/chartData'
import { SERIES_COLORS } from '../../lib/chartPalette'
import { RateVolumeChart } from '../charts/RateVolumeChart'

interface HourlyTrendChartProps {
  pointsA: HourlyTrendPoint[]
  pointsB: HourlyTrendPoint[]
  labelA?: string
  labelB?: string
  headerAction?: ReactNode
}

export function HourlyTrendChart({
  pointsA,
  pointsB,
  labelA = 'Día A',
  labelB = 'Día B',
  headerAction,
}: HourlyTrendChartProps) {
  const data = mergeHourlyPoints(pointsA, pointsB)

  if (data.length === 0) {
    return (
      <p
        data-testid="hourly-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay datos horarios para las fechas seleccionadas.
      </p>
    )
  }

  return (
    <div
      data-testid="hourly-chart"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Tendencia horaria
          </h2>
          <p className="text-xs text-slate-500">
            Tasa de contacto % (arriba) y llamadas (abajo) por hora · {labelA} vs{' '}
            {labelB}
          </p>
        </div>
        {headerAction}
      </div>
      <RateVolumeChart
        data={data}
        xKey="hora"
        xLabel="Hora"
        syncId="hourly-compare"
        series={[
          { name: labelA, rateKey: 'rateA', totalKey: 'totalA', color: SERIES_COLORS[0] },
          { name: labelB, rateKey: 'rateB', totalKey: 'totalB', color: SERIES_COLORS[1] },
        ]}
      />
    </div>
  )
}
