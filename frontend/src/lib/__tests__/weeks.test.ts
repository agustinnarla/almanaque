import { describe, expect, it } from 'vitest'
import { SEPTEMBER_DATES } from '../../test/catalog'
import {
  buildWeekOptions,
  defaultWeek,
  findWeekByStart,
  WORKING_DAYS_PER_WEEK,
} from '../weeks'

describe('buildWeekOptions', () => {
  it('arma las 3 semanas ISO reales con días de datos y parcialidad', () => {
    expect(WORKING_DAYS_PER_WEEK).toBe(5)
    expect(buildWeekOptions(SEPTEMBER_DATES)).toEqual([
      {
        label: 'Semana 36 (31/08–06/09)',
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
    ])
  })

  it('ordena, ignora fechas repetidas y numera semanas que cruzan de año', () => {
    const weeks = buildWeekOptions([
      '2027-01-01',
      '2026-12-29',
      '2026-12-29',
      '2026-10-05',
    ])
    expect(weeks.map((week) => week.start)).toEqual(['2026-10-05', '2026-12-28'])
    expect(weeks[1].label).toBe('Semana 53 (28/12–03/01)')
    expect(weeks[1].dataDays).toBe(2)
    expect(buildWeekOptions([])).toEqual([])
  })
})

describe('defaultWeek', () => {
  it('elige la semana completa más reciente, o la más reciente si todas son parciales', () => {
    const weeks = buildWeekOptions(SEPTEMBER_DATES)
    expect(defaultWeek(weeks)?.start).toBe('2026-09-07')

    const partialOnly = buildWeekOptions(['2026-09-01', '2026-09-14'])
    expect(defaultWeek(partialOnly)?.start).toBe('2026-09-14')

    expect(defaultWeek([])).toBeNull()
  })
})

describe('findWeekByStart', () => {
  it('encuentra la semana por su lunes o devuelve null', () => {
    const weeks = buildWeekOptions(SEPTEMBER_DATES)
    expect(findWeekByStart(weeks, '2026-09-14')?.dataDays).toBe(2)
    expect(findWeekByStart(weeks, '2026-09-15')).toBeNull()
  })
})
