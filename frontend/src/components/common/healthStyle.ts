// Health score cut-offs (points): Saludable from HEALTH_HEALTHY_MIN, Aceptable
// from HEALTH_ACCEPTABLE_MIN, Crítico below. Shown in the methodology modal.
export const HEALTH_HEALTHY_MIN = 0
export const HEALTH_ACCEPTABLE_MIN = -25

export function congestionTrendClass(deltaPp: number | null): string {
  if (deltaPp == null || !Number.isFinite(deltaPp)) {
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }
  if (deltaPp < 0) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (deltaPp > 0) return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

export function congestionTrendLabel(deltaPp: number | null): string {
  if (deltaPp == null || !Number.isFinite(deltaPp)) return 'Sin datos'
  if (deltaPp < 0) return 'Mejorando'
  if (deltaPp > 0) return 'Empeorando'
  return 'Sin cambios'
}

export function healthScoreClass(score: number | null): string {
  if (score == null) return 'bg-slate-100 text-slate-600 border-slate-200'
  if (score >= HEALTH_HEALTHY_MIN) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (score >= HEALTH_ACCEPTABLE_MIN) return 'bg-amber-100 text-amber-900 border-amber-200'
  return 'bg-rose-100 text-rose-800 border-rose-200'
}

export function healthScoreLabel(score: number | null): string {
  if (score == null) return 'Sin datos'
  if (score >= HEALTH_HEALTHY_MIN) return 'Saludable'
  if (score >= HEALTH_ACCEPTABLE_MIN) return 'Aceptable'
  return 'Crítico'
}
