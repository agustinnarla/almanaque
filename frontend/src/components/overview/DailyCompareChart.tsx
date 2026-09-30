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

export interface DailyComparePoint {
  label: string
  totalA: number
  totalB: number
  rateA: number | null
  rateB: number | null
}

export function mergeDailyPoints(
  pointsA: DailyTrendPoint[],
  pointsB: DailyTrendPoint[],
): DailyComparePoint[] {
  const byFecha = new Map<string, DailyComparePoint>()
  const ensure = (fecha: string): DailyComparePoint => {
    let row = byFecha.get(fecha)
    if (!row) {
      row = {
        label: `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`,
        totalA: 0,
        totalB: 0,
        rateA: null,
        rateB: null,
      }
      byFecha.set(fecha, row)
    }
    return row
  }
  for (const p of pointsA) {
    const row = ensure(p.fecha)
    row.totalA = p.total_calls
    row.rateA = p.agent_answer_rate != null ? p.agent_answer_rate * 100 : null
  }
  for (const p of pointsB) {
    const row = ensure(p.fecha)
    row.totalB = p.total_calls
    row.rateB = p.agent_answer_rate != null ? p.agent_answer_rate * 100 : null
  }
  return [...byFecha.values()]
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

function formatValue(
  dataKey: string | number | undefined,
  value: unknown,
): string {
  if (value == null || value === '') return '—'
  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) return String(value)
  if (dataKey === 'rateA' || dataKey === 'rateB') {
    return `${num.toFixed(2)}%`
  }
  return Math.round(num).toLocaleString('es-AR')
}

const LABELS: Record<string, string> = {
  totalA: 'Volumen A',
  totalB: 'Volumen B',
  rateA: 'Contacto A',
  rateB: 'Contacto B',
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div
      data-testid="daily-compare-tooltip"
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
    >
      <p className="mb-1 font-semibold text-slate-800">{label}</p>
      {payload.map((item, index) => {
        const key = String(item.dataKey ?? index)
        return (
          <p key={key} className="text-slate-600">
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
              style={{ background: item.color }}
            />
            {LABELS[key] ?? key}: {formatValue(item.dataKey, item.value)}
          </p>
        )
      })}
    </div>
  )
}

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
    <div
      data-testid="daily-compare-chart"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-base font-semibold text-slate-900">
            Serie diaria comparada
          </h2>
          <p className="text-xs text-slate-500">
            Volumen (barras) y tasa de contacto % (líneas) — {labelA} atenuado,{' '}
            {labelB} sólido
          </p>
        </div>
        {headerAction}
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              label={{
                value: 'Llamadas',
                angle: -90,
                position: 'insideLeft',
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{
                value: 'Contacto %',
                angle: 90,
                position: 'insideRight',
                fontSize: 11,
              }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="left"
              dataKey="totalA"
              name={`Volumen ${labelA}`}
              fill="#cbd5e1"
              radius={[3, 3, 0, 0]}
            />
            <Bar
              yAxisId="left"
              dataKey="totalB"
              name={`Volumen ${labelB}`}
              fill="#6366f1"
              radius={[3, 3, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rateA"
              name={`Contacto ${labelA}`}
              stroke="#94a3b8"
              strokeDasharray="6 4"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rateB"
              name={`Contacto ${labelB}`}
              stroke="#4f46e5"
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
