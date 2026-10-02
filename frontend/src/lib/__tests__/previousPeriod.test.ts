import { describe, expect, it } from 'vitest'
import type { CampaignSummary } from '../../types/api'
import { kpiDeltas, previousRange } from '../previousPeriod'

// Real totals of campaign 35: S38 (14–20/09) and S39 (21–27/09).
const S38: CampaignSummary = {
  campaign: '35', total_calls: 13517, agent_answers: 926, machine_answers: 6988, rejected_calls: 5603,
  agent_answer_rate: 926 / 13517, attendable_answer_rate: 926 / (13517 - 6988),
}
const S39: CampaignSummary = {
  campaign: '35', total_calls: 9451, agent_answers: 953, machine_answers: 4601, rejected_calls: 3897,
  agent_answer_rate: 953 / 9451, attendable_answer_rate: 953 / (9451 - 4601),
}

describe('previousRange', () => {
  it('una semana se compara con la semana anterior', () => {
    expect(previousRange('2026-09-21', '2026-09-27')).toEqual({ from: '2026-09-14', to: '2026-09-20' })
  })

  it('un rango, con el tramo del mismo largo justo antes, aunque cambie de mes', () => {
    expect(previousRange('2026-09-15', '2026-09-30')).toEqual({ from: '2026-08-30', to: '2026-09-14' })
    expect(previousRange('2026-09-01', '2026-09-30')).toEqual({ from: '2026-08-02', to: '2026-08-31' })
    expect(previousRange('2026-09-08', '2026-09-08')).toEqual({ from: '2026-09-07', to: '2026-09-07' })
  })
})

describe('kpiDeltas', () => {
  it('S39 contra S38: +3,23 pp de AA y −30,1% de llamadas', () => {
    const deltas = kpiDeltas(S39, S38)!
    expect(deltas.agentAnswerPp).toBeCloseTo(3.23, 2)
    expect(deltas.totalCallsPct).toBeCloseTo(-30.08, 2)
    expect(deltas.attendablePp).toBeCloseTo((953 / 4850 - 926 / 6529) * 100, 6)
    expect(deltas.machineSharePp).toBeCloseTo((4601 / 9451 - 6988 / 13517) * 100, 6)
    expect(deltas.rejectedSharePp).toBeCloseTo((3897 / 9451 - 5603 / 13517) * 100, 6)
  })

  it('sin datos del período anterior no hay variaciones', () => {
    expect(kpiDeltas(S39, null)).toBeNull()
    expect(kpiDeltas(S39, { ...S38, total_calls: 0, agent_answer_rate: null })).toBeNull()
  })

  it('una tasa nula deja nula solo su variación', () => {
    const deltas = kpiDeltas({ ...S39, attendable_answer_rate: null }, S38)!
    expect(deltas.attendablePp).toBeNull()
    expect(deltas.agentAnswerPp).not.toBeNull()
  })
})
