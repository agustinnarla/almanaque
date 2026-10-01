import type {
  BaseRankingRow,
  CrossRankingRow,
  SegmentRankingItem,
  SegmentRankingResponse,
} from '../types/api'

export type CrossRankingKind = 'base' | 'device' | 'hour'

function deltaPp(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null
  return Math.round((b - a) * 10000) / 100
}

function average(a: number | null, b: number | null): number | null {
  if (a == null && b == null) return null
  if (a == null) return b
  if (b == null) return a
  return (a + b) / 2
}

function compareRows(a: CrossRankingRow, b: CrossRankingRow): number {
  const rankedA = a.ranked ?? true
  const rankedB = b.ranked ?? true
  if (rankedA !== rankedB) return rankedA ? -1 : 1
  const avgA = average(a.healthA, a.healthB) ?? average(a.rateA, a.rateB)
  const avgB = average(b.healthA, b.healthB) ?? average(b.rateA, b.rateB)
  if (avgA == null && avgB == null) return a.key.localeCompare(b.key)
  if (avgA == null) return 1
  if (avgB == null) return -1
  if (avgB !== avgA) return avgB - avgA
  return a.key.localeCompare(b.key)
}

export function mergeBaseRankings(
  a: BaseRankingRow[],
  b: BaseRankingRow[],
): CrossRankingRow[] {
  const merged = new Map<string, CrossRankingRow>()
  const upsert = (
    base: string,
    rate: number | null,
    attempts: number,
    side: 'A' | 'B',
    ranked: boolean,
  ): void => {
    const row = merged.get(base) ?? {
      key: base,
      rateA: null,
      rateB: null,
      delta: null,
      healthA: null,
      healthB: null,
      attemptsA: null,
      attemptsB: null,
      ranked: false,
    }
    row.ranked = row.ranked || ranked
    if (side === 'A') {
      row.rateA = rate
      row.attemptsA = attempts
    } else {
      row.rateB = rate
      row.attemptsB = attempts
    }
    row.delta = deltaPp(row.rateA, row.rateB)
    merged.set(base, row)
  }
  for (const item of a) {
    upsert(item.base, item.agent_answer_rate, item.total_calls, 'A', item.ranked ?? true)
  }
  for (const item of b) {
    upsert(item.base, item.agent_answer_rate, item.total_calls, 'B', item.ranked ?? true)
  }
  return [...merged.values()].sort(compareBaseRows)
}

// Bases: representative ones first, the biggest combined volume on top.
function compareBaseRows(a: CrossRankingRow, b: CrossRankingRow): number {
  const rankedA = a.ranked ?? true
  const rankedB = b.ranked ?? true
  if (rankedA !== rankedB) return rankedA ? -1 : 1
  const callsA = (a.attemptsA ?? 0) + (a.attemptsB ?? 0)
  const callsB = (b.attemptsA ?? 0) + (b.attemptsB ?? 0)
  if (callsB !== callsA) return callsB - callsA
  return a.key.localeCompare(b.key)
}

function segmentKey(item: SegmentRankingItem, kind: 'device' | 'hour'): string {
  if (kind === 'device') return item.device ?? '—'
  return item.hora != null ? String(item.hora) : '—'
}

function collectSegments(
  response: SegmentRankingResponse | null,
  kind: 'device' | 'hour',
): Map<string, SegmentRankingItem> {
  const map = new Map<string, SegmentRankingItem>()
  if (!response) return map
  for (const item of [...response.best, ...response.worst]) {
    const key = segmentKey(item, kind)
    if (!map.has(key)) map.set(key, item)
  }
  return map
}

export function mergeSegmentRankings(
  a: SegmentRankingResponse | null,
  b: SegmentRankingResponse | null,
  kind: 'device' | 'hour',
): CrossRankingRow[] {
  const mapA = collectSegments(a, kind)
  const mapB = collectSegments(b, kind)
  const keys = [...new Set([...mapA.keys(), ...mapB.keys()])]

  return keys
    .map((key) => {
      const itemA = mapA.get(key)
      const itemB = mapB.get(key)
      const rateA = itemA?.agent_answer_rate ?? null
      const rateB = itemB?.agent_answer_rate ?? null
      return {
        key,
        rateA,
        rateB,
        delta: deltaPp(rateA, rateB),
        healthA: itemA?.health_score ?? null,
        healthB: itemB?.health_score ?? null,
        attemptsA: itemA?.total_calls ?? null,
        attemptsB: itemB?.total_calls ?? null,
      }
    })
    .sort(compareRows)
}
