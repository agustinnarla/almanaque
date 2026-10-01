import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_INK } from '../../lib/chartPalette'

export interface RateVolumeSeries {
  name: string
  rateKey: string
  totalKey: string
  color: string
}

interface TooltipPayloadItem {
  dataKey?: string | number
  name?: string | number
  value?: number | string | null
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: number | string
  xLabel?: string
  rateKeys?: string[]
}

function ChartTooltip({ active, payload, label, xLabel, rateKeys = [] }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      data-testid="chart-tooltip"
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
    >
      <p className="mb-1 font-semibold text-slate-800">
        {xLabel ? `${xLabel} ${label}` : label}
      </p>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? index)
        const isRate = rateKeys.includes(key)
        const value =
          item.value == null
            ? '—'
            : isRate
              ? `${Number(item.value).toFixed(2)}%`
              : Math.round(Number(item.value)).toLocaleString('es-AR')
        return (
          <p key={key} className="text-slate-600">
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
              style={{ background: item.color }}
            />
            {item.name}: {value}
          </p>
        )
      })}
    </div>
  )
}

const AXIS_TICK = { fontSize: 11, fill: CHART_INK.tick }
const Y_AXIS_WIDTH = 56
const MARGIN = { top: 8, right: 12, left: 0, bottom: 0 }

interface RateVolumeChartProps {
  data: object[]
  xKey: string
  xLabel: string
  series: RateVolumeSeries[]
  syncId: string
}

// Rate and volume have different scales, so they get one panel each (never a
// dual axis); both panels share the x axis and hover through `syncId`.
export function RateVolumeChart({ data, xKey, xLabel, series, syncId }: RateVolumeChartProps) {
  const rateKeys = series.map((item) => item.rateKey)
  const tooltip = <ChartTooltip xLabel={xLabel === 'Hora' ? 'Hora' : undefined} rateKeys={rateKeys} />
  const multi = series.length > 1

  return (
    <div data-testid="rate-volume-chart" className="w-full">
      <div className="h-52 w-full" data-testid="rate-panel">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={syncId} margin={MARGIN}>
            <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
            <XAxis dataKey={xKey} hide />
            <YAxis
              width={Y_AXIS_WIDTH}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `${value}%`}
              label={{ value: 'AA %', angle: -90, position: 'insideLeft', fontSize: 11, fill: CHART_INK.tick }}
            />
            <Tooltip content={tooltip} />
            {multi && <Legend verticalAlign="top" height={24} wrapperStyle={{ fontSize: 12 }} />}
            {series.map((item) => (
              <Line
                key={item.rateKey}
                type="monotone"
                dataKey={item.rateKey}
                name={multi ? item.name : 'Agent Answer %'}
                stroke={item.color}
                strokeWidth={2}
                dot={{ r: 4, fill: item.color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="h-32 w-full" data-testid="volume-panel">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={syncId} margin={MARGIN} barGap={2}>
            <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
            <XAxis
              dataKey={xKey}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: CHART_INK.baseline }}
            />
            <YAxis
              width={Y_AXIS_WIDTH}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => value.toLocaleString('es-AR')}
              label={{ value: 'Llamadas', angle: -90, position: 'insideLeft', fontSize: 11, fill: CHART_INK.tick }}
            />
            <Tooltip content={tooltip} cursor={{ fill: CHART_INK.grid, opacity: 0.4 }} />
            {series.map((item) => (
              <Bar
                key={item.totalKey}
                dataKey={item.totalKey}
                name={multi ? `Llamadas ${item.name}` : 'Llamadas'}
                fill={item.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
