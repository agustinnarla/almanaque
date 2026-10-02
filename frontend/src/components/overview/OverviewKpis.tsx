import { StatCard } from '../common/StatCard'
import type { CampaignSummary } from '../../types/api'
import { formatNumber, formatRatePct } from '../../lib/format'

interface OverviewKpisProps {
  summary: CampaignSummary
}

export function OverviewKpis({ summary }: OverviewKpisProps) {
  const machineShare =
    summary.total_calls > 0 ? summary.machine_answers / summary.total_calls : null
  const rejectedShare =
    summary.total_calls > 0 ? summary.rejected_calls / summary.total_calls : null

  return (
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
      />
      <StatCard
        title="AA sobre atendibles"
        value={formatRatePct(summary.attendable_answer_rate)}
        subtitle="Agentes ÷ llamadas sin contestador"
      />
      <StatCard
        title="Total de llamadas"
        value={formatNumber(summary.total_calls)}
        subtitle={`${formatNumber(summary.agent_answers)} contestadas por agentes`}
      />
      <StatCard
        title="Contestadores"
        value={formatRatePct(machineShare)}
        subtitle={`${formatNumber(summary.machine_answers)} llamadas a contestador`}
      />
      <StatCard
        title="No contesta / fallidas"
        value={formatNumber(summary.rejected_calls)}
        subtitle={`${formatRatePct(rejectedShare)} del total`}
      />
    </div>
  )
}
