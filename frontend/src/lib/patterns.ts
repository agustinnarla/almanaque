import type { PatternAlert } from '../types/api'

export interface PatternDayCount {
  fecha: string
  alerts: number
}

export interface PatternCombo {
  base: string
  device: string
  alerts: number
  worstRate: number | null
}

export interface PatternSummary {
  byDay: PatternDayCount[]
  topCombos: PatternCombo[]
}

const TOP_COMBOS = 5

export function summarizePatterns(
  alerts: PatternAlert[],
  campaign: string,
): PatternSummary {
  const own = alerts.filter((alert) => alert.campaign === campaign)

  const byDayMap = new Map<string, number>()
  for (const alert of own) {
    byDayMap.set(alert.fecha, (byDayMap.get(alert.fecha) ?? 0) + 1)
  }

  const byDay = [...byDayMap.entries()]
    .map(([fecha, count]) => ({ fecha, alerts: count }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const topCombos = [...aggregateCombos(own).values()]
    .sort(compareCombos)
    .slice(0, TOP_COMBOS)

  return { byDay, topCombos }
}

function aggregateCombos(rows: PatternAlert[]): Map<string, PatternCombo> {
  const comboMap = new Map<string, PatternCombo>()
  for (const alert of rows) {
    const key = `${alert.base}|${alert.device}`
    const rate = alert.agent_answer_rate
    const existing = comboMap.get(key)
    if (existing) {
      existing.alerts += 1
      if (rate != null && (existing.worstRate == null || rate < existing.worstRate)) {
        existing.worstRate = rate
      }
    } else {
      comboMap.set(key, {
        base: alert.base,
        device: alert.device,
        alerts: 1,
        worstRate: rate,
      })
    }
  }
  return comboMap
}

function compareCombos(a: PatternCombo, b: PatternCombo): number {
  if (b.alerts !== a.alerts) return b.alerts - a.alerts
  const aRate = a.worstRate ?? Number.POSITIVE_INFINITY
  const bRate = b.worstRate ?? Number.POSITIVE_INFINITY
  if (aRate !== bRate) return aRate - bRate
  return `${a.base}|${a.device}`.localeCompare(`${b.base}|${b.device}`)
}

export interface PatternCompareDay {
  fecha: string
  alertsA: number
  alertsB: number
}

export interface PatternCompareCombo {
  base: string
  device: string
  alertsA: number
  alertsB: number
  total: number
  worstRateA: number | null
  worstRateB: number | null
}

export function comparePatternSummaries(
  alerts: PatternAlert[],
  campaignA: string,
  campaignB: string,
): { byDay: PatternCompareDay[]; combos: PatternCompareCombo[] } {
  const combosA = aggregateCombos(alerts.filter((alert) => alert.campaign === campaignA))
  const combosB = aggregateCombos(alerts.filter((alert) => alert.campaign === campaignB))

  const dayA = new Map<string, number>()
  const dayB = new Map<string, number>()
  for (const alert of alerts) {
    if (alert.campaign === campaignA) {
      dayA.set(alert.fecha, (dayA.get(alert.fecha) ?? 0) + 1)
    } else if (alert.campaign === campaignB) {
      dayB.set(alert.fecha, (dayB.get(alert.fecha) ?? 0) + 1)
    }
  }

  const byDay = [...new Set([...dayA.keys(), ...dayB.keys()])]
    .sort()
    .map((fecha) => ({
      fecha,
      alertsA: dayA.get(fecha) ?? 0,
      alertsB: dayB.get(fecha) ?? 0,
    }))

  const keys = [...new Set([...combosA.keys(), ...combosB.keys()])]
  const combos = keys
    .map((key) => {
      const a = combosA.get(key)
      const b = combosB.get(key)
      const [base, device] = key.split('|')
      const alertsA = a?.alerts ?? 0
      const alertsB = b?.alerts ?? 0
      return {
        base,
        device,
        alertsA,
        alertsB,
        total: alertsA + alertsB,
        worstRateA: a?.worstRate ?? null,
        worstRateB: b?.worstRate ?? null,
      }
    })
    .sort((x, y) => {
      if (y.total !== x.total) return y.total - x.total
      const xWorst = Math.min(x.worstRateA ?? Number.POSITIVE_INFINITY, x.worstRateB ?? Number.POSITIVE_INFINITY)
      const yWorst = Math.min(y.worstRateA ?? Number.POSITIVE_INFINITY, y.worstRateB ?? Number.POSITIVE_INFINITY)
      if (xWorst !== yWorst) return xWorst - yWorst
      return `${x.base}|${x.device}`.localeCompare(`${y.base}|${y.device}`)
    })
    .slice(0, TOP_COMBOS)

  return { byDay, combos }
}
