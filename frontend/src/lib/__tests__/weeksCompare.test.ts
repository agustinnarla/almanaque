import { describe, expect, it } from 'vitest'
import { mergeDailyByWeekday } from '../chartData'
import { weekdayCompareRows } from '../exporters'
import { buildWeekOptions, defaultWeekPair, weekMismatchNote } from '../weeks'
import type { DailyTrendPoint } from '../../types/api'

const weekdaysOf = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `2026-09-${String(from + i).padStart(2, '0')}`).filter(
    (iso) => ![0, 6].includes(new Date(`${iso}T00:00:00Z`).getUTCDay()),
  )

const day = (fecha: string, total: number, agents: number): DailyTrendPoint => ({
  fecha,
  total_calls: total,
  agent_answers: agents,
  machine_answers: 0,
  agent_answer_rate: agents / total,
})

describe('defaultWeekPair', () => {
  it('septiembre: S38 contra S39 (S40 es parcial)', () => {
    const pair = defaultWeekPair(buildWeekOptions(weekdaysOf(1, 30)))
    expect(pair?.a.label).toBe('Semana 38 (14–20/09)')
    expect(pair?.b.label).toBe('Semana 39 (21–27/09)')
  })

  it('con menos de dos semanas completas usa las dos últimas disponibles', () => {
    const pair = defaultWeekPair(buildWeekOptions(weekdaysOf(1, 15)))
    expect([pair?.a.start, pair?.b.start]).toEqual(['2026-09-07', '2026-09-14'])
    expect(defaultWeekPair(buildWeekOptions(weekdaysOf(14, 15)))).toBeNull()
  })
})

describe('weekMismatchNote', () => {
  it('solo avisa con semanas desparejas o parciales', () => {
    const weeks = buildWeekOptions(weekdaysOf(1, 30))
    const [s36, s37, s38] = weeks
    expect(weekMismatchNote(s37, s38)).toBeNull()
    expect(weekMismatchNote(s36, s37)).toBe(
      'La Semana 36 (31/08–06/09) tiene 4 días con datos y la Semana 37 (07–13/09), 5: los totales no son comparables; las tasas sí.',
    )
  })
})

describe('mergeDailyByWeekday', () => {
  it('alinea lunes con lunes, de lunes a viernes, aunque falte un día de un lado', () => {
    const merged = mergeDailyByWeekday(
      [day('2026-09-15', 2357, 92), day('2026-09-14', 3693, 263)],
      [day('2026-09-21', 1517, 155), day('2026-09-23', 1845, 170)],
    )
    expect(merged.map((p) => p.label)).toEqual(['Lun', 'Mar', 'Mié'])
    expect(merged[0]).toMatchObject({ fechaA: '2026-09-14', fechaB: '2026-09-21', totalA: 3693, totalB: 1517 })
    expect(merged[1]).toMatchObject({ fechaA: '2026-09-15', fechaB: null, totalB: 0, rateB: null })
    expect(merged[2]).toMatchObject({ fechaA: null, fechaB: '2026-09-23' })
    expect(merged[0].rateA).toBeCloseTo(7.12, 2)
  })

  it('la tabla deja vacío el lado que no tiene ese día', () => {
    const table = weekdayCompareRows(
      mergeDailyByWeekday([day('2026-09-14', 3693, 263)], [day('2026-09-22', 1716, 191)]),
    )
    expect(table.headers).toEqual(['Día', 'Fecha A', 'Llamadas A', 'Agent Answer A %', 'Fecha B', 'Llamadas B', 'Agent Answer B %'])
    expect(table.rows).toEqual([
      ['Lun', '2026-09-14', 3693, 7.12, null, null, null],
      ['Mar', null, null, null, '2026-09-22', 1716, 11.13],
    ])
  })
})
