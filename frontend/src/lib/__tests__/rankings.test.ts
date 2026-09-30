import { describe, expect, it } from 'vitest'
import { mergeBaseRankings, mergeSegmentRankings } from '../rankings'
import type { SegmentRankingItem, SegmentRankingResponse } from '../../types/api'

function segment(
  device: string,
  health: number,
  rate: number,
): SegmentRankingItem {
  return {
    total_calls: 100,
    agent_answer_rate: rate,
    busy_rate: 0.1,
    congestion_rate: 0.01,
    health_score: health,
    device,
  }
}

function response(
  best: SegmentRankingItem[],
  worst: SegmentRankingItem[],
): SegmentRankingResponse {
  return { min_calls_applied: 50, limit_applied: 5, best, worst }
}

describe('mergeBaseRankings', () => {
  it('une bases de ambas campañas con delta en puntos porcentuales', () => {
    const rows = mergeBaseRankings(
      [
        { base: '34', agent_answer_rate: 0.4495, total_calls: 198 },
        { base: '76', agent_answer_rate: 0.4118, total_calls: 17 },
      ],
      [
        { base: '34', agent_answer_rate: 0.5158, total_calls: 240 },
        { base: '0', agent_answer_rate: 0.7, total_calls: 50 },
      ],
    )
    expect(rows.map((row) => row.key)).toEqual(['0', '34', '76'])

    const base34 = rows.find((row) => row.key === '34')
    expect(base34?.delta).toBeCloseTo(6.63, 2)
    expect(base34?.attemptsA).toBe(198)
    expect(base34?.attemptsB).toBe(240)

    const base0 = rows.find((row) => row.key === '0')
    expect(base0?.rateA).toBeNull()
    expect(base0?.rateB).toBe(0.7)
    expect(base0?.attemptsA).toBeNull()
    expect(base0?.attemptsB).toBe(50)

    const base76 = rows.find((row) => row.key === '76')
    expect(base76?.rateB).toBeNull()
    expect(base76?.attemptsB).toBeNull()
    expect(base76?.delta).toBeNull()
  })

  it('devuelve vacío cuando ninguna campaña tiene bases', () => {
    expect(mergeBaseRankings([], [])).toEqual([])
  })
})

describe('mergeSegmentRankings', () => {
  it('une best y worst sin duplicar y ordena por health promedio desc', () => {
    const campaignA = response(
      [segment('IPLAN', 3.38, 0.0719)],
      [segment('GW37', -25.67, 0.03)],
    )
    const campaignB = response(
      [segment('IPLAN', 1.65, 0.07)],
      [segment('GW37', -35.33, 0.02)],
    )
    const rows = mergeSegmentRankings(campaignA, campaignB, 'device')
    expect(rows.map((row) => row.key)).toEqual(['IPLAN', 'GW37'])
    expect(rows[0].healthA).toBe(3.38)
    expect(rows[0].healthB).toBe(1.65)
    expect(rows[1].healthA).toBe(-25.67)
    expect(rows[1].healthB).toBe(-35.33)
    expect(rows[1].delta).toBeCloseTo(-1, 2)
    expect(rows[0].attemptsA).toBe(100)
    expect(rows[0].attemptsB).toBe(100)
  })

  it('marca null en la campaña que no tiene el segmento', () => {
    const campaignA = response([segment('IPLAN', 3.38, 0.0719)], [])
    const rows = mergeSegmentRankings(campaignA, null, 'device')
    expect(rows).toHaveLength(1)
    expect(rows[0].rateB).toBeNull()
    expect(rows[0].healthB).toBeNull()
    expect(rows[0].attemptsB).toBeNull()
    expect(rows[0].delta).toBeNull()
  })

  it('usa hora como clave cuando kind es hour', () => {
    const hours: SegmentRankingItem = {
      total_calls: 90,
      agent_answer_rate: 0.05,
      busy_rate: 0.2,
      congestion_rate: 0.01,
      health_score: -12,
      hora: 16,
    }
    const rows = mergeSegmentRankings(
      response([hours], []),
      response([{ ...hours, health_score: -4 }], []),
      'hour',
    )
    expect(rows.map((row) => row.key)).toEqual(['16'])
    expect(rows[0].healthA).toBe(-12)
    expect(rows[0].healthB).toBe(-4)
  })

  it('devuelve vacío cuando ambas campañas están vacías', () => {
    expect(mergeSegmentRankings(null, null, 'device')).toEqual([])
    expect(
      mergeSegmentRankings(response([], []), response([], []), 'device'),
    ).toEqual([])
  })
})
