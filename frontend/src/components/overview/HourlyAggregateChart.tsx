import type { ReactNode } from 'react'
import type { HourlyTrendPoint } from '../../types/api'
import { useChartPalette } from '../../lib/chartPalette'
import { hourlyRows } from '../../lib/exporters'
import { ChartCard } from '../charts/ChartCard'
import { RateVolumeChart } from '../charts/RateVolumeChart'

interface HourlyAggregateChartProps {
  points: HourlyTrendPoint[]
  headerAction?: ReactNode
}

export function HourlyAggregateChart({ points, headerAction }: HourlyAggregateChartProps) {
  const palette = useChartPalette()

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
    <ChartCard
      testId="hourly-agg-chart"
      title="Tendencia horaria del rango"
      subtitle="Tasa de contacto % (arriba) y llamadas (abajo) agregadas por hora"
      table={hourlyRows(points)}
      headerAction={headerAction}
    >
      <RateVolumeChart
        data={data}
        xKey="hora"
        xLabel="Hora"
        syncId="hourly-aggregate"
        series={[
          { name: 'Campaña', rateKey: 'rate', totalKey: 'total', color: palette.series[0] },
        ]}
      />
    </ChartCard>
  )
}
