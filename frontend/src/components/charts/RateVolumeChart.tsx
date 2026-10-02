import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MAX_BAR_SIZE, useChartPalette } from '../../lib/chartPalette'
import { ChartTooltip, type TooltipPayloadItem } from './ChartTooltip'

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

// Spec 050: low-volume days read as such without relying on color alone.
const LOW_VOLUME_BAR_OPACITY = 0.35

interface DotProps {
  cx?: number | null
  cy?: number | null
  index?: number
  payload?: Record<string, unknown>
}

interface RateVolumeChartProps {
  data: object[]
  xKey: string
  xLabel: string
  series: RateVolumeSeries[]
  syncId: string
  // Boolean field of each datum that marks a low-volume day: dimmed bar,
  // hollow AA dot and a tooltip line built from `lowVolumeShareKey`.
  lowVolumeKey?: string
  lowVolumeShareKey?: string
}

// Rate and volume have different scales, so they get one panel each (never a
// dual axis); both panels share the x axis and hover through `syncId`.
export function RateVolumeChart({
  data,
  xKey,
  xLabel,
  series,
  syncId,
  lowVolumeKey,
  lowVolumeShareKey,
}: RateVolumeChartProps) {
  const palette = useChartPalette()
  const isLow = (datum: unknown) =>
    lowVolumeKey != null && Boolean((datum as Record<string, unknown> | undefined)?.[lowVolumeKey])
  const lowVolumeNote = (payload: TooltipPayloadItem[]) => {
    const datum = payload[0]?.payload
    if (!isLow(datum)) return null
    const share = lowVolumeShareKey ? Number(datum?.[lowVolumeShareKey]) : NaN
    return Number.isFinite(share)
      ? `Poco volumen: ${Math.round(share * 100)}% de la mediana del rango`
      : 'Poco volumen'
  }
  const dotFor = (color: string) =>
    lowVolumeKey == null
      ? { r: 4, fill: color, stroke: palette.surface, strokeWidth: 2 }
      : ({ cx, cy, index, payload }: DotProps) => {
          if (cx == null || cy == null) return <g key={`dot-${index}`} />
          const low = isLow(payload)
          return (
            <circle
              key={`dot-${index}`}
              data-low-volume={low || undefined}
              cx={cx}
              cy={cy}
              r={4}
              fill={low ? palette.surface : color}
              stroke={low ? color : palette.surface}
              strokeWidth={2}
            />
          )
        }
  const axisTick = { fontSize: 11, fill: palette.ink.tick }
  const rateKeys = series.map((item) => item.rateKey)
  const formatValue = (key: string, value: number) =>
    rateKeys.includes(key) ? `${value.toFixed(2)}%` : formatCalls(value)
  const tooltip = (
    <ChartTooltip
      labelPrefix={xLabel === 'Hora' ? 'Hora' : undefined}
      formatValue={formatValue}
      footer={lowVolumeKey ? lowVolumeNote : undefined}
    />
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
                dot={dotFor(item.color)}
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
              >
                {lowVolumeKey != null &&
                  data.map((datum, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fillOpacity={isLow(datum) ? LOW_VOLUME_BAR_OPACITY : 1}
                    />
                  ))}
              </Bar>
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
