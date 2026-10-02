import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TrunkVolumeRow } from '../../types/api'
import { MAX_BAR_SIZE, useChartPalette } from '../../lib/chartPalette'
import { buildTrunkVolume, trunkColor, trunkVolumeTable } from '../../lib/trunkVolume'
import { ChartCard } from '../charts/ChartCard'
import { ChartTooltip, type TooltipPayloadItem } from '../charts/ChartTooltip'

const formatCalls = (value: number) => Math.round(value).toLocaleString('es-AR')

const dayTotal = (payload: TooltipPayloadItem[]) =>
  `Total: ${formatCalls(Number(payload[0].payload?.total ?? 0))}`

interface TrunkVolumeChartProps {
  rows: TrunkVolumeRow[]
  headerAction?: ReactNode
}

export function TrunkVolumeChart({ rows, headerAction }: TrunkVolumeChartProps) {
  const palette = useChartPalette()
  const volume = buildTrunkVolume(rows)
  const { trunks, days } = volume

  if (days.length === 0) {
    return (
      <p
        data-testid="trunk-volume-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay volumen por troncal para el rango seleccionado.
      </p>
    )
  }

  const axisTick = { fontSize: 11, fill: palette.ink.tick }

  return (
    <ChartCard
      testId="trunk-volume-chart"
      title="Volumen diario por troncal"
      subtitle="Llamadas por día, apiladas por troncal · las 5 con más volumen del rango; el resto, en «Otras»"
      table={trunkVolumeTable(volume)}
      headerAction={headerAction}
    >
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="Troncales">
        {trunks.map((trunk, index) => (
          <li key={trunk.name} data-testid="trunk-legend-item" className="flex items-center">
            <span
              className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: trunkColor(trunk, index, palette) }}
              aria-hidden
            />
            {trunk.name} · {(trunk.share * 100).toFixed(0)}%
          </li>
        ))}
      </ul>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={palette.ink.grid} />
            <XAxis
              dataKey="label"
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: palette.ink.baseline }}
            />
            <YAxis
              width={56}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCalls}
              label={{ value: 'Llamadas', angle: -90, position: 'insideLeft', fontSize: 11, fill: palette.ink.tick }}
            />
            <Tooltip
              content={
                <ChartTooltip formatValue={(_key, value) => formatCalls(value)} reverse footer={dayTotal} />
              }
              cursor={{ fill: palette.ink.grid, opacity: 0.4 }}
            />
            {/* A 1px stroke in the surface color on each segment leaves a 2px
                surface gap between stacked neighbours. */}
            {trunks.map((trunk, index) => (
              <Bar
                key={trunk.name}
                dataKey={trunk.name}
                name={trunk.name}
                stackId="trunks"
                fill={trunkColor(trunk, index, palette)}
                stroke={palette.surface}
                strokeWidth={1}
                maxBarSize={MAX_BAR_SIZE}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
