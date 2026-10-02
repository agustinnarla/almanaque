import type { ReactNode } from 'react'
import type { HourlyTrendPoint } from '../../types/api'
import { mergeHourlyPoints } from '../../lib/chartData'
import { useChartPalette } from '../../lib/chartPalette'
import { hourlyCompareRows } from '../../lib/exporters'
import { ChartCard } from '../charts/ChartCard'
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
  const palette = useChartPalette()
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
    <ChartCard
      testId="hourly-chart"
      title="Tendencia horaria"
      subtitle={`Tasa de contacto % (arriba) y llamadas (abajo) por hora · ${labelA} vs ${labelB}`}
      table={hourlyCompareRows(pointsA, pointsB)}
      headerAction={headerAction}
    >
      <RateVolumeChart
        data={data}
        xKey="hora"
        xLabel="Hora"
        syncId="hourly-compare"
        series={[
          { name: labelA, rateKey: 'rateA', totalKey: 'totalA', color: palette.series[0] },
          { name: labelB, rateKey: 'rateB', totalKey: 'totalB', color: palette.series[1] },
        ]}
      />
    </ChartCard>
  )
}
