import type { ReactNode } from 'react'
import type { DailyTrendPoint } from '../../types/api'
import { mergeDailyByWeekday } from '../../lib/chartData'
import { useChartPalette } from '../../lib/chartPalette'
import { weekdayCompareRows } from '../../lib/exporters'
import { ChartCard } from '../charts/ChartCard'
import { RateVolumeChart } from '../charts/RateVolumeChart'

interface WeekdayCompareChartProps {
  pointsA: DailyTrendPoint[]
  pointsB: DailyTrendPoint[]
  labelA: string
  labelB: string
  headerAction?: ReactNode
}

// Spec 057: two weeks day by day, Monday against Monday.
export function WeekdayCompareChart({ pointsA, pointsB, labelA, labelB, headerAction }: WeekdayCompareChartProps) {
  const palette = useChartPalette()
  const data = mergeDailyByWeekday(pointsA, pointsB)

  if (data.length === 0) {
    return (
      <p
        data-testid="weekday-compare-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay datos diarios para las semanas seleccionadas.
      </p>
    )
  }

  return (
    <ChartCard
      testId="weekday-compare-chart"
      title="Serie por día de la semana"
      subtitle={`Tasa de contacto % (arriba) y llamadas (abajo), lunes con lunes · ${labelA} vs ${labelB}`}
      table={weekdayCompareRows(data)}
      headerAction={headerAction}
    >
      <RateVolumeChart
        data={data}
        xKey="label"
        xLabel="Día"
        syncId="weekday-compare"
        series={[
          { name: labelA, rateKey: 'rateA', totalKey: 'totalA', color: palette.series[0] },
          { name: labelB, rateKey: 'rateB', totalKey: 'totalB', color: palette.series[1] },
        ]}
      />
    </ChartCard>
  )
}
