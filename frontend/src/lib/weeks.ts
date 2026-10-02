export interface WeekOption {
  label: string
  start: string
  end: string
  dataDays: number
  partial: boolean
}

export const WORKING_DAYS_PER_WEEK = 5

const DAY_MS = 24 * 60 * 60 * 1000

function parseDay(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

function mondayOf(date: Date): Date {
  return addDays(date, -((date.getUTCDay() + 6) % 7))
}

function isoWeekNumber(monday: Date): number {
  const thursday = addDays(monday, 3)
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  return Math.floor((thursday.getTime() - yearStart) / DAY_MS / 7) + 1
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

function weekLabel(monday: Date, sunday: Date): string {
  const number = twoDigits(isoWeekNumber(monday))
  const startDay = twoDigits(monday.getUTCDate())
  const endDay = twoDigits(sunday.getUTCDate())
  const startMonth = twoDigits(monday.getUTCMonth() + 1)
  const endMonth = twoDigits(sunday.getUTCMonth() + 1)
  const range =
    startMonth === endMonth
      ? `${startDay}–${endDay}/${endMonth}`
      : `${startDay}/${startMonth}–${endDay}/${endMonth}`
  return `Semana ${number} (${range})`
}

export function buildWeekOptions(dates: string[]): WeekOption[] {
  const daysByMonday = new Map<string, Set<string>>()
  for (const day of dates) {
    const monday = formatDay(mondayOf(parseDay(day)))
    const days = daysByMonday.get(monday) ?? new Set<string>()
    days.add(day)
    daysByMonday.set(monday, days)
  }
  return [...daysByMonday.keys()].sort().map((start) => {
    const monday = parseDay(start)
    const sunday = addDays(monday, 6)
    const dataDays = daysByMonday.get(start)?.size ?? 0
    return {
      label: weekLabel(monday, sunday),
      start,
      end: formatDay(sunday),
      dataDays,
      partial: dataDays < WORKING_DAYS_PER_WEEK,
    }
  })
}

export function defaultWeek(weeks: WeekOption[]): WeekOption | null {
  const complete = weeks.filter((week) => !week.partial)
  return complete.at(-1) ?? weeks.at(-1) ?? null
}

export function findWeekByStart(
  weeks: WeekOption[],
  start: string,
): WeekOption | null {
  return weeks.find((week) => week.start === start) ?? null
}

// Spec 057: Comparar semanas defaults to the last complete week (B) against
// the complete week before it (A); with fewer weeks, the last two available.
export function defaultWeekPair(weeks: WeekOption[]): { a: WeekOption; b: WeekOption } | null {
  const complete = weeks.filter((week) => !week.partial)
  const pool = complete.length >= 2 ? complete : weeks
  if (pool.length < 2) return null
  return { a: pool[pool.length - 2], b: pool[pool.length - 1] }
}

// Totals of weeks with a different number of days are not comparable; rates are.
export function weekMismatchNote(a: WeekOption, b: WeekOption): string | null {
  if (a.dataDays === b.dataDays && !a.partial && !b.partial) return null
  const days = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`
  return (
    `La ${a.label} tiene ${days(a.dataDays)} con datos y la ${b.label}, ${b.dataDays}: ` +
    'los totales no son comparables; las tasas sí.'
  )
}
