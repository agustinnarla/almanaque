import type { ReactNode } from 'react'
import type { HourlyTrendPoint } from '../../types/api'
import { SERIES_COLORS } from '../../lib/chartPalette'
import { RateVolumeChart } from '../charts/RateVolumeChart'

interface HourlyAggregateChartProps {
  points: HourlyTrendPoint[]
  headerAction?: ReactNode
}

export function HourlyAggregateChart({ points, headerAction }: HourlyAggregateChartProps) {
  if (points.length === 0) {
    return (
      <p
        data-testid="hourly-agg-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay datos horarios para el rango seleccionado.
      </p>
    )
  }

  const data = points.map((p) => ({
    hora: p.hora,
    total: p.total_calls,
    rate: p.agent_answer_rate != null ? p.agent_answer_rate * 100 : null,
  }))

  return (
    <div
      data-testid="hourly-agg-chart"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Tendencia horaria del rango
          </h2>
          <p className="text-xs text-slate-500">
            Tasa de contacto % (arriba) y llamadas (abajo) agregadas por hora
          </p>
        </div>
        {headerAction}
      </div>
      <RateVolumeChart
        data={data}
        xKey="hora"
        xLabel="Hora"
        syncId="hourly-aggregate"
        series={[
          { name: 'Campaña', rateKey: 'rate', totalKey: 'total', color: SERIES_COLORS[0] },
        ]}
      />
    </div>
  )
}
