import { useState } from 'react'
import { AlertTriangle, CalendarCheck } from 'lucide-react'
import { buildCoverage, coverageSummary, describeDays } from '../../lib/coverage'
import { formatDayLabel } from '../../lib/dates'
import type { CampaignCatalogEntry } from '../../types/api'

interface CoverageNoticeProps {
  catalog: CampaignCatalogEntry[]
}

// Spec 055: which days each campaign has, before any comparison is read.
export function CoverageNotice({ catalog }: CoverageNoticeProps) {
  const [open, setOpen] = useState(false)
  const coverage = buildCoverage(catalog)
  const summary = coverageSummary(coverage)
  const Icon = coverage.complete ? CalendarCheck : AlertTriangle

  return (
    <div
      data-testid="coverage-notice"
      data-complete={coverage.complete || undefined}
      className={`mb-6 rounded-xl text-sm print:hidden ${
        coverage.complete
          ? 'text-slate-500'
          : 'border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900'
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Icon
          className={`h-4 w-4 shrink-0 ${coverage.complete ? 'text-emerald-600' : 'text-amber-600'}`}
          aria-hidden
        />
        <p className="min-w-0 flex-1">{summary}</p>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="coverage-detail"
          onClick={() => setOpen((value) => !value)}
          className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {open ? 'Ocultar detalle' : 'Ver detalle'}
        </button>
      </div>
      {open && (
        <div id="coverage-detail" className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white text-slate-700">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="px-3 py-2 font-semibold">Campaña</th>
                <th className="px-3 py-2 font-semibold">Segmento</th>
                <th className="px-3 py-2 font-semibold">Desde</th>
                <th className="px-3 py-2 font-semibold">Hasta</th>
                <th className="px-3 py-2 text-right font-semibold">Días</th>
                <th className="px-3 py-2 font-semibold">Faltan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coverage.campaigns.map((item) => (
                <tr key={item.campaign} data-testid="coverage-row">
                  <td className="px-3 py-2 font-semibold text-slate-900">{item.campaign}</td>
                  <td className="px-3 py-2">{item.segment}</td>
                  <td className="px-3 py-2 tabular-nums">{formatDayLabel(item.firstDay)}</td>
                  <td className={`px-3 py-2 tabular-nums ${item.behind ? 'font-semibold text-amber-700' : ''}`}>
                    {formatDayLabel(item.lastDay)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{item.days}</td>
                  <td className="px-3 py-2">{item.missing.length > 0 ? describeDays(item.missing) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
            Se cuentan los días hábiles (lunes a viernes) hasta el último día con datos de cualquier
            campaña. Un día hábil sin datos puede ser feriado.
          </p>
        </div>
      )}
    </div>
  )
}
