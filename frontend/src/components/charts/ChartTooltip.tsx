export interface TooltipPayloadItem {
  dataKey?: string | number
  name?: string | number
  value?: number | string | null
  color?: string
  payload?: Record<string, unknown>
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: number | string
  labelPrefix?: string
  formatValue: (key: string, value: number) => string
  reverse?: boolean
  footer?: (payload: TooltipPayloadItem[]) => string | null
}

// Values lead, series names follow; each row is keyed by a short stroke of the
// series color (text never wears the series color).
export function ChartTooltip({
  active,
  payload,
  label,
  labelPrefix,
  formatValue,
  reverse = false,
  footer,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const items = reverse ? [...payload].reverse() : payload
  const footerText = footer?.(payload) ?? null
  return (
    <div
      data-testid="chart-tooltip"
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
    >
      <p className="mb-1 text-slate-500">
        {labelPrefix ? `${labelPrefix} ${label}` : label}
      </p>
      {items.map((item, index) => {
        const key = String(item.dataKey ?? index)
        return (
          <p key={key} className="flex items-center gap-2">
            <span
              className="inline-block h-0.5 w-3 shrink-0 rounded-full"
              style={{ background: item.color }}
              aria-hidden
            />
            <span className="font-semibold tabular-nums text-slate-900">
              {item.value == null ? '—' : formatValue(key, Number(item.value))}
            </span>
            <span className="text-slate-500">{item.name}</span>
          </p>
        )
      })}
      {footerText && (
        <p className="mt-1 border-t border-slate-100 pt-1 text-slate-600">{footerText}</p>
      )}
    </div>
  )
}
