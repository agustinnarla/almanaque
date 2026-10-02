import type { DailyTrendPoint, HourlyTrendPoint } from '../types/api'
import { lowVolumeDays } from './lowVolume'

export interface DailyChartPoint {
  label: string
  fecha: string
  total: number
  rate: number | null
  // Spec 050: under half the range's median volume, and that share.
  lowVolume: boolean
  volumeShare: number | null
}

export function mapDailyPoints(points: DailyTrendPoint[]): DailyChartPoint[] {
  const { median, days } = lowVolumeDays(points)
  return points.map((p) => ({
    label: `${p.fecha.slice(8, 10)}/${p.fecha.slice(5, 7)}`,
    fecha: p.fecha,
    total: p.total_calls,
    rate: p.agent_answer_rate != null ? p.agent_answer_rate * 100 : null,
    lowVolume: days.has(p.fecha),
    volumeShare: median > 0 ? p.total_calls / median : null,
  }))
}

export interface MergedHourPoint {
  hora: number
  totalA: number
  totalB: number
  rateA: number | null
  rateB: number | null
}

export function mergeHourlyPoints(
  pointsA: HourlyTrendPoint[],
  pointsB: HourlyTrendPoint[],
): MergedHourPoint[] {
  const byHour = new Map<number, MergedHourPoint>()
  const ensure = (hora: number): MergedHourPoint => {
    let row = byHour.get(hora)
    if (!row) {
      row = { hora, totalA: 0, totalB: 0, rateA: null, rateB: null }
      byHour.set(hora, row)
    }
    return row
  }
  for (const p of pointsA) {
    const row = ensure(p.hora)
    row.totalA = p.total_calls
    row.rateA = p.agent_answer_rate != null ? p.agent_answer_rate * 100 : null
  }
  for (const p of pointsB) {
    const row = ensure(p.hora)
    row.totalB = p.total_calls
    row.rateB = p.agent_answer_rate != null ? p.agent_answer_rate * 100 : null
  }
  return [...byHour.values()].sort((a, b) => a.hora - b.hora)
}

export interface DailyComparePoint {
  label: string
  totalA: number
  totalB: number
  rateA: number | null
  rateB: number | null
}

export function mergeDailyPoints(
  pointsA: DailyTrendPoint[],
  pointsB: DailyTrendPoint[],
): DailyComparePoint[] {
  const byFecha = new Map<string, DailyComparePoint>()
  const ensure = (fecha: string): DailyComparePoint => {
    let row = byFecha.get(fecha)
    if (!row) {
      row = {
        label: `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`,
        totalA: 0,
        totalB: 0,
        rateA: null,
        rateB: null,
      }
      byFecha.set(fecha, row)
    }
    return row
  }
  for (const p of pointsA) {
    const row = ensure(p.fecha)
    row.totalA = p.total_calls
    row.rateA = p.agent_answer_rate != null ? p.agent_answer_rate * 100 : null
  }
  for (const p of pointsB) {
    const row = ensure(p.fecha)
    row.totalB = p.total_calls
    row.rateB = p.agent_answer_rate != null ? p.agent_answer_rate * 100 : null
  }
  return [...byFecha.values()]
}
