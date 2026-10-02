import { StatCard } from '../common/StatCard'
import { Sparkline } from '../common/Sparkline'
import type { CampaignSummary, DailyTrendPoint } from '../../types/api'
import { formatDayLabel } from '../../lib/dates'
import { formatNumber, formatRatePct } from '../../lib/format'
import { kpiDeltas } from '../../lib/previousPeriod'

export interface PreviousPeriod {
  summary: CampaignSummary | null
  range: { from: string; to: string }
  // "vs semana anterior" / "vs período anterior"
  label: string
}

interface OverviewKpisProps {
  summary: CampaignSummary
  // Spec 059: deltas against the period right before (absent: no deltas).
  previous?: PreviousPeriod | null
  // Spec 059: daily series for the AA sparkline.
  daily?: DailyTrendPoint[]
}

export function OverviewKpis({ summary, previous = null, daily = [] }: OverviewKpisProps) {
  const machineShare =
    summary.total_calls > 0 ? summary.machine_answers / summary.total_calls : null
  const rejectedShare =
    summary.total_calls > 0 ? summary.rejected_calls / summary.total_calls : null

  const deltas = previous ? kpiDeltas(summary, previous.summary) : null
  const rangeText = previous
    ? `${formatDayLabel(previous.range.from)} → ${formatDayLabel(previous.range.to)}`
    : ''
  const deltaProps = (delta: number | null | undefined, unit: 'pp' | '%') =>
    deltas
      ? {
          delta: delta ?? null,
          deltaIsPercent: unit === '%',
          deltaSuffix: unit === 'pp' ? 'pp' : null,
          deltaLabel: previous?.label,
          deltaTitle: `Comparado con ${rangeText}`,
        }
      : {}

  const rates = daily.map((day) => (day.agent_answer_rate == null ? null : day.agent_answer_rate * 100))
  const firstRate = rates.find((rate) => rate != null)
  const lastRate = rates.findLast((rate) => rate != null)
  const sparkline =
    daily.length >= 2 && firstRate != null && lastRate != null ? (
      <Sparkline
        values={rates}
        label={
          `AA diario del ${formatDayLabel(daily[0].fecha)} al ${formatDayLabel(daily.at(-1)!.fecha)}: ` +
          `de ${firstRate.toFixed(2)}% a ${lastRate.toFixed(2)}%`
        }
      />
    ) : undefined

  return (
    <div>
      <div
        data-testid="overview-kpis"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(2,minmax(0,1fr))]"
      >
        {/* The headline AA spans two rows; the other four sit in a 2×2 beside it. */}
        <StatCard
          hero
          className="lg:row-span-2"
          title="Tasa de contacto"
          value={formatRatePct(summary.agent_answer_rate)}
          subtitle="Agent Answer acumulado del rango"
          trend={sparkline}
          {...deltaProps(deltas?.agentAnswerPp, 'pp')}
        />
        <StatCard
          title="AA sobre atendibles"
          value={formatRatePct(summary.attendable_answer_rate)}
          subtitle="Agentes ÷ llamadas sin contestador"
          {...deltaProps(deltas?.attendablePp, 'pp')}
        />
        <StatCard
          title="Total de llamadas"
          value={formatNumber(summary.total_calls)}
          subtitle={`${formatNumber(summary.agent_answers)} contestadas por agentes`}
          neutral
          {...deltaProps(deltas?.totalCallsPct, '%')}
        />
        <StatCard
          title="Contestadores"
          value={formatRatePct(machineShare)}
          subtitle={`${formatNumber(summary.machine_answers)} llamadas a contestador`}
          goodWhenNegative
          {...deltaProps(deltas?.machineSharePp, 'pp')}
        />
        <StatCard
          title="No contesta / fallidas"
          value={formatNumber(summary.rejected_calls)}
          subtitle={`${formatRatePct(rejectedShare)} del total`}
          goodWhenNegative
          {...deltaProps(deltas?.rejectedSharePp, 'pp')}
        />
      </div>
      {previous && !deltas && (
        <p data-testid="no-previous-period" className="mt-2 text-xs text-slate-500">
          Sin datos del período anterior ({rangeText}): no hay variaciones para mostrar.
        </p>
      )}
    </div>
  )
}
