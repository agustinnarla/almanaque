import type { SegmentRankingItem, SegmentRankingResponse } from '../../types/api'
import { formatNumber, formatRatePct, formatScore } from '../../lib/format'

function healthTone(value: number | null): { className: string; attribute: string } | null {
  if (value == null) return null
  if (value >= 0) return { className: 'text-emerald-600', attribute: 'data-good' }
  if (value >= -10) return { className: 'text-amber-600', attribute: 'data-warn' }
  return { className: 'text-red-600', attribute: 'data-bad' }
}

function segmentLabel(item: SegmentRankingItem, kind: 'device' | 'hour'): string {
  if (kind === 'device') return item.device ?? '—'
  return item.hora != null ? String(item.hora) : '—'
}

interface RankingBlockProps {
  title: string
  items: SegmentRankingItem[]
  kind: 'device' | 'hour'
}

function RankingBlock({ title, items, kind }: RankingBlockProps) {
  const label = kind === 'device' ? 'dispositivos' : 'horas'
  const dotClassName =
    title === 'Mejores' ? 'bg-emerald-500' : 'bg-red-400'
  if (items.length === 0) {
    return (
      <div>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
          <span
            className={`h-2 w-2 rounded-full ${dotClassName}`}
            aria-hidden
          />
          {title}
        </h4>
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-xs text-slate-500">
          Sin segmentos que superen el volumen mínimo.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
        <span className={`h-2 w-2 rounded-full ${dotClassName}`} aria-hidden />
        {title}
      </h4>
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full min-w-[560px] table-fixed text-left text-sm">
          <caption className="sr-only">
            Ranking de {title.toLowerCase()} de {label}
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="w-[24%] px-3 py-2.5 font-semibold">
                {kind === 'device' ? 'Dispositivo' : 'Hora'}
              </th>
              <th className="w-[22%] px-3 py-2.5 text-right font-semibold">
                Intentos
              </th>
              <th className="w-[20%] px-3 py-2.5 text-right font-semibold">
                AA %
              </th>
              <th className="w-[17%] px-3 py-2.5 text-right font-semibold">
                Ocup. %
              </th>
              <th className="w-[17%] px-3 py-2.5 text-right font-semibold">
                Health
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const tone = healthTone(item.health_score)
              const highlight = title === 'Mejores' && index === 0 ? 'bg-emerald-50' : ''
              return (
                <tr
                  key={segmentLabel(item, kind)}
                  data-testid="segment-ranking-row"
                  className={`transition-colors hover:bg-slate-50 ${highlight}`}
                >
                  <td className="truncate px-3 py-2.5 font-semibold text-slate-900">
                    {segmentLabel(item, kind)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                    {formatNumber(item.total_calls)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                    {formatRatePct(item.agent_answer_rate)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                    {formatRatePct(item.busy_rate)}
                  </td>
                  <td
                    {...(tone ? { [tone.attribute]: 'true' } : {})}
                    className={`px-3 py-2.5 text-right font-mono font-semibold ${tone?.className ?? 'text-slate-700'}`}
                  >
                    {formatScore(item.health_score)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface SegmentRankingTableProps {
  data: SegmentRankingResponse | null
  kind: 'device' | 'hour'
}

export function SegmentRankingTable({ data, kind }: SegmentRankingTableProps) {
  if (!data || (data.best.length === 0 && data.worst.length === 0)) {
    return (
      <p
        data-testid="segment-ranking-empty"
        className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
      >
        No hay segmentos con volumen mínimo en el rango seleccionado.
      </p>
    )
  }

  return (
    <div
      data-testid="segment-ranking-table"
      className="flex flex-col gap-5"
    >
      <RankingBlock title="Mejores" items={data.best} kind={kind} />
      <RankingBlock title="Peores" items={data.worst} kind={kind} />
    </div>
  )
}
