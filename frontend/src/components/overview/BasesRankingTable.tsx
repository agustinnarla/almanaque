import type { BaseRankingRow } from '../../types/api'
import { formatRatePct } from './OverviewKpis'

interface BasesRankingTableProps {
  rows: BaseRankingRow[] | null
}

export function BasesRankingTable({ rows }: BasesRankingTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <p
        data-testid="bases-ranking-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay bases con datos en el rango seleccionado.
      </p>
    )
  }

  return (
    <div
      data-testid="bases-ranking-table"
      className="overflow-x-auto rounded-lg"
    >
      <table className="w-full min-w-[480px] table-fixed text-left text-sm">
        <caption className="sr-only">Ranking de bases por Agent Answer</caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="w-[12%] px-3 py-2.5 font-semibold">#</th>
            <th className="w-[38%] px-3 py-2.5 font-semibold">Base</th>
            <th className="w-[27%] px-3 py-2.5 text-right font-semibold">
              Intentos
            </th>
            <th className="w-[23%] px-3 py-2.5 text-right font-semibold">
              AA %
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr
              key={row.base}
              data-testid="bases-ranking-row"
              className={`transition-colors hover:bg-slate-50 ${index === 0 ? 'bg-emerald-50' : ''}`}
            >
              <td
                className={`px-3 py-2.5 font-mono text-xs ${index === 0 ? 'font-bold text-emerald-700' : 'text-slate-500'}`}
              >
                #{index + 1}
              </td>
              <td className="truncate px-3 py-2.5 font-semibold text-slate-900">
                {row.base}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                {row.total_calls.toLocaleString('es-AR')}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                {formatRatePct(row.agent_answer_rate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
