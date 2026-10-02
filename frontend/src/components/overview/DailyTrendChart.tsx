import type { ReactNode } from 'react'
import type { DailyTrendPoint } from '../../types/api'
import { mapDailyPoints } from '../../lib/chartData'
import { useChartPalette } from '../../lib/chartPalette'
import { dailyRows } from '../../lib/exporters'
import { ChartCard } from '../charts/ChartCard'
import { RateVolumeChart } from '../charts/RateVolumeChart'

interface DailyTrendChartProps {
  points: DailyTrendPoint[]
  headerAction?: ReactNode
}

export function DailyTrendChart({ points, headerAction }: DailyTrendChartProps) {
  const palette = useChartPalette()
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
    <ChartCard
      testId="daily-chart"
      title="Serie diaria de Agent Answer"
      subtitle="Tasa de contacto % (arriba) y llamadas (abajo) por día del rango"
      table={dailyRows(points)}
      headerAction={headerAction}
    >
      <RateVolumeChart
        data={data}
        xKey="label"
        xLabel="Día"
        syncId="daily-trend"
        series={[
          { name: 'Campaña', rateKey: 'rate', totalKey: 'total', color: palette.series[0] },
        ]}
      />
    </ChartCard>
  )
}
