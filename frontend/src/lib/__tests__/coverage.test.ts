import { describe, expect, it } from 'vitest'
import type { CampaignCatalogEntry } from '../../types/api'
import {
  buildCoverage,
  businessDays,
  coverageSummary,
  crossCoverageNotes,
  describeDays,
  rangeMissingDays,
} from '../coverage'

const SEPTEMBER = businessDays('2026-09-01', '2026-09-30')

function entry(campaign: string, dates: string[], segment = 'Galicia Empresas'): CampaignCatalogEntry {
  return {
    campaign,
    segment,
    first_day: dates[0],
    last_day: dates.at(-1)!,
    days: dates.length,
    total_calls: 1000,
    dates,
  }
}

describe('businessDays', () => {
  it('cuenta lunes a viernes: septiembre 2026 tiene 22', () => {
    expect(SEPTEMBER).toHaveLength(22)
    expect(SEPTEMBER.slice(0, 5)).toEqual([
      '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-07',
    ])
  })
})

describe('buildCoverage', () => {
  it('al día con las 4 campañas completas (estado real al 30/09)', () => {
    const coverage = buildCoverage(['35', '38', '91', '92'].map((c) => entry(c, SEPTEMBER)))
    expect(coverage.complete).toBe(true)
    expect(coverage.campaigns.every((item) => item.missing.length === 0 && !item.behind)).toBe(true)
    expect(coverageSummary(coverage)).toBe('Datos al día: 4 campañas del 01/09 al 30/09 (22 días hábiles).')
  })

  it('caso histórico: la 38 llegaba hasta el 15/09 y la 35 hasta el 30/09', () => {
    const coverage = buildCoverage([entry('35', SEPTEMBER), entry('38', SEPTEMBER.slice(0, 11))])
    const late = coverage.campaigns[1]
    expect(late.behind).toBe(true)
    expect(late.lastDay).toBe('2026-09-15')
    expect(late.missing).toHaveLength(11)
    expect(coverageSummary(coverage)).toBe('Cobertura incompleta: 38 llega hasta el 15/09.')
  })

  it('detecta un hueco en el medio e ignora los fines de semana', () => {
    const withGap = SEPTEMBER.filter((day) => day !== '2026-09-08')
    const coverage = buildCoverage([entry('35', SEPTEMBER), entry('92', withGap, 'Galicia Individuos')])
    expect(coverage.campaigns[1].missing).toEqual(['2026-09-08'])
    expect(coverage.campaigns[1].behind).toBe(false)
    expect(coverageSummary(coverage)).toBe('Cobertura incompleta: 92: falta el 08/09.')
  })

  it('atrasada y con huecos a la vez', () => {
    const dates = SEPTEMBER.slice(0, 11).filter((day) => !['2026-09-03', '2026-09-04'].includes(day))
    const coverage = buildCoverage([entry('35', SEPTEMBER), entry('38', dates)])
    expect(coverageSummary(coverage)).toBe(
      'Cobertura incompleta: 38 llega hasta el 15/09 · 38: faltan 03/09 y 04/09.',
    )
  })

  it('catálogo vacío', () => {
    const coverage = buildCoverage([])
    expect(coverage).toEqual({ firstDay: null, lastDay: null, complete: true, campaigns: [] })
    expect(coverageSummary(coverage)).toBe('No hay campañas cargadas.')
  })
})

describe('describeDays', () => {
  it('resume tramos seguidos y listas largas', () => {
    expect(describeDays(SEPTEMBER.slice(11))).toBe('16/09 → 30/09')
    expect(describeDays(['2026-09-08'])).toBe('08/09')
    expect(describeDays(['2026-09-08', '2026-09-10'])).toBe('08/09 y 10/09')
    expect(describeDays(['2026-09-01', '2026-09-08', '2026-09-10', '2026-09-22', '2026-09-24'])).toBe(
      '01/09, 08/09, 10/09 y 2 más',
    )
    expect(describeDays([])).toBe('')
  })
})

describe('rangeMissingDays y crossCoverageNotes', () => {
  it('lista los días hábiles del rango sin datos', () => {
    const late = entry('38', SEPTEMBER.slice(0, 11))
    expect(rangeMissingDays(late, '2026-09-14', '2026-09-18')).toEqual([
      '2026-09-16', '2026-09-17', '2026-09-18',
    ])
    expect(rangeMissingDays(late, '2026-09-05', '2026-09-06')).toEqual([])
  })

  it('avisa qué campaña cubre menos días del rango, en los dos sentidos', () => {
    const full = entry('35', SEPTEMBER)
    const late = entry('38', SEPTEMBER.slice(0, 11))
    expect(crossCoverageNotes(full, late, '2026-09-01', '2026-09-30')).toEqual([
      'La campaña 38 no tiene datos de 11 días hábiles del rango (16/09 → 30/09); sus totales cubren menos días que los de la 35.',
    ])
    expect(crossCoverageNotes(late, full, '2026-09-01', '2026-09-30')).toHaveLength(1)
    expect(crossCoverageNotes(full, late, '2026-09-01', '2026-09-15')).toEqual([])
  })

  it('un día que ninguna de las dos tiene no se cuenta', () => {
    const a = entry('35', SEPTEMBER.filter((day) => day !== '2026-09-08'))
    const b = entry('38', SEPTEMBER.filter((day) => day !== '2026-09-08'))
    expect(crossCoverageNotes(a, b, '2026-09-01', '2026-09-30')).toEqual([])
    const c = entry('38', SEPTEMBER.filter((day) => day !== '2026-09-09'))
    expect(crossCoverageNotes(a, c, '2026-09-01', '2026-09-30')).toEqual([
      'La campaña 35 no tiene datos de 1 día hábil del rango (08/09); sus totales cubren menos días que los de la 38.',
      'La campaña 38 no tiene datos de 1 día hábil del rango (09/09); sus totales cubren menos días que los de la 35.',
    ])
  })
})
