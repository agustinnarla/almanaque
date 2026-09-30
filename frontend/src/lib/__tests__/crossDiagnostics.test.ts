import { describe, expect, it } from 'vitest'
import {
  composeCrossNegatives,
  composeCrossPositives,
} from '../crossDiagnostics'
import type { DiagnosticEvent } from '../../types/api'

function make(type: string, entity = type): DiagnosticEvent {
  return { severity: 'INFO', type, entity, message: `${type} ${entity}` }
}

describe('composeCrossPositives', () => {
  it('reserva las tarjetas por campaña y completa con backend hasta el tope', () => {
    const composed = composeCrossPositives(
      [make('A'), make('B'), make('C'), make('D'), make('E')],
      [make('BEST_HOUR', '11 · 35'), make('BEST_DEVICE', 'IPLAN · 35')],
    )
    expect(composed).toHaveLength(5)
    expect(composed[0].type).toBe('A')
    expect(composed[1].type).toBe('B')
    expect(composed.map((event) => event.entity)).toEqual([
      'A',
      'B',
      'C',
      '11 · 35',
      'IPLAN · 35',
    ])
  })

  it('ordena los destacados por hora A, device A, hora B y device B', () => {
    const composed = composeCrossPositives([], [
      make('BEST_HOUR', '9 · 35'),
      make('BEST_DEVICE', 'IPLAN · 35'),
      make('BEST_HOUR', '9 · 38'),
      make('BEST_DEVICE', 'GW20 · 38'),
    ])
    expect(composed.map((event) => event.entity)).toEqual([
      '9 · 35',
      'IPLAN · 35',
      '9 · 38',
      'GW20 · 38',
    ])
  })

  it('descarta eventos nulos y devuelve solo el backend si no hay destacados', () => {
    const composed = composeCrossPositives([make('A')], [null, null])
    expect(composed).toEqual([make('A')])

    expect(composeCrossPositives([], [null])).toEqual([])
  })

  it('limita el total a POSITIVE_DRIVERS_MAX (5)', () => {
    const backend = Array.from({ length: 6 }, (_, index) =>
      make(`B${index}`),
    )
    const composed = composeCrossPositives(backend, [make('BEST_HOUR')])
    expect(composed).toHaveLength(5)
    expect(composed.at(-1)?.type).toBe('BEST_HOUR')
  })
})

describe('composeCrossNegatives', () => {
  it('reserva las causas por campaña y completa con backend hasta el tope', () => {
    const composed = composeCrossNegatives(
      [make('A'), make('B'), make('C'), make('D'), make('E')],
      [make('WORST_HOUR', '9 · 35'), make('WORST_DEVICE', 'GW37 · 35')],
    )
    expect(composed).toHaveLength(5)
    expect(composed.map((event) => event.entity)).toEqual([
      'A',
      'B',
      'C',
      '9 · 35',
      'GW37 · 35',
    ])
  })

  it('ordena los destacados por peor hora A, device A, peor hora B y device B', () => {
    const composed = composeCrossNegatives([], [
      make('WORST_HOUR', '9 · 35'),
      make('WORST_DEVICE', 'IPLAN · 35'),
      make('WORST_HOUR', '23 · 38'),
      make('WORST_DEVICE', 'GW20 · 38'),
    ])
    expect(composed.map((event) => event.entity)).toEqual([
      '9 · 35',
      'IPLAN · 35',
      '23 · 38',
      'GW20 · 38',
    ])
  })

  it('descarta eventos nulos y devuelve solo el backend si no hay destacados', () => {
    const composed = composeCrossNegatives([make('A')], [null, null])
    expect(composed).toEqual([make('A')])

    expect(composeCrossNegatives([], [null])).toEqual([])
  })

  it('limita el total a NEGATIVE_DRIVERS_MAX (5)', () => {
    const backend = Array.from({ length: 6 }, (_, index) =>
      make(`B${index}`),
    )
    const composed = composeCrossNegatives(backend, [make('WORST_HOUR')])
    expect(composed).toHaveLength(5)
    expect(composed.at(-1)?.type).toBe('WORST_HOUR')
  })
})
