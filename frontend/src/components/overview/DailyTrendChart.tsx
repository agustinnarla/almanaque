import type { ReactNode } from 'react'
import type { DailyTrendPoint } from '../../types/api'
import { mapDailyPoints } from '../../lib/chartData'
import { useChartPalette } from '../../lib/chartPalette'
import { dailyRows } from '../../lib/exporters'
import { lowVolumeDays } from '../../lib/lowVolume'
import { LOW_VOLUME_DAY_SHARE } from '../../lib/rangeThresholds'
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

  const { median } = lowVolumeDays(points)
  const lowLabels = data.filter((day) => day.lowVolume).map((day) => day.label)
  // Table view only: the CSV export keeps its columns.
  const csv = dailyRows(points)
  const table = {
    headers: [...csv.headers, 'Poco volumen'],
    rows: csv.rows.map((row, index) => [...row, data[index].lowVolume ? 'Sí' : '']),
  }

  return (
    <ChartCard
      testId="daily-chart"
      title="Serie diaria de Agent Answer"
      subtitle="Tasa de contacto % (arriba) y llamadas (abajo) por día del rango"
      table={table}
      headerAction={headerAction}
    >
      <RateVolumeChart
        data={data}
        xKey="label"
        xLabel="Día"
        syncId="daily-trend"
        lowVolumeKey="lowVolume"
        lowVolumeShareKey="volumeShare"
        series={[
          { name: 'Campaña', rateKey: 'rate', totalKey: 'total', color: palette.series[0] },
        ]}
      />
      {lowLabels.length > 0 && (
        <p data-testid="low-volume-note" className="mt-3 flex items-start gap-2 text-xs text-slate-600">
          <span
            className="mt-0.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 bg-white"
            style={{ borderColor: palette.series[0] }}
            aria-hidden
          />
          <span>
            Poco volumen (menos del {LOW_VOLUME_DAY_SHARE * 100}% de la mediana del rango,{' '}
            {Math.round(median).toLocaleString('es-AR')} llamadas): {lowLabels.join(', ')}. Su AA
            se lee con cautela.
          </span>
        </p>
      )}
    </ChartCard>
  )
}
