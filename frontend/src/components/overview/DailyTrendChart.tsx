import type { ReactNode } from 'react'
import type { DailyTrendPoint } from '../../types/api'
import { mapDailyPoints } from '../../lib/chartData'
import { SERIES_COLORS } from '../../lib/chartPalette'
import { RateVolumeChart } from '../charts/RateVolumeChart'

interface DailyTrendChartProps {
  points: DailyTrendPoint[]
  headerAction?: ReactNode
}

export function DailyTrendChart({ points, headerAction }: DailyTrendChartProps) {
  const data = mapDailyPoints(points)

  if (data.length === 0) {
    return (
      <p
        data-testid="daily-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay datos diarios para el rango seleccionado.
      </p>
    )
  }

  return (
    <div
      data-testid="daily-chart"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Serie diaria de Agent Answer
          </h2>
          <p className="text-xs text-slate-500">
            Tasa de contacto % (arriba) y llamadas (abajo) por día del rango
          </p>
        </div>
        {headerAction}
      </div>
      <RateVolumeChart
        data={data}
        xKey="label"
        xLabel="Día"
        syncId="daily-trend"
        series={[
          { name: 'Campaña', rateKey: 'rate', totalKey: 'total', color: SERIES_COLORS[0] },
        ]}
      />
    </div>
  )
}
