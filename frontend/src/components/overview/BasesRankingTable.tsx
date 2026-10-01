import type { BaseRankingRow } from '../../types/api'
import { formatNumber, formatRatePct } from '../../lib/format'

interface BasesRankingTableProps {
  rows: BaseRankingRow[] | null
  minCalls?: number
}

export function BasesRankingTable({ rows, minCalls }: BasesRankingTableProps) {
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

  const ranked = rows.filter((row) => row.ranked !== false)
  const lowVolume = rows.filter((row) => row.ranked === false)
  const bestRate = Math.max(...ranked.map((row) => row.agent_answer_rate ?? -1))

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
          {ranked.map((row, index) => {
            const best = ranked.length > 1 && row.agent_answer_rate === bestRate
            return (
            <tr
              key={row.base}
              data-testid="bases-ranking-row"
              data-best-rate={best || undefined}
              className={`transition-colors hover:bg-slate-50 ${best ? 'bg-emerald-50' : ''}`}
            >
              <td className="px-3 py-2.5 font-mono text-xs text-slate-500">
                #{index + 1}
              </td>
              <td className="truncate px-3 py-2.5 font-semibold text-slate-900">
                {row.base}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                {formatNumber(row.total_calls)}
              </td>
              <td
                className={`px-3 py-2.5 text-right font-mono ${best ? 'font-bold text-emerald-700' : 'text-slate-700'}`}
                title={best ? 'Mejor AA entre las bases que compiten' : undefined}
              >
                {formatRatePct(row.agent_answer_rate)}
              </td>
            </tr>
            )
          })}
          {lowVolume.length > 0 && (
            <tr data-testid="bases-ranking-divider" className="bg-slate-50">
              <td colSpan={4} className="px-3 py-2 text-xs font-medium text-slate-500">
                Pocos intentos
                {minCalls != null ? ` (menos de ${formatNumber(minCalls)} llamadas)` : ''}
                {' '}· no compiten en el ranking
              </td>
            </tr>
          )}
          {lowVolume.map((row) => (
            <tr
              key={row.base}
              data-testid="bases-ranking-row"
              data-ranked="false"
              className="text-slate-400"
            >
              <td className="px-3 py-2.5 font-mono text-xs">—</td>
              <td className="truncate px-3 py-2.5">{row.base}</td>
              <td className="px-3 py-2.5 text-right font-mono">
                {formatNumber(row.total_calls)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono">
                {formatRatePct(row.agent_answer_rate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
