import type { TrunkVolumeRow } from '../types/api'
import { OTHER_TRUNK_COLOR, TRUNK_COLORS } from './chartPalette'

// More than five stacked colors stop being distinguishable; the tail folds into "Otras".
export const TRUNK_CHART_TOP = 5
export const OTHER_TRUNK = 'Otras'

export interface TrunkTotal {
  name: string
  total: number
  share: number
}

export type TrunkDay = { fecha: string; label: string; total: number } & Record<string, number | string>

export interface TrunkVolume {
  trunks: TrunkTotal[]
  days: TrunkDay[]
}

// Slot order follows the trunk's volume rank in the range; the tail stays gray.
export function trunkColor(trunk: TrunkTotal, index: number): string {
  return trunk.name === OTHER_TRUNK ? OTHER_TRUNK_COLOR : TRUNK_COLORS[index]
}

export function buildTrunkVolume(rows: TrunkVolumeRow[], top = TRUNK_CHART_TOP): TrunkVolume {
  const totals = new Map<string, number>()
  for (const row of rows) {
    totals.set(row.device, (totals.get(row.device) ?? 0) + row.total_calls)
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const kept = new Set(ranked.slice(0, top).map(([name]) => name))
  const otherTotal = ranked.slice(top).reduce((sum, [, total]) => sum + total, 0)
  const grandTotal = ranked.reduce((sum, [, total]) => sum + total, 0)

  const names = [...kept, ...(otherTotal > 0 ? [OTHER_TRUNK] : [])]
  const trunks = names.map((name) => {
    const total = name === OTHER_TRUNK ? otherTotal : (totals.get(name) ?? 0)
    return { name, total, share: grandTotal > 0 ? total / grandTotal : 0 }
  })

  const byDay = new Map<string, TrunkDay>()
  for (const row of rows) {
    let day = byDay.get(row.fecha)
    if (!day) {
      day = { fecha: row.fecha, label: `${row.fecha.slice(8, 10)}/${row.fecha.slice(5, 7)}`, total: 0 }
      for (const name of names) day[name] = 0
      byDay.set(row.fecha, day)
    }
    const key = kept.has(row.device) ? row.device : OTHER_TRUNK
    day[key] = Number(day[key]) + row.total_calls
    day.total += row.total_calls
  }
  const days = [...byDay.values()].sort((a, b) => a.fecha.localeCompare(b.fecha))
  return { trunks, days }
}
