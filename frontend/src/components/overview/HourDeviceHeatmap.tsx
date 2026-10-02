import { useState, type ReactNode } from 'react'
import type { HourDeviceRow } from '../../types/api'
import { useChartPalette } from '../../lib/chartPalette'
import { heatmapRows } from '../../lib/exporters'
import { formatRatePct } from '../../lib/format'
import { buildHeatmap, cellKey, heatBin, type HeatCell, type HeatMetric } from '../../lib/heatmap'
import { HEATMAP_MIN_CELL_CALLS, HIGHLIGHT_MIN_SHARE } from '../../lib/rangeThresholds'
import { ChartCard } from '../charts/ChartCard'

const METRICS: { id: HeatMetric; label: string }[] = [
  { id: 'aa', label: 'AA' },
  { id: 'attendable', label: 'AA sobre atendibles' },
]

const metricName = (metric: HeatMetric) => (metric === 'aa' ? 'AA' : 'AA sobre atendibles')

function describe(cell: HeatCell, metric: HeatMetric): string {
  const base = `${cell.device} · ${cell.hora} h: `
  const detail = `${cell.agents.toLocaleString('es-AR')} agentes de ${cell.total.toLocaleString('es-AR')} llamadas`
  if (cell.small) return `${base}pocas llamadas para calcular una tasa (${detail})`
  return `${base}${metricName(metric)} ${formatRatePct(cell.value)} (${detail})`
}

interface HourDeviceHeatmapProps {
  rows: HourDeviceRow[]
  headerAction?: ReactNode
}

// Spec 058: how each trunk performs at each hour (one-hue sequential scale).
export function HourDeviceHeatmap({ rows, headerAction }: HourDeviceHeatmapProps) {
  const palette = useChartPalette()
  const [metric, setMetric] = useState<HeatMetric>('aa')
  const [active, setActive] = useState<HeatCell | null>(null)
  const heatmap = buildHeatmap(rows, metric)

  if (heatmap.devices.length === 0) {
    return (
      <p
        data-testid="heatmap-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay datos por hora y troncal para el rango seleccionado.
      </p>
    )
  }

  const { domain } = heatmap
  const toggle = (
    <div
      role="group"
      aria-label="Métrica del mapa"
      className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 print:hidden"
    >
      {METRICS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={metric === option.id}
          onClick={() => setMetric(option.id)}
          className={`rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
            metric === option.id ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  return (
    <ChartCard
      testId="hour-device-heatmap"
      title="Mapa de calor: troncal × hora"
      subtitle={`${metricName(metric)} de cada troncal a cada hora · más oscuro, más alto`}
      table={heatmapRows(rows)}
      headerAction={
        <>
          {toggle}
          {headerAction}
        </>
      }
    >
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-xs" onMouseLeave={() => setActive(null)}>
          <caption className="sr-only">{`${metricName(metric)} por troncal y hora`}</caption>
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                Troncal
              </th>
              {heatmap.hours.map((hora) => (
                <th key={hora} scope="col" className="px-1 pb-1 text-center font-medium tabular-nums text-slate-500">
                  {hora} h
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmap.devices.map(({ device }) => (
              <tr key={device}>
                <th scope="row" className="whitespace-nowrap pr-2 text-left font-semibold text-slate-700">
                  {device}
                </th>
                {heatmap.hours.map((hora) => {
                  const cell = heatmap.cells.get(cellKey(device, hora))
                  if (!cell) return <td key={hora} className="h-8 min-w-10" aria-hidden />
                  const bin =
                    !cell.small && cell.value != null && domain != null ? heatBin(cell.value, domain) : null
                  const label = describe(cell, metric)
                  return (
                    <td
                      key={hora}
                      data-testid="heatmap-cell"
                      data-bin={bin ?? undefined}
                      tabIndex={0}
                      aria-label={label}
                      title={label}
                      onMouseEnter={() => setActive(cell)}
                      onFocus={() => setActive(cell)}
                      onBlur={() => setActive(null)}
                      className={`h-8 min-w-10 rounded text-center align-middle focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                        bin == null ? 'border border-dashed border-slate-300 text-slate-400' : ''
                      }`}
                      style={bin == null ? undefined : { background: palette.sequential[bin] }}
                    >
                      {bin == null ? '·' : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p data-testid="heatmap-readout" aria-live="polite" className="mt-2 min-h-5 text-xs text-slate-700">
        {active ? describe(active, metric) : 'Pasá el mouse o el foco por una celda para ver el detalle.'}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {domain && (
          <span className="flex items-center gap-1.5" data-testid="heatmap-legend">
            <span className="tabular-nums">{formatRatePct(domain[0])}</span>
            <span className="flex" aria-hidden>
              {palette.sequential.map((color) => (
                <span key={color} className="inline-block h-2.5 w-5" style={{ background: color }} />
              ))}
            </span>
            <span className="tabular-nums">{formatRatePct(domain[1])}</span>
          </span>
        )}
        <span>
          <span className="mr-1 inline-block rounded border border-dashed border-slate-300 px-1 text-slate-400">·</span>
          menos de {HEATMAP_MIN_CELL_CALLS} llamadas
        </span>
        {heatmap.hiddenDevices > 0 && (
          <span data-testid="heatmap-hidden">
            {heatmap.hiddenDevices} {heatmap.hiddenDevices === 1 ? 'troncal' : 'troncales'} con menos del{' '}
            {HIGHLIGHT_MIN_SHARE * 100}% del volumen no se muestran
          </span>
        )}
      </div>
    </ChartCard>
  )
}
