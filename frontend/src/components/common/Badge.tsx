import type { Severity } from '../../types/api'

const LABELS: Record<Severity, string> = {
  CRITICAL: 'Crítico',
  WARNING: 'Advertencia',
  SUCCESS: 'Éxito',
  INFO: 'Información',
}

const STYLES: Record<Severity, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  WARNING: 'bg-amber-100 text-amber-900 border-amber-200',
  SUCCESS: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  INFO: 'bg-sky-100 text-sky-800 border-sky-200',
}

interface BadgeProps {
  severity: Severity
}

export function Badge({ severity }: BadgeProps) {
  return (
    <span
      data-testid="severity-badge"
      data-severity={severity}
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STYLES[severity]}`}
    >
      {LABELS[severity]}
    </span>
  )
}
