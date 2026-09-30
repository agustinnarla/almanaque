import type { BaseComparison } from '../../types/api'

function formatRate(rate: number | null): string {
  if (rate == null) return '—'
  return `${(rate * 100).toFixed(2)}%`
}

function formatDeltaPp(delta: number | null): string {
  if (delta == null) return '—'
  const pp = delta * 100
  const sign = pp > 0 ? '+' : pp < 0 ? '−' : ''
  return `${sign}${Math.abs(pp).toFixed(2)} pp`
}

function formatShare(share: number | null): string {
  if (share == null) return '—'
  return `${(share * 100).toFixed(1)}%`
}

interface BasesCompareTableProps {
  rows: BaseComparison[] | null
}

export function BasesCompareTable({ rows }: BasesCompareTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <p
        data-testid="bases-compare-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay bases comunes con suficiente volumen para comparar.
      </p>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <table
        data-testid="bases-compare-table"
        className="w-full table-fixed text-left text-sm"
      >
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="w-[24%] px-2 py-2 font-semibold">Base</th>
            <th className="w-[16%] px-2 py-2 text-right font-semibold">AA A</th>
            <th className="w-[16%] px-2 py-2 text-right font-semibold">AA B</th>
            <th className="w-[18%] px-2 py-2 text-right font-semibold">Δ</th>
            <th className="w-[13%] px-2 py-2 text-right font-semibold">Share A</th>
            <th className="w-[13%] px-2 py-2 text-right font-semibold">Share B</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.base} data-testid="bases-compare-row">
              <td className="truncate px-2 py-2 font-semibold text-slate-900">
                {row.base}
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-700">
                {formatRate(row.agent_answer_rate_a)}
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-700">
                {formatRate(row.agent_answer_rate_b)}
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-700">
                {formatDeltaPp(row.delta_rate)}
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-500">
                {formatShare(row.share_a)}
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-500">
                {formatShare(row.share_b)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
