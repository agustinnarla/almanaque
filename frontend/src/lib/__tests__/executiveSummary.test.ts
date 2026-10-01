import { describe, expect, it } from 'vitest'
import type { DiagnosticEvent, Recommendation, SummaryKpi } from '../../types/api'
import {
  compareSummaryItems,
  crossSummaryItems,
  firstSentence,
  rangeSummaryItems,
} from '../executiveSummary'

const cause: DiagnosticEvent = {
  severity: 'WARNING',
  type: 'WORST_HOUR',
  entity: '16',
  message: 'Peor hora del período: 16h con 4.91% de contacto humano.',
}
const strength: DiagnosticEvent = {
  severity: 'INFO',
  type: 'PEAK_WINDOW',
  entity: '9h–11h',
  message: 'Franja 9h–11h de contacto efectivo.',
}
const rec: Recommendation = {
  id: 'rec_gw_pacing',
  type: 'PACING',
  category: 'WARNING',
  entity: 'GW20',
  text: 'GW20 combina una tasa de 3.65% con línea ocupada del 48.34%. Recomendación: revisar el marcado.',
}

const summary91 = {
  campaign: '91',
  total_calls: 734207,
  agent_answers: 20327,
  machine_answers: 0,
  rejected_calls: 0,
  agent_answer_rate: 20327 / 734207,
}

function kpi(rateA: number, rateB: number): SummaryKpi {
  return {
    total_calls_a: 100,
    total_calls_b: 100,
    delta_total_pct: 0,
    agent_answer_rate_a: rateA,
    agent_answer_rate_b: rateB,
    delta_rate: rateB - rateA,
    delta_percentage: null,
    busy_rate_a: null,
    busy_rate_b: null,
    congestion_rate_a: null,
    congestion_rate_b: null,
    congestion_rate: null,
    health_score: null,
  }
}

describe('firstSentence', () => {
  it('corta en el primer punto final, no en los decimales', () => {
    expect(firstSentence(rec.text)).toBe(
      'GW20 combina una tasa de 3.65% con línea ocupada del 48.34%.',
    )
    expect(firstSentence('Sin punto final')).toBe('Sin punto final')
  })
})

describe('rangeSummaryItems', () => {
  it('compara contra el resto del segmento y arma las 4 líneas', () => {
    const items = rangeSummaryItems({
      summary: summary91,
      segment: 'Galicia Individuos',
      peers: [{ campaign: '92', total_calls: 1000709, agent_answers: 19716 }],
      rootCauses: [cause],
      positiveDrivers: [strength],
      recommendations: [rec],
    })
    expect(items.map((item) => item.kind)).toEqual([
      'context',
      'problem',
      'strength',
      'action',
    ])
    expect(items[0].text).toBe(
      'AA 2.77% sobre 734.207 llamadas · +0.80 pp vs el resto de Galicia Individuos (1.97%)',
    )
    expect(items[3].text).toBe(
      'GW20 combina una tasa de 3.65% con línea ocupada del 48.34%.',
    )
  })

  it('suma la línea «Cambio detectado» solo cuando hay un cambio de ruteo', () => {
    const base = { summary: summary91, segment: null, peers: [], rootCauses: [], positiveDrivers: [], recommendations: [] }
    const withChange = rangeSummaryItems({ ...base, routingChange: 'Desde el 2026-09-09 el 100% sale por IPLAN.' })
    expect(withChange.map((i) => i.kind)).toEqual(['context', 'change'])
    expect(withChange[1].label).toBe('Cambio detectado')
    expect(rangeSummaryItems(base).map((i) => i.kind)).toEqual(['context'])
  })

  it('omite la comparación sin otras campañas y las líneas sin datos', () => {
    const items = rangeSummaryItems({
      summary: summary91,
      segment: 'Galicia Individuos',
      peers: [],
      rootCauses: [],
      positiveDrivers: [],
      recommendations: [],
    })
    expect(items).toEqual([
      { kind: 'context', label: 'Contexto', text: 'AA 2.77% sobre 734.207 llamadas' },
    ])
  })
})

describe('compareSummaryItems y crossSummaryItems', () => {
  it('resume el cambio entre días y entre campañas del segmento', () => {
    const compare = compareSummaryItems({
      summary: kpi(0.0712, 0.039),
      dateA: '2026-09-14',
      dateB: '2026-09-15',
      rootCauses: [cause],
      positiveDrivers: [],
      recommendations: [],
    })
    expect(compare[0].text).toBe(
      'AA 7.12% → 3.90% (−3.22 pp) entre 2026-09-14 y 2026-09-15',
    )
    expect(compare.map((item) => item.kind)).toEqual(['context', 'problem'])

    const cross = crossSummaryItems({
      summary: kpi(0.0594, 0.0489),
      campaignA: '35',
      campaignB: '38',
      segment: 'Galicia Empresas',
      rootCauses: [],
      positiveDrivers: [strength],
      recommendations: [rec],
    })
    expect(cross[0].text).toBe(
      'Campaña 38 4.89% vs campaña 35 5.94% (−1.05 pp) · Galicia Empresas',
    )
    expect(cross.map((item) => item.kind)).toEqual(['context', 'strength', 'action'])
  })
})
