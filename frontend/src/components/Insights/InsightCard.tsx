import type { LucideIcon } from 'lucide-react'
import type { DiagnosticEvent } from '../../types/api'
import { Badge } from '../common/Badge'

interface InsightCardProps {
  event: DiagnosticEvent
  icon?: LucideIcon
}

export function InsightCard({ event, icon: Icon }: InsightCardProps) {
  return (
    <article
      data-testid="insight-card"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {Icon ? (
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          ) : null}
          <div>
            <p className="text-sm font-semibold text-slate-900">{event.entity}</p>
            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
              {event.type}
            </p>
          </div>
        </div>
        <Badge severity={event.severity} />
      </div>
      <p className="mt-3 text-sm text-slate-700">{event.message}</p>
    </article>
  )
}
