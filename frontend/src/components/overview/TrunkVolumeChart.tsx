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
import { CHART_INK } from '../../lib/chartPalette'
import { buildTrunkVolume, trunkColor } from '../../lib/trunkVolume'

const AXIS_TICK = { fontSize: 11, fill: CHART_INK.tick }

const formatCalls = (value: number) => Math.round(value).toLocaleString('es-AR')

interface TooltipItem {
  dataKey?: string | number
  name?: string | number
  value?: number | string | null
  color?: string
  payload?: { total?: number }
}

interface TrunkTooltipProps {
  active?: boolean
  payload?: TooltipItem[]
  label?: string | number
}

function TrunkTooltip({ active, payload, label }: TrunkTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const total = payload[0].payload?.total ?? 0
  return (
    <div
      data-testid="trunk-tooltip"
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
    >
      <p className="mb-1 font-semibold text-slate-800">{label}</p>
      {[...payload].reverse().map((item) => (
        <p key={String(item.dataKey)} className="text-slate-600">
          <span
            className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
            style={{ background: item.color }}
          />
          {item.name}: {formatCalls(Number(item.value ?? 0))}
        </p>
      ))}
      <p className="mt-1 border-t border-slate-100 pt-1 font-semibold text-slate-700">
        Total: {formatCalls(total)}
      </p>
    </div>
  )
}

interface TrunkVolumeChartProps {
  rows: TrunkVolumeRow[]
  headerAction?: ReactNode
}

export function TrunkVolumeChart({ rows, headerAction }: TrunkVolumeChartProps) {
  const { trunks, days } = buildTrunkVolume(rows)

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

  return (
    <div
      data-testid="trunk-volume-chart"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Volumen diario por troncal
          </h2>
          <p className="text-xs text-slate-500">
            Llamadas por día, apiladas por troncal · las 5 con más volumen del
            rango; el resto, en «Otras»
          </p>
        </div>
        {headerAction}
      </div>
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600" aria-label="Troncales">
        {trunks.map((trunk, index) => (
          <li key={trunk.name} data-testid="trunk-legend-item" className="flex items-center">
            <span
              className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: trunkColor(trunk, index) }}
              aria-hidden
            />
            {trunk.name} · {(trunk.share * 100).toFixed(0)}%
          </li>
        ))}
      </ul>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={days} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART_INK.baseline }}
            />
            <YAxis
              width={56}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCalls}
              label={{ value: 'Llamadas', angle: -90, position: 'insideLeft', fontSize: 11, fill: CHART_INK.tick }}
            />
            <Tooltip content={<TrunkTooltip />} cursor={{ fill: CHART_INK.grid, opacity: 0.4 }} />
            {trunks.map((trunk, index) => (
              <Bar
                key={trunk.name}
                dataKey={trunk.name}
                name={trunk.name}
                stackId="trunks"
                fill={trunkColor(trunk, index)}
                stroke="#ffffff"
                strokeWidth={1}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
