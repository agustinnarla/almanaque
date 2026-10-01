import type { DeviceRangeRow } from '../../types/api'
import { formatNumber, formatRatePct } from '../../lib/format'

interface GatewaysRangeTableProps {
  rows: DeviceRangeRow[] | null
}

export function GatewaysRangeTable({ rows }: GatewaysRangeTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <p
        data-testid="gateways-range-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay gateways para el rango seleccionado.
      </p>
    )
  }

  return (
    <div
      data-testid="gateways-range-table"
      className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <table className="w-full min-w-[560px] table-fixed text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="w-[30%] px-2 py-2 font-semibold">Troncal</th>
            <th className="w-[16%] px-2 py-2 text-right font-semibold">Intentos</th>
            <th className="w-[16%] px-2 py-2 text-right font-semibold">AA %</th>
            <th className="w-[19%] px-2 py-2 text-right font-semibold">Ocupado %</th>
            <th className="w-[19%] px-2 py-2 text-right font-semibold">Congestión %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.device} data-testid="gateways-range-row">
              <td className="truncate px-2 py-2 font-semibold text-slate-900">
                {row.device}
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-700">
                {formatNumber(row.total_calls)}
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-700">
                {formatRatePct(row.agent_answer_rate)}
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-700">
                {formatRatePct(row.busy_rate)}
              </td>
              <td className="px-2 py-2 text-right font-mono text-slate-700">
                {formatRatePct(row.congestion_rate)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
