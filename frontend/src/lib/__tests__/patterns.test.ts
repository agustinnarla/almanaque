import { describe, expect, it } from 'vitest'
import {
  campaignThreshold,
  comparePatternSummaries,
  summarizePatterns,
  thresholdLabel,
} from '../patterns'
import type { PatternAlert } from '../../types/api'

function alert(
  fecha: string,
  base: string,
  device: string,
  rate: number | null,
  campaign = '35',
): PatternAlert {
  return {
    fecha,
    hora: 9,
    campaign,
    base,
    device,
    agent_answer_rate: rate,
    pattern_alert: true,
  }
}

describe('summarizePatterns', () => {
  it('filtra las alertas de otras campañas', () => {
    const summary = summarizePatterns(
      [
        alert('2026-09-01', '80', 'GW20', 0),
        alert('2026-09-01', '80', 'GW20', 0, '38'),
      ],
      '35',
    )
    expect(summary.byDay).toEqual([{ fecha: '2026-09-01', alerts: 1 }])
    expect(summary.topCombos).toHaveLength(1)
    expect(summary.topCombos[0].alerts).toBe(1)
  })

  it('agrupa por día y ordena fechas de forma ascendente', () => {
    const summary = summarizePatterns(
      [
        alert('2026-09-15', '80', 'GW20', 0),
        alert('2026-09-01', '80', 'GW20', 0),
        alert('2026-09-01', '76', 'GW37', 0),
        alert('2026-09-04', '80', 'GW20', 0),
      ],
      '35',
    )
    expect(summary.byDay).toEqual([
      { fecha: '2026-09-01', alerts: 2 },
      { fecha: '2026-09-04', alerts: 1 },
      { fecha: '2026-09-15', alerts: 1 },
    ])
  })

  it('ordena combinaciones por cantidad desc y recorta a 5', () => {
    const alerts: PatternAlert[] = []
    for (let i = 0; i < 6; i += 1) {
      for (let n = 0; n < 6 - i; n += 1) {
        alerts.push(alert('2026-09-01', `base${i}`, 'GW20', 0))
      }
    }
    const summary = summarizePatterns(alerts, '35')
    expect(summary.topCombos).toHaveLength(5)
    expect(summary.topCombos.map((combo) => combo.alerts)).toEqual([6, 5, 4, 3, 2])
    expect(summary.topCombos[0].base).toBe('base0')
  })

  it('rompe empates por peor tasa (asc)', () => {
    const summary = summarizePatterns(
      [
        alert('2026-09-01', 'A', 'GW1', 0.03),
        alert('2026-09-01', 'B', 'GW2', 0.01),
        alert('2026-09-02', 'A', 'GW1', 0.04),
        alert('2026-09-02', 'B', 'GW2', 0.05),
      ],
      '35',
    )
    expect(summary.topCombos[0]).toEqual({
      base: 'B',
      device: 'GW2',
      alerts: 2,
      worstRate: 0.01,
    })
    expect(summary.topCombos[1].worstRate).toBe(0.03)
  })

  it('conserva la peor tasa de la combinación', () => {
    const summary = summarizePatterns(
      [
        alert('2026-09-01', '80', 'GW20', 0.04),
        alert('2026-09-02', '80', 'GW20', 0.02),
        alert('2026-09-03', '80', 'GW20', null),
      ],
      '35',
    )
    expect(summary.topCombos[0].worstRate).toBe(0.02)
    expect(summary.topCombos[0].alerts).toBe(3)
  })

  it('devuelve listas vacías cuando no hay alertas de la campaña', () => {
    const summary = summarizePatterns([alert('2026-09-01', '80', 'GW20', 0, '38')], '35')
    expect(summary.byDay).toEqual([])
    expect(summary.topCombos).toEqual([])
  })
})

describe('comparePatternSummaries', () => {
  it('une las fechas de ambas campañas con conteos por lado', () => {
    const result = comparePatternSummaries(
      [
        alert('2026-09-01', '80', 'GW20', 0, '35'),
        alert('2026-09-01', '80', 'GW20', 0, '35'),
        alert('2026-09-02', '34', 'IPLAN', 0.01, '38'),
        alert('2026-09-01', '99', 'GW99', 0, '99'),
      ],
      '35',
      '38',
    )
    expect(result.byDay).toEqual([
      { fecha: '2026-09-01', alertsA: 2, alertsB: 0 },
      { fecha: '2026-09-02', alertsA: 0, alertsB: 1 },
    ])
  })

  it('fusiona combinaciones por total desc y recorta a 5', () => {
    const alerts: PatternAlert[] = []
    for (let i = 0; i < 6; i += 1) {
      for (let n = 0; n < 6 - i; n += 1) {
        alerts.push(alert('2026-09-01', `base${i}`, 'GW20', 0, '35'))
      }
      alerts.push(alert('2026-09-01', `base${i}`, 'GW20', 0.01, '38'))
    }
    const result = comparePatternSummaries(alerts, '35', '38')
    expect(result.combos).toHaveLength(5)
    expect(result.combos[0].base).toBe('base0')
    expect(result.combos[0].alertsA).toBe(6)
    expect(result.combos[0].alertsB).toBe(1)
    expect(result.combos[0].total).toBe(7)
    expect(result.combos[4].base).toBe('base4')
  })

  it('marca 0/total y peor tasa por lado en la combinación', () => {
    const result = comparePatternSummaries(
      [
        alert('2026-09-01', '80', 'GW20', 0.03, '35'),
        alert('2026-09-01', '80', 'GW20', 0.02, '38'),
        alert('2026-09-01', '80', 'GW20', 0.01, '38'),
      ],
      '35',
      '38',
    )
    expect(result.combos[0]).toMatchObject({
      base: '80',
      device: 'GW20',
      alertsA: 1,
      alertsB: 2,
      total: 3,
      worstRateA: 0.03,
      worstRateB: 0.01,
    })
  })

  it('devuelve vacío cuando ninguna campaña tiene alertas', () => {
    const result = comparePatternSummaries(
      [alert('2026-09-01', '80', 'GW20', 0, '99')],
      '35',
      '38',
    )
    expect(result.byDay).toEqual([])
    expect(result.combos).toEqual([])
  })
})

describe('campaignThreshold', () => {
  it('lee el umbral y el promedio de las alertas de la campaña pedida', () => {
    const alerts: PatternAlert[] = [
      { ...alert('2026-09-01', '80', 'GW20', 0.02, '38'), threshold_rate: 0.0293, campaign_rate: 0.0489 },
      { ...alert('2026-09-01', '80', 'GW20', 0.01), threshold_rate: 0.0356, campaign_rate: 0.0594 },
    ]
    const threshold = campaignThreshold(alerts, '35')
    expect(threshold).toEqual({ threshold: 0.0356, average: 0.0594 })
    expect(thresholdLabel('35', threshold!)).toBe(
      'Umbral de la campaña 35: AA menor a 3.56% (60% del promedio de 5.94%)',
    )
    expect(campaignThreshold(alerts, '91')).toBeNull()
    expect(campaignThreshold([alert('2026-09-01', '80', 'GW20', 0)], '35')).toBeNull()
  })
})
