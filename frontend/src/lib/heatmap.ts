import type { HourDeviceRow } from '../types/api'
import { HEATMAP_MIN_CELL_CALLS, HIGHLIGHT_MIN_SHARE } from './rangeThresholds'

// Spec 058: trunk × hour grid. Rows are the trunks with real volume; cells
// with too few calls are shown but left out of the color scale.

export type HeatMetric = 'aa' | 'attendable'
export const HEAT_BINS = 6

export interface HeatCell {
  device: string
  hora: number
  total: number
  agents: number
  machines: number
  value: number | null
  small: boolean
}

export interface Heatmap {
  hours: number[]
  devices: { device: string; total: number }[]
  cells: Map<string, HeatCell>
  domain: [number, number] | null
  hiddenDevices: number
}

export const cellKey = (device: string, hora: number) => `${device}|${hora}`

function metricValue(row: HourDeviceRow, metric: HeatMetric): number | null {
  const denominator = metric === 'aa' ? row.total_calls : row.total_calls - row.machine_answers
  return denominator > 0 ? row.agent_answers / denominator : null
}

export function buildHeatmap(rows: HourDeviceRow[], metric: HeatMetric): Heatmap {
  const totals = new Map<string, number>()
  for (const row of rows) totals.set(row.device, (totals.get(row.device) ?? 0) + row.total_calls)
  const grand = [...totals.values()].reduce((sum, value) => sum + value, 0)
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const kept = ranked.filter(([, total]) => total >= HIGHLIGHT_MIN_SHARE * grand)
  const keptNames = new Set(kept.map(([device]) => device))

  const cells = new Map<string, HeatCell>()
  const hours = new Set<number>()
  const values: number[] = []
  for (const row of rows) {
    if (!keptNames.has(row.device)) continue
    hours.add(row.hora)
    const small = row.total_calls < HEATMAP_MIN_CELL_CALLS
    const value = metricValue(row, metric)
    if (!small && value != null) values.push(value)
    cells.set(cellKey(row.device, row.hora), {
      device: row.device,
      hora: row.hora,
      total: row.total_calls,
      agents: row.agent_answers,
      machines: row.machine_answers,
      value,
      small,
    })
  }
  return {
    hours: [...hours].sort((a, b) => a - b),
    devices: kept.map(([device, total]) => ({ device, total })),
    cells,
    domain: values.length > 0 ? [Math.min(...values), Math.max(...values)] : null,
    hiddenDevices: ranked.length - kept.length,
  }
}

// Which of the HEAT_BINS steps a value falls in (0 = lowest).
export function heatBin(value: number, domain: [number, number], bins = HEAT_BINS): number {
  const [min, max] = domain
  if (max <= min) return bins - 1
  return Math.min(bins - 1, Math.max(0, Math.floor(((value - min) / (max - min)) * bins)))
}
