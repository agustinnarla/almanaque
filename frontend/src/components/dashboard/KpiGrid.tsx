import { StatCard } from '../common/StatCard'
import {
  congestionTrendClass,
  congestionTrendLabel,
  healthScoreClass,
  healthScoreLabel,
} from '../common/healthStyle'
import type { CompareDiagnosticsResponse } from '../../types/api'

function formatRate(rate: number | null): string {
  if (rate == null) return '—'
  return `${(rate * 100).toFixed(2)}%`
}

function formatNumber(value: number): string {
  return value.toLocaleString('es-AR')
}

function formatScore(score: number | null): string {
  if (score == null) return '—'
  return score.toFixed(2)
}

interface KpiGridProps {
  data: CompareDiagnosticsResponse | { summary: CompareDiagnosticsResponse['summary'] }
  labelA?: string
  labelB?: string
}

export function KpiGrid({ data, labelA = 'Día', labelB = 'Día' }: KpiGridProps) {
  const summary = data.summary
  if (!summary) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No hay datos de resumen para las fechas seleccionadas. Verificá que ambos
        días existan en la campaña.
      </p>
    )
  }

  const congestionDeltaPp =
    summary.congestion_rate != null
      ? (summary.congestion_rate - (summary.congestion_rate_a ?? 0)) * 100
      : null

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total de llamadas"
        value={`${formatNumber(summary.total_calls_a)} → ${formatNumber(summary.total_calls_b)}`}
        delta={summary.delta_total_pct}
        deltaLabel="vs A"
        subtitle={`${labelA} A: ${formatNumber(summary.total_calls_a)} · ${labelA} B: ${formatNumber(summary.total_calls_b)}`}
      />
      <StatCard
        title="Tasa de contacto"
        value={`${formatRate(summary.agent_answer_rate_a)} → ${formatRate(summary.agent_answer_rate_b)}`}
        delta={summary.delta_rate != null ? summary.delta_rate * 100 : null}
        deltaIsPercent={false}
        deltaSuffix="pp"
        deltaSecondary={summary.delta_percentage}
      />
      <StatCard
        title={`Congestión (${labelB} B)`}
        value={formatRate(summary.congestion_rate)}
        delta={congestionDeltaPp}
        deltaIsPercent={false}
        goodWhenNegative
        deltaLabel="pp vs A"
        subtitle={
          <span
            data-testid="congestion-trend"
            className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${congestionTrendClass(congestionDeltaPp)}`}
          >
            {congestionTrendLabel(congestionDeltaPp)}
          </span>
        }
      />
      <StatCard
        title={`Health score (${labelB} B)`}
        value={formatScore(summary.health_score)}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span
              data-testid="health-score-badge"
              className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${healthScoreClass(summary.health_score)}`}
            >
              {healthScoreLabel(summary.health_score)}
            </span>
            <span>AA − busy × 0.5 − congestión × 1.5</span>
          </span>
        }
      />
    </div>
  )
}
