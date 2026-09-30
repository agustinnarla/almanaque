const EMPTY = '—'

// Rate as a fraction (0.0594) → "5.94%".
export function formatRatePct(
  rate: number | null | undefined,
  digits = 2,
): string {
  if (rate == null) return EMPTY
  return `${(rate * 100).toFixed(digits)}%`
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return EMPTY
  return value.toLocaleString('es-AR')
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return EMPTY
  return score.toFixed(2)
}

// Delta between two rates as a fraction (0.0123) → "+1.23 pp".
export function formatDeltaPp(delta: number | null | undefined): string {
  if (delta == null) return EMPTY
  const pp = delta * 100
  const sign = pp > 0 ? '+' : pp < 0 ? '−' : ''
  return `${sign}${Math.abs(pp).toFixed(2)} pp`
}
