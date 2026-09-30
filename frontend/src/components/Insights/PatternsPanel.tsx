import { AlertTriangle } from 'lucide-react'
import type { PatternAlert } from '../../types/api'
import { summarizePatterns } from '../../lib/patterns'
import { formatDayLabel } from '../../lib/dates'
import { formatRatePct } from '../../lib/format'

interface PatternsPanelProps {
  alerts: PatternAlert[] | null
  campaign: string
}

export function PatternsPanel({ alerts, campaign }: PatternsPanelProps) {
  if (alerts == null) return null

  const summary = summarizePatterns(alerts, campaign)

  if (summary.byDay.length === 0) {
    return (
      <p
        data-testid="patterns-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        Sin alertas de patrones para la campaña en este rango: ninguna
        combinación cayó bajo el umbral de Agent Answer.
      </p>
    )
  }

  const total = summary.byDay.reduce((sum, day) => sum + day.alerts, 0)
  const maxAlerts = Math.max(...summary.byDay.map((day) => day.alerts))

  return (
    <div className="grid gap-6 lg:grid-cols-12" data-testid="patterns-panel">
      <div className="lg:col-span-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">Alertas por día</h3>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
            {total} alertas
          </span>
        </div>
        <ul className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          {summary.byDay.map((day) => {
            const width = maxAlerts > 0 ? (day.alerts / maxAlerts) * 100 : 0
            return (
              <li
                key={day.fecha}
                data-testid="pattern-day-row"
                title={day.fecha}
                className="flex items-center gap-2 rounded px-1 py-1 transition-colors hover:bg-slate-50"
              >
                <span className="w-14 shrink-0 text-xs font-medium text-slate-600">
                  {formatDayLabel(day.fecha)}
                </span>
                <span className="h-4 flex-1 overflow-hidden rounded bg-slate-100">
                  <span
                    className="block h-4 rounded bg-amber-400"
                    style={{ width: `${width}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right font-mono text-xs text-slate-700">
                  {day.alerts}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="lg:col-span-7">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
          Combinaciones más problemáticas
        </h3>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">
              Combinaciones de base y dispositivo con más alertas
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="w-[20%] px-2 py-2 font-semibold">Base</th>
                <th className="w-[22%] px-2 py-2 font-semibold">Dispositivo</th>
                <th className="w-[14%] px-2 py-2 text-right font-semibold">
                  Alertas
                </th>
                <th className="w-[24%] px-2 py-2 text-right font-semibold">
                  Share %
                </th>
                <th className="w-[20%] px-2 py-2 text-right font-semibold">
                  Peor AA %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.topCombos.map((combo, index) => {
                const share = total > 0 ? (combo.alerts / total) * 100 : 0
                return (
                  <tr
                    key={`${combo.base}-${combo.device}`}
                    data-testid="pattern-combo-row"
                    className={`transition-colors hover:bg-slate-50 ${index === 0 ? 'bg-amber-50' : ''}`}
                  >
                    <td className="truncate px-2 py-2 font-semibold text-slate-900">
                      {combo.base}
                    </td>
                    <td className="truncate px-2 py-2 text-slate-700">
                      {combo.device}
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-700">
                      {combo.alerts}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span className="block font-mono text-xs text-slate-700">
                        {share.toFixed(1)}%
                      </span>
                      <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-1.5 rounded-full bg-indigo-400"
                          style={{ width: `${share}%` }}
                        />
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right font-mono text-slate-700">
                      {formatRatePct(combo.worstRate)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
