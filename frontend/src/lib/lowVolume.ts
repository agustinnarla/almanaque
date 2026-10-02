import type { DailyTrendPoint } from '../types/api'
import { LOW_VOLUME_DAY_SHARE, LOW_VOLUME_MIN_DAYS } from './rangeThresholds'

export interface LowVolumeDays {
  median: number
  days: Set<string>
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

// Days whose volume is under LOW_VOLUME_DAY_SHARE of the range's median: a
// relative bar, since daily volume goes from ~2.6k (35) to ~88k (92) calls.
export function lowVolumeDays(points: Pick<DailyTrendPoint, 'fecha' | 'total_calls'>[]): LowVolumeDays {
  const mid = median(points.map((point) => point.total_calls))
  if (points.length < LOW_VOLUME_MIN_DAYS) {
    return { median: mid, days: new Set() }
  }
  const days = new Set(
    points
      .filter((point) => point.total_calls < LOW_VOLUME_DAY_SHARE * mid)
      .map((point) => point.fecha),
  )
  return { median: mid, days }
}
