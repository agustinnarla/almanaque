import { AlertTriangle, FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Recommendation, Severity } from '../../types/api'

const BORDER_CLASSES: Record<Severity, string> = {
  CRITICAL: 'border-l-rose-500',
  WARNING: 'border-l-amber-500',
  SUCCESS: 'border-l-emerald-500',
  INFO: 'border-l-slate-400',
}

const TYPE_LABELS: Record<string, string> = {
  ROUTING: 'Ruteo',
  PACING: 'Pacing',
  SCHEDULE: 'Horario',
  AMD_DIVERGENCE: 'Contestadores',
  VOLUME_DELTA: 'Volumen',
}

const STRATEGY_TYPES = new Set([
  'ROUTING',
  'PACING',
  'SCHEDULE',
  'AMD_DIVERGENCE',
])

const GROUP_SECTIONS = [
  { key: 'strategy', title: 'Estrategia de campaña', testId: 'rec-section-strategy' },
  { key: 'period', title: 'Alertas del período', testId: 'rec-section-period' },
] as const

function groupRecommendations(recommendations: Recommendation[]) {
  return {
    strategy: recommendations.filter((r) => STRATEGY_TYPES.has(r.type)),
    period: recommendations.filter((r) => !STRATEGY_TYPES.has(r.type)),
  }
}

function ExcludedAmdBadge({ devices }: { devices: string[] }) {
  return (
    <div
      data-testid="routing-excluded-amd"
      className="mt-2 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-2"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <div className="text-xs text-amber-100">
        <p className="font-semibold">Descartado del ruteo por contestadores</p>
        <p className="mt-0.5 text-amber-200/90">
          {devices.join(', ')} no compite por prioridad de marcado mientras su
          ratio de automáticos ≥ 4× agentes. Plan: corregir AMD/troncal → puede
          volver a ser candidato a ruteo.
        </p>
      </div>
    </div>
  )
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const showExcluded =
    rec.type === 'ROUTING' && Array.isArray(rec.excluded_amd) && rec.excluded_amd.length > 0

  return (
    <article
      data-testid="recommendation-card"
      data-category={rec.category}
      data-type={rec.type}
      className={`rounded-xl border-l-4 bg-slate-900 px-4 py-3 shadow-sm ${BORDER_CLASSES[rec.category]}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-100">
          {TYPE_LABELS[rec.type] ?? rec.type}
        </span>
        <span className="text-xs text-slate-400">·</span>
        <span className="text-xs font-semibold text-slate-300">{rec.entity}</span>
      </div>
      <p className="mt-1 text-sm text-slate-100">{rec.text}</p>
      {showExcluded && <ExcludedAmdBadge devices={rec.excluded_amd!} />}
    </article>
  )
}

interface RecommendationsPanelProps {
  recommendations: Recommendation[]
  headerAction?: ReactNode
}

export function RecommendationsPanel({
  recommendations,
  headerAction,
}: RecommendationsPanelProps) {
  const groups = groupRecommendations(recommendations)

  return (
    <section aria-label="Observaciones y recomendaciones">
      <div className="mb-1 flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <FileText className="h-4 w-4 text-indigo-600" aria-hidden />
          Observaciones y recomendaciones
        </h2>
        {headerAction}
      </div>
      <p className="mb-3 text-xs text-slate-500">
        Generadas automáticamente a partir de los datos cargados, con foco en
        mejorar la contactación y el Answer Agent
      </p>

      {recommendations.length === 0 ? (
        <p
          data-testid="recommendations-empty"
          className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500"
        >
          No hay recomendaciones para este rango. Probá con otras fechas o un
          umbral de volumen menor.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {GROUP_SECTIONS.map((section) => {
            const items = groups[section.key]
            if (items.length === 0) return null
            return (
              <div key={section.key} data-testid={section.testId}>
                <h3 className="mb-2 text-sm font-bold text-slate-800">
                  {section.title}
                </h3>
                <div className="flex flex-col gap-3">
                  {items.map((rec) => (
                    <RecommendationCard key={rec.id} rec={rec} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
