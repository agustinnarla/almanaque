import type { CampaignCatalogEntry } from '../types/api'
import { formatDayLabel } from './dates'

// Spec 055: which campaigns lag behind and which business days have no data.
// Holidays are unknown here: a missing business day may be one, and the UI says so.

const MAX_LISTED_DAYS = 3

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Monday to Friday between from and to, both included.
export function businessDays(from: string, to: string): string[] {
  const days: string[] = []
  for (let day = toDate(from); day <= toDate(to); day.setUTCDate(day.getUTCDate() + 1)) {
    const weekday = day.getUTCDay()
    if (weekday !== 0 && weekday !== 6) days.push(toIso(day))
  }
  return days
}

export interface CampaignCoverage {
  campaign: string
  segment: string
  firstDay: string
  lastDay: string
  days: number
  // Business days from its first day to the overall last day without data.
  missing: string[]
  // Its last day is before the overall last day.
  behind: boolean
}

export interface Coverage {
  firstDay: string | null
  lastDay: string | null
  complete: boolean
  campaigns: CampaignCoverage[]
}

export function buildCoverage(catalog: CampaignCatalogEntry[]): Coverage {
  if (catalog.length === 0) {
    return { firstDay: null, lastDay: null, complete: true, campaigns: [] }
  }
  const firstDay = catalog.map((entry) => entry.first_day).sort()[0]
  const lastDay = catalog.map((entry) => entry.last_day).sort().at(-1)!
  const campaigns = catalog.map((entry) => {
    const present = new Set(entry.dates)
    return {
      campaign: entry.campaign,
      segment: entry.segment,
      firstDay: entry.first_day,
      lastDay: entry.last_day,
      days: entry.days,
      missing: businessDays(entry.first_day, lastDay).filter((day) => !present.has(day)),
      behind: entry.last_day < lastDay,
    }
  })
  const complete = campaigns.every((item) => !item.behind && item.missing.length === 0)
  return { firstDay, lastDay, complete, campaigns }
}

// Business days of [from, to] without data for this campaign.
export function rangeMissingDays(entry: CampaignCatalogEntry, from: string, to: string): string[] {
  const present = new Set(entry.dates)
  return businessDays(from, to).filter((day) => !present.has(day))
}

// "16/09 → 30/09" for a run of consecutive business days, else "08/09, 10/09 y 2 más".
export function describeDays(days: string[]): string {
  if (days.length === 0) return ''
  const sorted = [...days].sort()
  const run = businessDays(sorted[0], sorted.at(-1)!)
  if (sorted.length >= MAX_LISTED_DAYS && run.length === sorted.length) {
    return `${formatDayLabel(sorted[0])} → ${formatDayLabel(sorted.at(-1)!)}`
  }
  const listed = sorted.slice(0, MAX_LISTED_DAYS).map(formatDayLabel)
  const rest = sorted.length - listed.length
  if (rest > 0) return `${listed.join(', ')} y ${rest} más`
  if (listed.length === 1) return listed[0]
  return `${listed.slice(0, -1).join(', ')} y ${listed.at(-1)}`
}

export function coverageSummary(coverage: Coverage): string {
  const { firstDay, lastDay, campaigns } = coverage
  if (firstDay == null || lastDay == null) return 'No hay campañas cargadas.'
  if (coverage.complete) {
    const count = campaigns.length
    return (
      `Datos al día: ${count} ${count === 1 ? 'campaña' : 'campañas'} del ` +
      `${formatDayLabel(firstDay)} al ${formatDayLabel(lastDay)} ` +
      `(${businessDays(firstDay, lastDay).length} días hábiles).`
    )
  }
  const parts = campaigns.flatMap((item) => {
    const notes: string[] = []
    if (item.behind) notes.push(`${item.campaign} llega hasta el ${formatDayLabel(item.lastDay)}`)
    const gaps = item.missing.filter((day) => day <= item.lastDay)
    if (gaps.length > 0) {
      notes.push(`${item.campaign}: ${gaps.length === 1 ? 'falta el' : 'faltan'} ${describeDays(gaps)}`)
    }
    return notes
  })
  return `Cobertura incompleta: ${parts.join(' · ')}.`
}

// Comparar campañas: days of the range one campaign has and the other lacks.
export function crossCoverageNotes(
  entryA: CampaignCatalogEntry,
  entryB: CampaignCatalogEntry,
  from: string,
  to: string,
): string[] {
  const notes: string[] = []
  for (const [self, other] of [[entryA, entryB], [entryB, entryA]]) {
    const otherDays = new Set(other.dates)
    const missing = rangeMissingDays(self, from, to).filter((day) => otherDays.has(day))
    if (missing.length === 0) continue
    notes.push(
      `La campaña ${self.campaign} no tiene datos de ${missing.length} ` +
        `${missing.length === 1 ? 'día hábil' : 'días hábiles'} del rango (${describeDays(missing)}); ` +
        `sus totales cubren menos días que los de la ${other.campaign}.`,
    )
  }
  return notes
}
