import { AlertTriangle } from 'lucide-react'
import type { PatternAlert } from '../../types/api'
import { comparePatternSummaries } from '../../lib/patterns'
import { formatDayLabel } from '../../lib/dates'
import { formatRatePct } from '../overview/OverviewKpis'

interface PatternsComparePanelProps {
  alerts: PatternAlert[] | null
  campaignA: string
  campaignB: string
}

export function PatternsComparePanel({
  alerts,
  campaignA,
  campaignB,
}: PatternsComparePanelProps) {
  if (alerts == null) return null

  const summary = comparePatternSummaries(alerts, campaignA, campaignB)

  if (summary.byDay.length === 0) {
    return (
      <p
        data-testid="patterns-compare-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        Sin alertas de patrones para ninguna de las dos campañas en este rango:
        ninguna combinación cayó bajo el umbral de Agent Answer.
      </p>
    )
  }

  const totalA = summary.byDay.reduce((sum, day) => sum + day.alertsA, 0)
  const totalB = summary.byDay.reduce((sum, day) => sum + day.alertsB, 0)
  const maxAlerts = Math.max(
    ...summary.byDay.map((day) => Math.max(day.alertsA, day.alertsB)),
  )

  return (
    <div className="grid gap-6 lg:grid-cols-12" data-testid="patterns-compare-panel">
      <div className="lg:col-span-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-800">Alertas por día</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-400" aria-hidden />
              {campaignA}
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" aria-hidden />
              {campaignB}
            </span>
          </div>
        </div>
        <ul className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          {summary.byDay.map((day) => (
            <li
              key={day.fecha}
              data-testid="pattern-compare-day-row"
              title={day.fecha}
              className="flex items-center gap-2 rounded px-1 py-1 transition-colors hover:bg-slate-50"
            >
              <span className="w-14 shrink-0 text-xs font-medium text-slate-600">
                {formatDayLabel(day.fecha)}
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block h-2.5 overflow-hidden rounded bg-slate-100">
                  <span
                    className="block h-2.5 rounded bg-indigo-400"
                    style={{ width: `${maxAlerts > 0 ? (day.alertsA / maxAlerts) * 100 : 0}%` }}
                  />
                </span>
                <span className="block h-2.5 overflow-hidden rounded bg-slate-100">
                  <span
                    className="block h-2.5 rounded bg-amber-400"
                    style={{ width: `${maxAlerts > 0 ? (day.alertsB / maxAlerts) * 100 : 0}%` }}
                  />
                </span>
              </span>
              <span className="flex w-14 shrink-0 flex-col text-right font-mono text-[10px] leading-tight text-slate-700">
                <span>{day.alertsA}</span>
                <span>{day.alertsB}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-800">
            {campaignA}: {totalA} alertas
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
            {campaignB}: {totalB} alertas
          </span>
        </p>
      </div>

      <div className="lg:col-span-7">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
          Combinaciones más problemáticas
        </h3>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">
              Combinaciones de base y dispositivo comparadas entre campañas
            </caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="w-[18%] px-2 py-2 font-semibold">Base</th>
                <th className="w-[30%] px-2 py-2 font-semibold">Dispositivo</th>
                <th className="w-[14%] px-2 py-2 text-right font-semibold">
                  A
                </th>
                <th className="w-[14%] px-2 py-2 text-right font-semibold">
                  B
                </th>
                <th className="w-[24%] px-2 py-2 text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.combos.map((combo, index) => (
                <tr
                  key={`${combo.base}-${combo.device}`}
                  data-testid="pattern-compare-combo-row"
                  className={`transition-colors hover:bg-slate-50 ${index === 0 ? 'bg-amber-50' : ''}`}
                >
                  <td className="truncate px-2 py-2 font-semibold text-slate-900">
                    {combo.base}
                  </td>
                  <td className="truncate px-2 py-2 text-slate-700">
                    {combo.device}
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-slate-700">
                    {combo.alertsA || '—'}
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-slate-700">
                    {combo.alertsB || '—'}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-semibold text-slate-900">
                    {combo.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Peor AA A {formatRatePct(summary.combos[0]?.worstRateA ?? null)} · peor AA B{' '}
          {formatRatePct(summary.combos[0]?.worstRateB ?? null)} en la combinación líder
        </p>
      </div>
    </div>
  )
}
