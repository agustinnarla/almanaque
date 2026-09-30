import {
  Bar,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReactNode } from 'react'
import type { DailyTrendPoint } from '../../types/api'

export interface DailyChartPoint {
  label: string
  fecha: string
  total: number
  rate: number | null
}

export function mapDailyPoints(points: DailyTrendPoint[]): DailyChartPoint[] {
  return points.map((p) => ({
    label: `${p.fecha.slice(8, 10)}/${p.fecha.slice(5, 7)}`,
    fecha: p.fecha,
    total: p.total_calls,
    rate: p.agent_answer_rate != null ? p.agent_answer_rate * 100 : null,
  }))
}

interface TooltipPayloadItem {
  dataKey?: string | number
  value?: number | string | null
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: number | string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      data-testid="daily-tooltip"
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
    >
      <p className="mb-1 font-semibold text-slate-800">{label}</p>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? index)
        const value =
          item.value == null
            ? '—'
            : key === 'rate'
              ? `${Number(item.value).toFixed(2)}%`
              : Math.round(Number(item.value)).toLocaleString('es-AR')
        return (
          <p key={key} className="text-slate-600">
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
              style={{ background: item.color }}
            />
            {key === 'rate' ? 'Agent Answer' : 'Intentos'}: {value}
          </p>
        )
      })}
    </div>
  )
}

interface DailyTrendChartProps {
  points: DailyTrendPoint[]
  headerAction?: ReactNode
}

export function DailyTrendChart({ points, headerAction }: DailyTrendChartProps) {
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
    <div
      data-testid="daily-chart"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Serie diaria de Agent Answer
          </h2>
          <p className="text-xs text-slate-500">
            Volumen diario (barras) y tasa de contacto % (línea) en el rango seleccionado
          </p>
        </div>
        {headerAction}
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              label={{ value: 'Llamadas', angle: -90, position: 'insideLeft', fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: 'AA %', angle: 90, position: 'insideRight', fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="left"
              dataKey="total"
              name="Intentos"
              fill="#6366f1"
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rate"
              name="Agent Answer"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
