import { AlertTriangle, CheckCircle2, Gauge, Lightbulb } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { SummaryItem, SummaryKind } from '../../lib/executiveSummary'

const ICONS: Record<SummaryKind, { icon: LucideIcon; className: string }> = {
  context: { icon: Gauge, className: 'text-indigo-600' },
  problem: { icon: AlertTriangle, className: 'text-amber-600' },
  strength: { icon: CheckCircle2, className: 'text-emerald-600' },
  action: { icon: Lightbulb, className: 'text-sky-600' },
}

interface ExecutiveSummaryProps {
  items: SummaryItem[]
}

export function ExecutiveSummary({ items }: ExecutiveSummaryProps) {
  if (items.length === 0) return null

  return (
    <section id="sec-resumen" aria-label="Resumen" className="scroll-mt-16">
      <h2 className="mb-3 text-base font-semibold text-slate-900">Resumen</h2>
      <ul
        data-testid="executive-summary"
        className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {items.map((item) => {
          const { icon: Icon, className } = ICONS[item.kind]
          return (
            <li
              key={item.kind}
              data-testid={`summary-${item.kind}`}
              className="flex items-start gap-3 px-4 py-3"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} aria-hidden />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <p className="mt-0.5 text-sm text-slate-800">{item.text}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
