export interface WeekOption {
  label: string
  start: string
  end: string
  dataDays: number
  partial: boolean
}

export const WEEK_OPTIONS: WeekOption[] = [
  {
    label: 'Semana 36 (01–06/09)',
    start: '2026-08-31',
    end: '2026-09-06',
    dataDays: 4,
    partial: true,
  },
  {
    label: 'Semana 37 (07–13/09)',
    start: '2026-09-07',
    end: '2026-09-13',
    dataDays: 5,
    partial: false,
  },
  {
    label: 'Semana 38 (14–20/09)',
    start: '2026-09-14',
    end: '2026-09-20',
    dataDays: 2,
    partial: true,
  },
]

export const DEFAULT_WEEK: WeekOption = WEEK_OPTIONS[1]

export function findWeekByStart(start: string): WeekOption | null {
  return WEEK_OPTIONS.find((week) => week.start === start) ?? null
}
