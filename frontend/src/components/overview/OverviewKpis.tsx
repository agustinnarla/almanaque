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
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        title="Total de llamadas"
        value={formatNumber(summary.total_calls)}
        subtitle={`${formatNumber(summary.agent_answers)} contestadas por agentes`}
      />
      <StatCard
        title="Tasa de contacto"
        value={formatRatePct(summary.agent_answer_rate)}
        subtitle="Agent Answer acumulado del rango"
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
