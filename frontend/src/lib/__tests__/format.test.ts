import { describe, expect, it } from 'vitest'
import { formatDeltaPp, formatNumber, formatRatePct, formatScore } from '../format'

describe('formatRatePct', () => {
  it('formatea una fracción como porcentaje con 2 decimales o los pedidos', () => {
    expect(formatRatePct(0.0594)).toBe('5.94%')
    expect(formatRatePct(0)).toBe('0.00%')
    expect(formatRatePct(0.157, 1)).toBe('15.7%')
    expect(formatRatePct(null)).toBe('—')
    expect(formatRatePct(undefined)).toBe('—')
  })
})

describe('formatNumber', () => {
  it('usa separador de miles es-AR', () => {
    expect(formatNumber(35413)).toBe('35.413')
    expect(formatNumber(1000709)).toBe('1.000.709')
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(null)).toBe('—')
  })
})

describe('formatScore', () => {
  it('muestra el health score con 2 decimales', () => {
    expect(formatScore(-20.234)).toBe('-20.23')
    expect(formatScore(3.38)).toBe('3.38')
    expect(formatScore(null)).toBe('—')
  })
})

describe('formatDeltaPp', () => {
  it('convierte el delta a puntos porcentuales con signo tipográfico', () => {
    expect(formatDeltaPp(0.0123)).toBe('+1.23 pp')
    expect(formatDeltaPp(-0.0322)).toBe('−3.22 pp')
    expect(formatDeltaPp(0)).toBe('0.00 pp')
    expect(formatDeltaPp(null)).toBe('—')
  })
})
