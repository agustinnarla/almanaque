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
import { MAX_BAR_SIZE, useChartPalette } from '../../lib/chartPalette'
import { ChartTooltip } from './ChartTooltip'

export interface RateVolumeSeries {
  name: string
  rateKey: string
  totalKey: string
  color: string
}

const Y_AXIS_WIDTH = 56
const MARGIN = { top: 8, right: 12, left: 0, bottom: 0 }

const formatCalls = (value: number) => Math.round(value).toLocaleString('es-AR')

// Legend text stays in neutral ink; the swatch beside it carries the identity.
const legendText = (value: string) => (
  <span className="text-xs text-slate-600">{value}</span>
)

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
  const palette = useChartPalette()
  const axisTick = { fontSize: 11, fill: palette.ink.tick }
  const rateKeys = series.map((item) => item.rateKey)
  const formatValue = (key: string, value: number) =>
    rateKeys.includes(key) ? `${value.toFixed(2)}%` : formatCalls(value)
  const tooltip = (
    <ChartTooltip labelPrefix={xLabel === 'Hora' ? 'Hora' : undefined} formatValue={formatValue} />
  )
  const multi = series.length > 1

  return (
    <div data-testid="rate-volume-chart" className="w-full">
      <div className="h-52 w-full" data-testid="rate-panel">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={syncId} margin={MARGIN}>
            <CartesianGrid vertical={false} stroke={palette.ink.grid} />
            <XAxis dataKey={xKey} hide />
            <YAxis
              width={Y_AXIS_WIDTH}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => `${value}%`}
              label={{ value: 'AA %', angle: -90, position: 'insideLeft', fontSize: 11, fill: palette.ink.tick }}
            />
            <Tooltip content={tooltip} cursor={{ stroke: palette.ink.baseline, strokeWidth: 1 }} />
            {multi && (
              <Legend
                verticalAlign="top"
                height={24}
                iconType="plainline"
                formatter={legendText}
              />
            )}
            {series.map((item) => (
              <Line
                key={item.rateKey}
                type="monotone"
                dataKey={item.rateKey}
                name={multi ? item.name : 'Agent Answer %'}
                stroke={item.color}
                strokeWidth={2}
                dot={{ r: 4, fill: item.color, stroke: palette.surface, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: item.color, stroke: palette.surface, strokeWidth: 2 }}
                connectNulls={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="h-32 w-full" data-testid="volume-panel">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} syncId={syncId} margin={MARGIN} barGap={2}>
            <CartesianGrid vertical={false} stroke={palette.ink.grid} />
            <XAxis
              dataKey={xKey}
              tick={axisTick}
              tickLine={false}
              axisLine={{ stroke: palette.ink.baseline }}
            />
            <YAxis
              width={Y_AXIS_WIDTH}
              tick={axisTick}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCalls}
              label={{ value: 'Llamadas', angle: -90, position: 'insideLeft', fontSize: 11, fill: palette.ink.tick }}
            />
            <Tooltip content={tooltip} cursor={{ fill: palette.ink.grid, opacity: 0.4 }} />
            {series.map((item) => (
              <Bar
                key={item.totalKey}
                dataKey={item.totalKey}
                name={multi ? `Llamadas ${item.name}` : 'Llamadas'}
                fill={item.color}
                radius={[4, 4, 0, 0]}
                maxBarSize={MAX_BAR_SIZE}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
