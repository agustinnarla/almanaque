import type { GatewayComparison } from '../../types/api'
import { formatDeltaPp, formatRatePct } from '../../lib/format'
import { gatewayStatus, type GatewayStatus } from '../../lib/gateways'

const STATUS_STYLES: Record<GatewayStatus, string> = {
  Saturado: 'bg-red-100 text-red-800 border-red-200',
  Aliviado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Normal: 'bg-slate-100 text-slate-700 border-slate-200',
}

interface GatewaysTableProps {
  rows: GatewayComparison[] | null
}

export function GatewaysTable({ rows }: GatewaysTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <p
        data-testid="gateways-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay comparativa de gateways para este rango.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table
        data-testid="gateways-table"
        className="w-full min-w-[480px] table-fixed text-left text-sm"
      >
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className="w-[28%] px-2 py-2 font-semibold">Troncal</th>
            <th className="w-[18%] px-2 py-2 text-right font-semibold">Cong. A</th>
            <th className="w-[18%] px-2 py-2 text-right font-semibold">Cong. B</th>
            <th className="w-[20%] px-2 py-2 text-right font-semibold">Var.</th>
            <th className="w-[16%] px-2 py-2 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => {
            const status = gatewayStatus(row)
            return (
              <tr key={row.device} data-testid="gateways-row">
                <td className="truncate px-2 py-2 font-semibold text-slate-900">
                  {row.device}
                </td>
                <td className="px-2 py-2 text-right font-mono text-slate-700">
                  {formatRatePct(row.congestion_rate_a)}
                </td>
                <td className="px-2 py-2 text-right font-mono text-slate-700">
                  {formatRatePct(row.congestion_rate_b)}
                </td>
                <td className="px-2 py-2 text-right font-mono text-slate-700">
                  {formatDeltaPp(row.delta_congestion)}
                </td>
                <td className="px-2 py-2">
                  <span
                    data-testid="gateway-status"
                    data-status={status}
                    className={`inline-flex rounded-full border px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status]}`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
