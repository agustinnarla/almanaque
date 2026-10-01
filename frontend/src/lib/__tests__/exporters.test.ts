import { describe, expect, it } from 'vitest'
import {
  basesCompareRows,
  basesRankingRows,
  crossRankingRows,
  dailyCompareRows,
  dailyRows,
  diagnosticRows,
  gatewaysCompareRows,
  gatewaysRangeRows,
  hourlyCompareRows,
  hourlyRows,
  kpiCompareRows,
  kpiRangeRows,
  patternComboRows,
  patternCompareComboRows,
  patternCompareDailyRows,
  patternDailyRows,
  recommendationRows,
  segmentRankingRows,
} from '../exporters'
import type { PatternCombo, PatternCompareCombo, PatternCompareDay, PatternDayCount } from '../patterns'
import type {
  CampaignSummary,
  DailyTrendPoint,
  DiagnosticEvent,
  HourlyTrendPoint,
  Recommendation,
  SummaryKpi,
} from '../../types/api'

const summary: CampaignSummary = {
  campaign: '35',
  total_calls: 263198,
  agent_answers: 35413,
  machine_answers: 200000,
  rejected_calls: 27785,
  agent_answer_rate: 0.0594,
}

const kpi: SummaryKpi = {
  total_calls_a: 1000,
  total_calls_b: 1200,
  delta_total_pct: 20,
  agent_answer_rate_a: 0.0594,
  agent_answer_rate_b: 0.073,
  delta_rate: 0.0136,
  delta_percentage: 22.9,
  busy_rate_a: 0.1,
  busy_rate_b: 0.105,
  congestion_rate_a: 0.01,
  congestion_rate_b: 0.011,
  congestion_rate: 0.011,
  health_score: 82.5,
}

function day(fecha: string, rate: number | null, total = 100): DailyTrendPoint {
  return {
    fecha,
    total_calls: total,
    agent_answers: 10,
    machine_answers: 5,
    agent_answer_rate: rate,
  }
}

function hour(hora: number, rate: number | null, total = 50): HourlyTrendPoint {
  return {
    hora,
    total_calls: total,
    agent_answers: 5,
    machine_answers: 3,
    agent_answer_rate: rate,
  }
}

describe('kpiRangeRows', () => {
  it('exporta encabezados en español y tasas con 2 decimales', () => {
    const table = kpiRangeRows(summary)
    expect(table.headers).toEqual(['Métrica', 'Valor'])
    expect(table.rows).toEqual([
      ['Total de llamadas', 263198],
      ['Respuestas de agente', 35413],
      ['Agent Answer %', 5.94],
      ['Contestadores %', 75.99],
      ['No contesta / fallidas', 27785],
      ['No contesta %', 10.56],
    ])
  })

  it('devuelve null en shares cuando total_calls es 0', () => {
    const table = kpiRangeRows({ ...summary, total_calls: 0 })
    expect(table.rows[3][1]).toBeNull()
    expect(table.rows[5][1]).toBeNull()
  })
})

describe('kpiCompareRows', () => {
  it('arma columnas Valor A / Valor B / Delta', () => {
    const table = kpiCompareRows(kpi)
    expect(table.headers).toEqual(['Métrica', 'Valor A', 'Valor B', 'Delta'])
    expect(table.rows[1]).toEqual(['Agent Answer %', 5.94, 7.3, 22.9])
    expect(table.rows[3]).toEqual(['Congestión %', 1, 1.1, 0.1])
    expect(table.rows[4]).toEqual(['Health score (B)', null, 82.5, null])
  })

  it('propaga nulos como celda vacía', () => {
    const table = kpiCompareRows({ ...kpi, health_score: null })
    expect(table.rows[4]).toEqual(['Health score (B)', null, null, null])
  })
})

describe('diagnosticRows', () => {
  it('etiqueta polaridad negativa y positiva en el mismo listado', () => {
    const root: DiagnosticEvent[] = [
      { severity: 'CRITICAL', type: 'T', entity: 'E1', message: 'm1' },
    ]
    const positive: DiagnosticEvent[] = [
      { severity: 'SUCCESS', type: 'T2', entity: 'E2', message: 'm2' },
    ]
    const table = diagnosticRows(root, positive)
    expect(table.headers).toEqual([
      'Polaridad',
      'Severidad',
      'Tipo',
      'Entidad',
      'Mensaje',
    ])
    expect(table.rows).toHaveLength(2)
    expect(table.rows[0][0]).toBe('Negativa')
    expect(table.rows[1][0]).toBe('Positiva')
  })
})

describe('recommendationRows', () => {
  it('concatena excluded_amd y deja vacío cuando no hay', () => {
    const recs: Recommendation[] = [
      {
        id: 'r1',
        type: 'PACING',
        category: 'WARNING',
        entity: 'GW20',
        text: 'Bajar el marcado simultáneo.',
        excluded_amd: ['AMD1', 'AMD2'],
      },
      {
        id: 'r2',
        type: 'SCHEDULE',
        category: 'INFO',
        entity: '9',
        text: 'Reforzar la franja 9hs.',
      },
    ]
    const table = recommendationRows(recs)
    expect(table.rows[0][4]).toBe('AMD1, AMD2')
    expect(table.rows[1][4]).toBe('')
  })
})

describe('dailyRows / hourlyRows', () => {
  it('convierte la tasa a porcentaje con 2 decimales', () => {
    const daily = dailyRows([day('2026-09-01', 0.0594)])
    expect(daily.headers).toEqual([
      'Fecha',
      'Llamadas',
      'Agentes',
      'Automáticos',
      'Agent Answer %',
    ])
    expect(daily.rows[0]).toEqual(['2026-09-01', 100, 10, 5, 5.94])

    const hourly = hourlyRows([hour(9, null)])
    expect(hourly.rows[0]).toEqual([9, 50, 5, 3, null])
  })
})

describe('dailyCompareRows / hourlyCompareRows', () => {
  it('mergea por fecha con columnas A y B', () => {
    const table = dailyCompareRows(
      [day('2026-09-01', 0.05), day('2026-09-02', 0.06)],
      [day('2026-09-02', 0.07), day('2026-09-03', 0.08)],
    )
    expect(table.headers).toEqual([
      'Fecha',
      'Llamadas A',
      'Llamadas B',
      'Agent Answer A %',
      'Agent Answer B %',
    ])
    expect(table.rows).toEqual([
      ['2026-09-01', 100, null, 5, null],
      ['2026-09-02', 100, 100, 6, 7],
      ['2026-09-03', null, 100, null, 8],
    ])
  })

  it('mergea por hora y ordena de forma ascendente', () => {
    const table = hourlyCompareRows([hour(15, 0.1), hour(9, 0.2)], [hour(9, 0.3)])
    expect(table.rows).toEqual([
      [9, 50, 50, 20, 30],
      [15, 50, null, 10, null],
    ])
  })
})

describe('gatewaysRangeRows', () => {
  it('exporta tasas de dispositivo en porcentaje', () => {
    const table = gatewaysRangeRows([
      {
        device: 'GW20',
        total_calls: 1000,
        agent_answers: 60,
        machine_answers: 900,
        busy_calls: 30,
        congestion_calls: 10,
        agent_answer_rate: 0.06,
        busy_rate: 0.03,
        congestion_rate: 0.01,
      },
    ])
    expect(table.headers[0]).toBe('Dispositivo')
    expect(table.rows[0]).toEqual([
      'GW20',
      1000,
      60,
      900,
      30,
      10,
      6,
      3,
      1,
    ])
  })
})

describe('gatewaysCompareRows / basesCompareRows', () => {
  it('expresa deltas en puntos porcentuales', () => {
    const gateways = gatewaysCompareRows([
      {
        device: 'GW1',
        congestion_rate_a: 0.01,
        congestion_rate_b: 0.0125,
        delta_congestion: 0.0025,
      },
    ])
    expect(gateways.rows[0]).toEqual(['GW1', 1, 1.25, 0.25])

    const bases = basesCompareRows([
      {
        base: 'Base 34',
        total_calls_a: 500,
        total_calls_b: 400,
        agent_answer_rate_a: 0.08,
        agent_answer_rate_b: 0.06,
        delta_rate: -0.02,
        share_a: 0.5,
        share_b: 0.4,
        share_delta: -0.1,
        relative_change_pct: -20,
      },
    ])
    expect(bases.rows[0]).toEqual([
      'Base 34',
      500,
      400,
      8,
      6,
      -2,
      50,
      40,
      -10,
      -20,
    ])
  })
})

describe('basesRankingRows', () => {
  it('numera el ranking, incluye intentos y expresa AA en porcentaje', () => {
    const table = basesRankingRows([
      { base: '34', agent_answer_rate: 0.4495, total_calls: 198 },
      { base: '80', agent_answer_rate: 0.057, total_calls: 35198 },
    ])
    expect(table.headers).toEqual(['Rank', 'Base', 'Intentos', 'Agent Answer %'])
    expect(table.rows).toEqual([
      ['#1', '34', 198, 44.95],
      ['#2', '80', 35198, 5.7],
    ])
  })

  it('marca como «Pocos intentos» las bases que no compiten', () => {
    const table = basesRankingRows([
      { base: '5', agent_answer_rate: 0.0655, total_calls: 17135, ranked: true },
      { base: '27', agent_answer_rate: 1, total_calls: 1, ranked: false },
    ])
    expect(table.rows.map((row) => row[0])).toEqual(['#1', 'Pocos intentos'])
  })
})

describe('segmentRankingRows', () => {
  it('apila mejores y peores con su posición', () => {
    const table = segmentRankingRows('Dispositivos', {
      min_calls_applied: 50,
      limit_applied: 5,
      best: [
        {
          device: 'IPLAN',
          total_calls: 16625,
          agent_answer_rate: 0.0719,
          busy_rate: 0.0256,
          congestion_rate: 0.0168,
          health_score: 3.38,
        },
      ],
      worst: [
        {
          device: 'GW37',
          total_calls: 900,
          agent_answer_rate: 0.03,
          busy_rate: 0.4,
          congestion_rate: 0.05,
          health_score: -25.67,
        },
      ],
    })
    expect(table.headers[0]).toBe('Dispositivos')
    expect(table.rows).toEqual([
      ['Mejor', 'IPLAN', 16625, 7.19, 2.56, 1.68, 3.38],
      ['Peor', 'GW37', 900, 3, 40, 5, -25.67],
    ])
  })

  it('usa hora cuando el item no trae device', () => {
    const table = segmentRankingRows('Horas', {
      min_calls_applied: 50,
      limit_applied: 5,
      best: [
        {
          hora: 16,
          total_calls: 2446,
          agent_answer_rate: 0.049,
          busy_rate: 0.158,
          congestion_rate: 0.005,
          health_score: -3.72,
        },
      ],
      worst: [],
    })
    expect(table.rows[0][1]).toBe('16')
  })
})

describe('patternDailyRows / patternComboRows', () => {
  it('exporta días y combinaciones con peor tasa en %', () => {
    const days: PatternDayCount[] = [{ fecha: '2026-09-01', alerts: 36 }]
    expect(patternDailyRows(days)).toEqual({
      headers: ['Fecha', 'Alertas'],
      rows: [['2026-09-01', 36]],
    })

    const combos: PatternCombo[] = [
      { base: '80', device: 'GW20', alerts: 36, worstRate: 0 },
    ]
    expect(patternComboRows(combos)).toEqual({
      headers: ['Base', 'Dispositivo', 'Alertas', 'Peor Agent Answer %'],
      rows: [['80', 'GW20', 36, 0]],
    })
  })
})

describe('crossRankingRows', () => {
  it('arma columnas de intentos A/B y delta sin health para bases', () => {
    const table = crossRankingRows('base', [
      {
        key: '34',
        rateA: 0.4495,
        rateB: 0.5158,
        delta: 6.63,
        healthA: null,
        healthB: null,
        attemptsA: 1000,
        attemptsB: 900,
      },
      {
        key: '0',
        rateA: null,
        rateB: 0.7,
        delta: null,
        healthA: null,
        healthB: null,
        attemptsA: null,
        attemptsB: 700,
      },
    ])
    expect(table.headers).toEqual([
      'Base',
      'Intentos A',
      'Agent Answer A %',
      'Intentos B',
      'Agent Answer B %',
      'Delta pp',
    ])
    expect(table.rows).toEqual([
      ['34', 1000, 44.95, 900, 51.58, 6.63],
      ['0', null, null, 700, 70, null],
    ])
  })

  it('agrega columnas de health para dispositivos', () => {
    const table = crossRankingRows('device', [
      {
        key: 'IPLAN',
        rateA: 0.0719,
        rateB: 0.07,
        delta: -0.19,
        healthA: 3.38,
        healthB: 1.65,
        attemptsA: 16625,
        attemptsB: 114708,
      },
    ])
    expect(table.headers).toEqual([
      'Dispositivo',
      'Intentos A',
      'Agent Answer A %',
      'Health A',
      'Intentos B',
      'Agent Answer B %',
      'Health B',
      'Delta pp',
    ])
    expect(table.rows).toEqual([
      ['IPLAN', 16625, 7.19, 3.38, 114708, 7, 1.65, -0.19],
    ])
  })

  it('usa el encabezado de hora cuando kind es hour', () => {
    const table = crossRankingRows('hour', [
      {
        key: '16',
        rateA: 0.05,
        rateB: 0.06,
        delta: 1,
        healthA: -4,
        healthB: -3,
        attemptsA: 100,
        attemptsB: 200,
      },
    ])
    expect(table.headers[0]).toBe('Hora')
    expect(table.rows[0]).toEqual(['16', 100, 5, -4, 200, 6, -3, 1])
  })
})

describe('patternCompareDailyRows / patternCompareComboRows', () => {
  it('exporta días y combinaciones comparadas con conteos A y B', () => {
    const days: PatternCompareDay[] = [
      { fecha: '2026-09-01', alertsA: 36, alertsB: 12 },
    ]
    expect(patternCompareDailyRows(days)).toEqual({
      headers: ['Fecha', 'Alertas A', 'Alertas B'],
      rows: [['2026-09-01', 36, 12]],
    })

    const combos: PatternCompareCombo[] = [
      {
        base: '80',
        device: 'GW20',
        alertsA: 36,
        alertsB: 12,
        total: 48,
        worstRateA: 0,
        worstRateB: 0.02,
      },
    ]
    expect(patternCompareComboRows(combos)).toEqual({
      headers: ['Base', 'Dispositivo', 'Alertas A', 'Alertas B', 'Total'],
      rows: [['80', 'GW20', 36, 12, 48]],
    })
  })
})
