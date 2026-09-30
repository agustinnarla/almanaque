import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DiagnosticEvent } from '../../types/api'
import { InsightCard } from './InsightCard'

interface DiagnosticsFeedProps {
  rootCauses: DiagnosticEvent[]
  positiveDrivers: DiagnosticEvent[]
  positiveTitle?: string
  positiveDescription?: string
}

function Section({
  title,
  description,
  events,
  emptyMessage,
  icon: Icon,
  iconClassName,
}: {
  title: string
  description: string
  events: DiagnosticEvent[]
  emptyMessage: string
  icon: LucideIcon
  iconClassName: string
}) {
  return (
    <section className="flex-1">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
        <Icon className={`h-4 w-4 ${iconClassName}`} aria-hidden />
        {title}
      </h2>
      <p className="mb-3 text-xs text-slate-500">{description}</p>
      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event, index) => (
            <InsightCard
              key={`${event.type}-${event.entity}-${index}`}
              event={event}
              icon={Icon}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export function DiagnosticsFeed({
  rootCauses,
  positiveDrivers,
  positiveTitle = 'Factores de mejora',
  positiveDescription = 'Señales positivas o recuperaciones detectadas',
}: DiagnosticsFeedProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <Section
        title="Causas negativas"
        description="Factores que explican la caída del Agent Answer"
        events={rootCauses}
        emptyMessage="No se detectaron causas negativas para este rango."
        icon={AlertTriangle}
        iconClassName="text-amber-600"
      />
      <Section
        title={positiveTitle}
        description={positiveDescription}
        events={positiveDrivers}
        emptyMessage="No se detectaron factores de mejora para este rango."
        icon={CheckCircle2}
        iconClassName="text-emerald-600"
      />
    </div>
  )
}
