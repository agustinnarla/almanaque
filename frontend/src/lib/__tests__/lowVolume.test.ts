import { describe, expect, it } from 'vitest'
import { lowVolumeDays } from '../lowVolume'

const day = (fecha: string, total_calls: number) => ({ fecha, total_calls })

describe('lowVolumeDays', () => {
  it('marca los días bajo el 50% de la mediana (campaña 35, 01→30/09: solo el 18/09)', () => {
    // Real daily volume of campaign 35 (22 days, median 2.618).
    const points = [
      ['09-01', 3280], ['09-02', 1903], ['09-03', 2678], ['09-04', 4453], ['09-07', 4359],
      ['09-08', 3402], ['09-09', 3329], ['09-10', 3401], ['09-11', 2558], ['09-14', 3693],
      ['09-15', 2357], ['09-16', 3318], ['09-17', 2998], ['09-18', 1151], ['09-21', 1517],
      ['09-22', 1716], ['09-23', 1845], ['09-24', 1853], ['09-25', 2520], ['09-28', 4700],
      ['09-29', 1403], ['09-30', 1831],
    ].map(([date, calls]) => day(`2026-${date}`, Number(calls)))
    const result = lowVolumeDays(points)
    expect(result.median).toBe(2618)
    expect([...result.days]).toEqual(['2026-09-18'])
  })

  it('usa el promedio de los dos del medio con cantidad par de días', () => {
    const result = lowVolumeDays([day('a', 100), day('b', 1000), day('c', 1200), day('d', 2000)])
    expect(result.median).toBe(1100)
    expect([...result.days]).toEqual(['a'])
  })

  it('con menos de 3 días no marca ninguno', () => {
    const result = lowVolumeDays([day('a', 10), day('b', 1000)])
    expect(result.median).toBe(505)
    expect(result.days.size).toBe(0)
  })

  it('sin días devuelve mediana 0 y ninguno marcado', () => {
    expect(lowVolumeDays([])).toEqual({ median: 0, days: new Set() })
  })
})
