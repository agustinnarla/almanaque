import type { CrossRankingRow } from '../../types/api'
import type { CrossRankingKind } from '../../lib/rankings'
import { formatNumber, formatRatePct, formatScore } from '../../lib/format'

function healthTone(value: number | null): { className: string; attribute: string } | null {
  if (value == null) return null
  if (value >= 0) return { className: 'text-emerald-600', attribute: 'data-good' }
  if (value >= -10) return { className: 'text-amber-600', attribute: 'data-warn' }
  return { className: 'text-red-600', attribute: 'data-bad' }
}

function formatDelta(delta: number | null): string {
  if (delta == null) return '—'
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  return `${sign}${Math.abs(delta).toFixed(2)} pp`
}

function deltaTone(delta: number | null): { className: string; attribute: string } {
  if (delta == null) return { className: 'text-slate-500', attribute: 'data-delta-neutral' }
  if (delta > 0) return { className: 'text-emerald-600', attribute: 'data-delta-up' }
  if (delta < 0) return { className: 'text-red-600', attribute: 'data-delta-down' }
  return { className: 'text-slate-500', attribute: 'data-delta-neutral' }
}

const KIND_META: Record<
  CrossRankingKind,
  { label: string; caption: string; withHealth: boolean }
> = {
  base: {
    label: 'Base',
    caption: 'Ranking comparado de bases por Agent Answer e intentos',
    withHealth: false,
  },
  device: {
    label: 'Dispositivo',
    caption:
      'Ranking comparado de dispositivos por intentos, Agent Answer y health score',
    withHealth: true,
  },
  hour: {
    label: 'Hora',
    caption:
      'Ranking comparado de horas por intentos, Agent Answer y health score',
    withHealth: true,
  },
}

const BASE_WIDTHS = ['28%', '15%', '13%', '15%', '13%', '16%']
const SEGMENT_WIDTHS = ['16%', '14%', '12%', '10%', '14%', '12%', '10%', '12%']

interface CrossRankingTableProps {
  kind: CrossRankingKind
  rows: CrossRankingRow[] | null
}

export function CrossRankingTable({ kind, rows }: CrossRankingTableProps) {
  if (!rows || rows.length === 0) {
    return (
      <p
        data-testid="cross-ranking-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay segmentos para comparar en el rango seleccionado.
      </p>
    )
  }

  const meta = KIND_META[kind]
  const widths = meta.withHealth ? SEGMENT_WIDTHS : BASE_WIDTHS
  const cellPadding = 'px-3 py-2.5'

  return (
    <div
      data-testid="cross-ranking-table"
      className="overflow-x-auto rounded-lg"
    >
      <table className="w-full min-w-[720px] table-fixed text-left text-sm">
        <caption className="sr-only">{meta.caption}</caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th className={`${cellPadding} font-semibold`} style={{ width: widths[0] }}>
              {meta.label}
            </th>
            <th className={`${cellPadding} text-right font-semibold`} style={{ width: widths[1] }}>
              Intentos A
            </th>
            <th className={`${cellPadding} text-right font-semibold`} style={{ width: widths[2] }}>
              AA A
            </th>
            {meta.withHealth && (
              <th className={`${cellPadding} text-right font-semibold`} style={{ width: widths[3] }}>
                H A
              </th>
            )}
            <th
              className={`${cellPadding} text-right font-semibold`}
              style={{ width: meta.withHealth ? widths[4] : widths[3] }}
            >
              Intentos B
            </th>
            <th
              className={`${cellPadding} text-right font-semibold`}
              style={{ width: meta.withHealth ? widths[5] : widths[4] }}
            >
              AA B
            </th>
            {meta.withHealth && (
              <th className={`${cellPadding} text-right font-semibold`} style={{ width: widths[6] }}>
                H B
              </th>
            )}
            <th
              className={`${cellPadding} text-right font-semibold`}
              style={{ width: meta.withHealth ? widths[7] : widths[5] }}
            >
              Δ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const delta = deltaTone(row.delta)
            const toneA = healthTone(row.healthA)
            const toneB = healthTone(row.healthB)
            return (
              <tr
                key={row.key}
                data-testid="cross-ranking-row"
                className={`transition-colors hover:bg-slate-50 ${index === 0 ? 'bg-emerald-50' : ''}`}
              >
                <td className={`${cellPadding} truncate font-semibold text-slate-900`}>
                  {row.key}
                </td>
                <td className={`${cellPadding} text-right font-mono text-slate-700`}>
                  {formatNumber(row.attemptsA)}
                </td>
                <td className={`${cellPadding} text-right font-mono text-slate-700`}>
                  {formatRatePct(row.rateA)}
                </td>
                {meta.withHealth && (
                  <td
                    {...(toneA ? { [toneA.attribute]: 'true' } : {})}
                    className={`${cellPadding} text-right font-mono font-semibold ${toneA?.className ?? 'text-slate-500'}`}
                  >
                    {formatScore(row.healthA)}
                  </td>
                )}
                <td className={`${cellPadding} text-right font-mono text-slate-700`}>
                  {formatNumber(row.attemptsB)}
                </td>
                <td className={`${cellPadding} text-right font-mono text-slate-700`}>
                  {formatRatePct(row.rateB)}
                </td>
                {meta.withHealth && (
                  <td
                    {...(toneB ? { [toneB.attribute]: 'true' } : {})}
                    className={`${cellPadding} text-right font-mono font-semibold ${toneB?.className ?? 'text-slate-500'}`}
                  >
                    {formatScore(row.healthB)}
                  </td>
                )}
                <td
                  {...{ [delta.attribute]: 'true' }}
                  className={`${cellPadding} text-right font-mono font-semibold ${delta.className}`}
                >
                  {formatDelta(row.delta)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
