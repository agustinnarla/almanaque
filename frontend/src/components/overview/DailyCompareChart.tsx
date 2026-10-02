import type { ReactNode } from 'react'
import type { DailyTrendPoint } from '../../types/api'
import { mergeDailyPoints } from '../../lib/chartData'
import { useChartPalette } from '../../lib/chartPalette'
import { dailyCompareRows } from '../../lib/exporters'
import { ChartCard } from '../charts/ChartCard'
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
  const palette = useChartPalette()
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
    <ChartCard
      testId="daily-compare-chart"
      title="Serie diaria comparada"
      subtitle={`Tasa de contacto % (arriba) y llamadas (abajo) por día · ${labelA} vs ${labelB}`}
      table={dailyCompareRows(pointsA, pointsB)}
      headerAction={headerAction}
    >
      <RateVolumeChart
        data={data}
        xKey="label"
        xLabel="Día"
        syncId="daily-compare"
        series={[
          { name: labelA, rateKey: 'rateA', totalKey: 'totalA', color: palette.series[0] },
          { name: labelB, rateKey: 'rateB', totalKey: 'totalB', color: palette.series[1] },
        ]}
      />
    </ChartCard>
  )
}
