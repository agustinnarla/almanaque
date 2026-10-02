import { describe, expect, it } from 'vitest'
import type {
  DailyTrendPoint,
  DeviceRangeRow,
  HourlyTrendPoint,
  PeakHour,
  RangeDiagnosticsResponse,
} from '../../types/api'
import {
  buildBestDay,
  buildBestDevice,
  buildBestHour,
  buildReliableTrunk,
  buildWorstDevice,
  buildWorstHour,
  mapRangeDiagnostics,
  mergePeakWindows,
  rankPositiveDrivers,
} from '../rangeDiagnostics'
import {
  BEST_DEVICE_MIN_CALLS,
  BEST_HOUR_MIN_CALLS,
  NEGATIVE_DRIVERS_MAX,
  PEAK_WINDOW_MIN_RATE,
  POSITIVE_DRIVERS_MAX,
  TRUNK_MAX_BUSY,
} from '../rangeThresholds'

function peak(
  hora: number,
  rate: number,
  total = 1000,
  message = `Hora ${hora}`,
): PeakHour {
  return {
    hora,
    total_calls: total,
    agent_answer_rate: rate,
    health_score: 1,
    message,
  }
}

function device(
  name: string,
  total: number,
  agents: number,
  machines: number,
  congestion: number | null,
  busy: number | null,
): DeviceRangeRow {
  return {
    device: name,
    total_calls: total,
    agent_answers: agents,
    machine_answers: machines,
    busy_calls: Math.round((busy ?? 0) * total),
    congestion_calls: Math.round((congestion ?? 0) * total),
    agent_answer_rate: total > 0 ? agents / total : null,
    attendable_answer_rate: total - machines > 0 ? agents / (total - machines) : null,
    busy_rate: busy,
    congestion_rate: congestion,
  }
}

function day(
  fecha: string,
  rate: number | null,
  total = 1000,
  agents = 50,
): DailyTrendPoint {
  return {
    fecha,
    total_calls: total,
    agent_answers: agents,
    machine_answers: 10,
    agent_answer_rate: rate,
  }
}

function hour(
  hora: number,
  rate: number | null,
  total = 1000,
  agents = 50,
): HourlyTrendPoint {
  return {
    hora,
    total_calls: total,
    agent_answers: agents,
    machine_answers: 10,
    agent_answer_rate: rate,
  }
}

describe('mergePeakWindows', () => {
  it('fusiona horas consecutivas en PEAK_WINDOW con tasa ponderada', () => {
    const events = mergePeakWindows([
      peak(9, 0.069, 4378),
      peak(10, 0.0693, 4978),
      peak(11, 0.0709, 5161),
    ])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('PEAK_WINDOW')
    expect(events[0].entity).toBe('9h–11h')
    const weighted =
      (0.069 * 4378 + 0.0693 * 4978 + 0.0709 * 5161) / (4378 + 4978 + 5161)
    expect(events[0].message).toContain(`${(weighted * 100).toFixed(2)}%`)
    expect(events[0].message).toContain(String(4378 + 4978 + 5161))
  })

  it('conserva hora aislada >= umbral como PEAK_HOUR', () => {
    const events = mergePeakWindows([
      peak(9, 0.07, 1000, 'msg-9'),
      peak(12, 0.05, 1000, 'msg-12'),
    ])
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('PEAK_HOUR')
    expect(events[0].entity).toBe('9')
    expect(events[0].message).toBe('msg-9')
  })

  it('no fusiona horas no consecutivas', () => {
    const events = mergePeakWindows([
      peak(9, 0.07),
      peak(11, 0.07),
    ])
    expect(events.map((e) => e.type)).toEqual(['PEAK_HOUR', 'PEAK_HOUR'])
    expect(events.map((e) => e.entity)).toEqual(['9', '11'])
  })

  it('ignora horas bajo el umbral de ventana', () => {
    const under = PEAK_WINDOW_MIN_RATE - 0.001
    const events = mergePeakWindows([
      peak(9, PEAK_WINDOW_MIN_RATE),
      peak(10, under),
      peak(11, PEAK_WINDOW_MIN_RATE),
    ])
    expect(events.every((e) => e.type === 'PEAK_HOUR')).toBe(true)
    expect(events).toHaveLength(2)
  })

  it('devuelve vacío sin picos aptos', () => {
    expect(mergePeakWindows([])).toEqual([])
    expect(mergePeakWindows([peak(9, 0.01)])).toEqual([])
  })
})

describe('buildReliableTrunk', () => {
  const campaign35Devices = [
    device('GW37', 6050, 362, 1085, 0.12, 0.27),
    device('IPLAN2', 1560, 55, 313, 0.066, 0.15),
    device('GW39', 5560, 287, 917, 0.035, 0.30016),
    device('GW20', 5590, 205, 591, 0.02, 0.483),
    device('IPLAN', 16653, 1195, 8376, 0.017, 0.026),
  ]
  const total = campaign35Devices.reduce((s, d) => s + d.total_calls, 0)

  it('elige GW39 como unico candidato en campana 35', () => {
    const event = buildReliableTrunk(campaign35Devices, total)
    expect(event).not.toBeNull()
    expect(event!.type).toBe('RELIABLE_TRUNK')
    expect(event!.entity).toBe('GW39')
    expect(event!.severity).toBe('SUCCESS')
    expect(event!.message).toContain('GW39')
  })

  it('descarta troncales con desbalance AMD severo', () => {
    const onlyAmd = [device('IPLAN', 10000, 100, 400, 0.01, 0.05)]
    expect(buildReliableTrunk(onlyAmd, 10000)).toBeNull()
  })

  it('descarta busy por encima del umbral', () => {
    const tooBusy = [device('GW20', 5000, 200, 500, 0.01, 0.48)]
    expect(buildReliableTrunk(tooBusy, 5000)).toBeNull()
    expect(TRUNK_MAX_BUSY).toBe(0.31)
  })

  it('elige menor congestion con empate por share', () => {
    const tied = [
      device('GWA', 3000, 100, 100, 0.02, 0.1),
      device('GWB', 2000, 100, 100, 0.02, 0.1),
    ]
    const event = buildReliableTrunk(tied, 5000)
    expect(event!.entity).toBe('GWA')
  })

  it('devuelve null sin candidatos o total invalido', () => {
    expect(buildReliableTrunk([], 0)).toBeNull()
    expect(
      buildReliableTrunk([device('GW', 100, 10, 0, 0.2, 0.1)], 100),
    ).toBeNull()
  })
})

describe('buildBestDay', () => {
  it('elige el dia con mayor tasa que supera min_calls', () => {
    const event = buildBestDay([
      day('2026-09-01', 0.09, 100, 9),
      day('2026-09-11', 0.085, 2558, 218),
      day('2026-09-02', 0.95, 10, 9),
    ])
    expect(event!.entity).toBe('2026-09-01')
    expect(event!.type).toBe('BEST_DAY')
  })

  it('usa campaign real 2026-09-11 cuando aplica', () => {
    const event = buildBestDay([
      day('2026-09-01', 0.0576, 3000, 173),
      day('2026-09-11', 0.0852, 2558, 218),
    ])
    expect(event!.entity).toBe('2026-09-11')
    expect(event!.message).toContain('8.52%')
  })

  it('excluye el día de poco volumen (campaña 35, 14→18/09 reales)', () => {
    const event = buildBestDay([
      day('2026-09-14', 263 / 3693, 3693, 263),
      day('2026-09-15', 92 / 2357, 2357, 92),
      day('2026-09-16', 206 / 3318, 3318, 206),
      day('2026-09-17', 197 / 2998, 2998, 197),
      day('2026-09-18', 168 / 1151, 1151, 168),
    ])
    expect(event!.entity).toBe('2026-09-14')
    expect(event!.message).toContain('7.12%')
    expect(event!.message).toContain('263 de 3693')
  })

  it('devuelve null si el único día con buena tasa es de poco volumen', () => {
    expect(
      buildBestDay([
        day('2026-09-01', 0.05, 3000, 150),
        day('2026-09-02', 0.06, 3000, 180),
        day('2026-09-03', 0.15, 1000, 150),
      ])!.entity,
    ).toBe('2026-09-02')
    expect(
      buildBestDay([
        day('2026-09-01', null, 3000, 0),
        day('2026-09-02', null, 3000, 0),
        day('2026-09-03', 0.15, 1000, 150),
      ]),
    ).toBeNull()
  })

  it('devuelve null sin candidatos', () => {
    expect(buildBestDay([])).toBeNull()
    expect(buildBestDay([day('2026-09-01', null)])).toBeNull()
    expect(buildBestDay([day('2026-09-01', 0.1, 10, 1)])).toBeNull()
  })
})

describe('buildBestHour', () => {
  it('elige la hora con mayor tasa que supera min_calls', () => {
    const event = buildBestHour([
      hour(9, 0.069, 4378, 302),
      hour(10, 0.0693, 4978, 345),
      hour(11, 0.0709, 5161, 366),
      hour(13, 0.09, 10, 1),
    ])
    expect(event).not.toBeNull()
    expect(event!.type).toBe('BEST_HOUR')
    expect(event!.severity).toBe('SUCCESS')
    expect(event!.entity).toBe('11')
    expect(event!.message).toContain('Mejor hora del período: 11h')
    expect(event!.message).toContain('7.09%')
    expect(event!.message).toContain('366 de 5161 intentos')
  })

  it('usa agent_answers como desempate y luego hora ascendente', () => {
    const tied = buildBestHour([
      hour(11, 0.07, 1000, 70),
      hour(9, 0.07, 1000, 70),
      hour(10, 0.07, 1000, 90),
    ])
    expect(tied!.entity).toBe('10')

    const sameAgents = buildBestHour([
      hour(11, 0.07, 1000, 70),
      hour(9, 0.07, 1000, 70),
    ])
    expect(sameAgents!.entity).toBe('9')
  })

  it('ignora horas con menos de BEST_HOUR_MIN_CALLS', () => {
    expect(BEST_HOUR_MIN_CALLS).toBe(50)
    const event = buildBestHour([
      hour(9, 0.5, 10, 5),
      hour(10, 0.07, 100, 7),
    ])
    expect(event!.entity).toBe('10')
  })

  it('devuelve null sin candidatos', () => {
    expect(buildBestHour([])).toBeNull()
    expect(buildBestHour([hour(9, null)])).toBeNull()
    expect(buildBestHour([hour(9, 0.5, 10, 5)])).toBeNull()
  })

  it('prefija la campaña en entity y mensaje cuando recibe campaign', () => {
    const event = buildBestHour([hour(11, 0.0709, 5161, 366)], '35')
    expect(event!.entity).toBe('11 · 35')
    expect(event!.message).toContain('Mejor hora de la campaña 35: 11h')
    expect(event!.message).toContain('7.09%')
  })
})

describe('buildBestDevice', () => {
  it('elige el dispositivo con mayor tasa que supera min_calls', () => {
    const event = buildBestDevice([
      device('GW37', 6046, 362, 1085, 0.12, 0.27),
      device('IPLAN', 16625, 1195, 8376, 0.017, 0.026),
      device('GW39', 5577, 287, 917, 0.035, 0.3),
      device('NUEVO', 20, 5, 0, 0.01, 0.05),
    ])
    expect(event).not.toBeNull()
    expect(event!.type).toBe('BEST_DEVICE')
    expect(event!.severity).toBe('SUCCESS')
    expect(event!.entity).toBe('IPLAN')
    expect(event!.message).toContain('Mejor dispositivo del período: IPLAN')
    expect(event!.message).toContain('7.19%')
    expect(event!.message).toContain('1195 de 16625 intentos')
  })

  it('usa agent_answers como desempate y luego device ascendente', () => {
    const tied = buildBestDevice([
      device('IPLAN', 1000, 70, 10, 0.01, 0.05),
      device('GW39', 1000, 70, 10, 0.01, 0.05),
    ])
    expect(tied!.entity).toBe('GW39')

    const sameAgents = buildBestDevice([
      device('IPLAN', 1000, 70, 10, 0.01, 0.05),
      device('GW39', 1000, 90, 10, 0.01, 0.05),
    ])
    expect(sameAgents!.entity).toBe('GW39')
  })

  it('ignora dispositivos con menos de BEST_DEVICE_MIN_CALLS', () => {
    expect(BEST_DEVICE_MIN_CALLS).toBe(50)
    const event = buildBestDevice([
      device('NUEVO', 10, 10, 0, 0.01, 0.05),
      device('GW39', 100, 7, 50, 0.01, 0.05),
    ])
    expect(event!.entity).toBe('GW39')
  })

  it('devuelve null sin candidatos', () => {
    expect(buildBestDevice([])).toBeNull()
    expect(
      buildBestDevice([device('GW', 10, 1, 0, 0.01, 0.05)]),
    ).toBeNull()
  })

  it('prefija la campaña en entity y mensaje cuando recibe campaign', () => {
    const event = buildBestDevice(
      [device('IPLAN', 16625, 1195, 8376, 0.017, 0.026)],
      '38',
    )
    expect(event!.entity).toBe('IPLAN · 38')
    expect(event!.message).toContain(
      'Mejor dispositivo de la campaña 38: IPLAN',
    )
    expect(event!.message).toContain('7.19%')
  })
})

describe('rankPositiveDrivers', () => {
  const make = (type: string) => ({
    severity: 'INFO' as const,
    type,
    entity: type,
    message: type,
  })

  it('ordena por prioridad y limita a POSITIVE_DRIVERS_MAX', () => {
    const ranked = rankPositiveDrivers([
      make('PEAK_HOUR'),
      make('BEST_DAY'),
      make('RELIABLE_TRUNK'),
      make('PEAK_WINDOW'),
      make('PEAK_HOUR'),
    ])
    expect(ranked.map((e) => e.type)).toEqual([
      'PEAK_WINDOW',
      'RELIABLE_TRUNK',
      'BEST_DAY',
      'PEAK_HOUR',
      'PEAK_HOUR',
    ])
    expect(ranked).toHaveLength(POSITIVE_DRIVERS_MAX)
  })

  it('ubica mejor hora y mejor dispositivo justo tras la ventana pico', () => {
    const ranked = rankPositiveDrivers([
      make('PEAK_HOUR'),
      make('BEST_DAY'),
      make('BEST_DEVICE'),
      make('BEST_HOUR'),
      make('RELIABLE_TRUNK'),
      make('PEAK_WINDOW'),
    ])
    expect(ranked.map((e) => e.type)).toEqual([
      'PEAK_WINDOW',
      'BEST_HOUR',
      'BEST_DEVICE',
      'RELIABLE_TRUNK',
      'BEST_DAY',
    ])
    expect(ranked).toHaveLength(POSITIVE_DRIVERS_MAX)
  })

  it('garantiza mejor hora y mejor dispositivo con varias ventanas pico', () => {
    const ranked = rankPositiveDrivers([
      make('PEAK_WINDOW'),
      make('PEAK_WINDOW'),
      make('PEAK_WINDOW'),
      make('PEAK_WINDOW'),
      make('BEST_HOUR'),
      make('BEST_DEVICE'),
      make('PEAK_HOUR'),
    ])
    expect(ranked).toHaveLength(POSITIVE_DRIVERS_MAX)
    expect(ranked.map((e) => e.type)).toContain('BEST_HOUR')
    expect(ranked.map((e) => e.type)).toContain('BEST_DEVICE')
    expect(ranked.map((e) => e.type).slice(0, 3)).toEqual([
      'PEAK_WINDOW',
      'PEAK_WINDOW',
      'PEAK_WINDOW',
    ])
  })
})

describe('buildWorstHour', () => {
  it('elige la hora con menor tasa que supera min_calls', () => {
    const event = buildWorstHour([
      hour(9, 0.04, 5000, 200),
      hour(11, 0.0709, 5161, 366),
      hour(13, 0.09, 10, 1),
    ])
    expect(event).not.toBeNull()
    expect(event!.type).toBe('WORST_HOUR')
    expect(event!.severity).toBe('WARNING')
    expect(event!.entity).toBe('9')
    expect(event!.message).toContain('Peor hora del período: 9h')
    expect(event!.message).toContain('4.00%')
    expect(event!.message).toContain('200 de 5000 intentos')
  })

  it('usa agent_answers como desempate y luego hora ascendente', () => {
    const tied = buildWorstHour([
      hour(11, 0.07, 1000, 70),
      hour(9, 0.07, 1000, 70),
      hour(10, 0.07, 1000, 50),
    ])
    expect(tied!.entity).toBe('10')

    const sameAgents = buildWorstHour([
      hour(11, 0.07, 1000, 70),
      hour(9, 0.07, 1000, 70),
    ])
    expect(sameAgents!.entity).toBe('9')
  })

  it('ignora horas con menos de BEST_HOUR_MIN_CALLS', () => {
    expect(BEST_HOUR_MIN_CALLS).toBe(50)
    const event = buildWorstHour([
      hour(9, 0.01, 10, 1),
      hour(10, 0.07, 100, 7),
    ])
    expect(event!.entity).toBe('10')
  })

  it('devuelve null sin candidatos', () => {
    expect(buildWorstHour([])).toBeNull()
    expect(buildWorstHour([hour(9, null)])).toBeNull()
    expect(buildWorstHour([hour(9, 0.5, 10, 5)])).toBeNull()
  })

  it('prefija la campaña en entity y mensaje cuando recibe campaign', () => {
    const event = buildWorstHour([hour(9, 0.04, 5000, 200)], '35')
    expect(event!.entity).toBe('9 · 35')
    expect(event!.message).toContain('Peor hora de la campaña 35: 9h')
    expect(event!.message).toContain('4.00%')
  })
})

describe('buildWorstDevice', () => {
  it('elige el dispositivo con menor tasa que supera min_calls', () => {
    const event = buildWorstDevice([
      device('GW37', 6046, 362, 1085, 0.12, 0.27),
      device('IPLAN', 16625, 1195, 8376, 0.017, 0.026),
      device('NUEVO', 20, 5, 0, 0.01, 0.05),
    ])
    expect(event).not.toBeNull()
    expect(event!.type).toBe('WORST_DEVICE')
    expect(event!.severity).toBe('WARNING')
    expect(event!.entity).toBe('GW37')
    expect(event!.message).toContain('Peor dispositivo del período: GW37')
    expect(event!.message).toContain('5.99%')
    expect(event!.message).toContain('362 de 6046 intentos')
  })

  it('usa agent_answers como desempate y luego device ascendente', () => {
    const tied = buildWorstDevice([
      device('IPLAN', 2000, 140, 10, 0.01, 0.05),
      device('GW39', 1000, 70, 10, 0.01, 0.05),
    ])
    expect(tied!.entity).toBe('GW39')

    const sameAgents = buildWorstDevice([
      device('IPLAN', 1000, 70, 10, 0.01, 0.05),
      device('GW39', 1000, 70, 10, 0.01, 0.05),
    ])
    expect(sameAgents!.entity).toBe('GW39')
  })

  it('ignora dispositivos con menos de BEST_DEVICE_MIN_CALLS', () => {
    expect(BEST_DEVICE_MIN_CALLS).toBe(50)
    const event = buildWorstDevice([
      device('NUEVO', 10, 10, 0, 0.01, 0.05),
      device('GW39', 100, 7, 50, 0.01, 0.05),
    ])
    expect(event!.entity).toBe('GW39')
  })

  it('devuelve null sin candidatos', () => {
    expect(buildWorstDevice([])).toBeNull()
    expect(
      buildWorstDevice([device('GW', 10, 1, 0, 0.01, 0.05)]),
    ).toBeNull()
  })

  it('prefija la campaña en entity y mensaje cuando recibe campaign', () => {
    const event = buildWorstDevice(
      [device('GW37', 6046, 362, 1085, 0.12, 0.27)],
      '38',
    )
    expect(event!.entity).toBe('GW37 · 38')
    expect(event!.message).toContain(
      'Peor dispositivo de la campaña 38: GW37',
    )
    expect(event!.message).toContain('5.99%')
  })
})

describe('mapRangeDiagnostics', () => {
  function diagnostics(
    overrides: Partial<RangeDiagnosticsResponse>,
  ): RangeDiagnosticsResponse {
    return {
      min_calls_applied: 50,
      congested_gateways: [],
      burn_hours: [],
      peak_hours: [],
      ...overrides,
    }
  }

  function congested(name: string) {
    return {
      device: name,
      total_calls: 1000,
      congestion_rate: 0.1,
      health_score: -10,
      message: `${name} en saturación de red`,
    }
  }

  const hourly = [hour(9, 0.07, 1000, 70), hour(16, 0.049, 1000, 49)]
  const devices = [
    device('IPLAN', 2000, 140, 100, 0.01, 0.2),
    device('IPLAN2', 1000, 35, 50, 0.06, 0.2),
  ]
  const daily = [day('2026-09-11', 0.085, 1000, 85)]

  it('compone negativas: causas del backend + peor hora y dispositivo, con tope', () => {
    const { rootCauses } = mapRangeDiagnostics(
      diagnostics({
        congested_gateways: [congested('GW37'), congested('IPLAN2'), congested('GW20')],
        burn_hours: [
          {
            hora: 14,
            total_calls: 1000,
            busy_rate: 0.4,
            health_score: -20,
            message: 'Hora 14 con alta quema de base',
          },
        ],
      }),
      devices,
      daily,
      hourly,
    )

    expect(rootCauses).toHaveLength(NEGATIVE_DRIVERS_MAX)
    expect(rootCauses.map((event) => event.type)).toEqual([
      'NETWORK_CONGESTION',
      'NETWORK_CONGESTION',
      'NETWORK_CONGESTION',
      'WORST_HOUR',
      'WORST_DEVICE',
    ])
    expect(rootCauses[3].entity).toBe('16')
    expect(rootCauses[4].entity).toBe('IPLAN2')
  })

  it('prioriza positivas y garantiza mejor hora y mejor dispositivo', () => {
    const windows = [1, 2, 4, 5, 7, 8, 10, 11, 13, 14].map((hora) => peak(hora, 0.07))
    const { positiveDrivers } = mapRangeDiagnostics(
      diagnostics({ peak_hours: windows }),
      devices,
      daily,
      hourly,
    )

    expect(positiveDrivers).toHaveLength(POSITIVE_DRIVERS_MAX)
    expect(positiveDrivers.map((event) => event.type)).toEqual([
      'PEAK_WINDOW',
      'PEAK_WINDOW',
      'PEAK_WINDOW',
      'BEST_HOUR',
      'BEST_DEVICE',
    ])
    expect(positiveDrivers[3].entity).toBe('9')
    expect(positiveDrivers[4].entity).toBe('IPLAN')
  })
})

// Real per-device totals, 01→30/09: [device, calls, agents, answering machines].
const DEVICES_35: [string, number, number, number][] = [
  ['IPLAN', 40755, 3180, 20778], ['GW37', 6133, 365, 1113], ['GW20', 5610, 205, 591],
  ['GW39', 5577, 287, 917], ['IPLAN2', 1555, 55, 313], ['GW28', 108, 9, 32],
  ['GW23', 106, 13, 21], ['GW21', 103, 5, 44], ['SPX_GSM14_GW14', 100, 10, 30],
  ['SPX_GSM_15_GW15', 94, 6, 37], ['GW26', 56, 9, 16], ['SPX_GSM19_GW19_4G', 54, 4, 16],
  ['GW42', 14, 5, 4],
]
const DEVICES_91: [string, number, number, number][] = [
  ['IPLANPREMIUM', 228639, 8830, 166105], ['GW28', 189081, 5813, 55932],
  ['SPX_GSM14_GW14', 148416, 5361, 67027], ['GW26', 121968, 3384, 45468],
  ['GW42', 88986, 2340, 27578], ['GW37', 82950, 2609, 23560],
  ['SPX_GSM13_GW13', 78957, 1567, 24848], ['SPX_GSM12_GW12', 77919, 2054, 26693],
  ['GW40', 68418, 1713, 21762], ['GW23', 68362, 1304, 13464], ['IPLAN', 62429, 1944, 41998],
  ['SPX_GSM18_GW18_4G', 61416, 1995, 18991], ['SPX_GSM_15_GW15', 54953, 1828, 23842],
  ['IPLANPREMIUMCBA', 38057, 1167, 26947], ['GW35', 35684, 1479, 15598],
  ['GSM8', 27827, 745, 12805], ['GW20', 26465, 1051, 11191],
  ['SPX_GSM19_GW19_4G', 26021, 474, 5262], ['SPX_GSM17_GW17', 24376, 481, 4746],
  ['IPLAN2', 19579, 430, 5815], ['SPX_GSM6_GW6', 16912, 487, 7352], ['GW21', 16463, 451, 6655],
  ['GW22', 15641, 172, 2447], ['GSM33', 14854, 301, 3084], ['GW25', 13825, 458, 4487],
  ['GSM7', 6181, 146, 2189], ['SPX_GSM11_GW11', 5662, 131, 2769],
  ['SPX_GSM16_GW16', 5582, 124, 1871], ['GW39', 3386, 24, 455],
  ['66F1BB5474D33B01C029B111', 3090, 0, 0], ['GSM35', 1104, 23, 355], ['PRUEBA', 399, 9, 182],
]
const realDevices = (rows: [string, number, number, number][]) =>
  rows.map(([name, total, agents, machines]) => device(name, total, agents, machines, 0, 0))

describe('mejor y peor con volumen mínimo relativo (Spec 053)', () => {
  it('campaña 35: el mejor dispositivo es IPLAN, no GW26 (56 llamadas, 0,09%)', () => {
    const best = buildBestDevice(realDevices(DEVICES_35), '35')
    expect(best!.entity).toBe('IPLAN · 35')
    expect(best!.message).toContain('7.80%')
    expect(best!.message).toContain('3180 de 40755')
    expect(buildWorstDevice(realDevices(DEVICES_35))!.entity).toBe('IPLAN2')
  })

  it('campaña 91: el peor dispositivo deja de ser la troncal de prueba (0,19%)', () => {
    const worst = buildWorstDevice(realDevices(DEVICES_91))
    expect(worst!.entity).toBe('SPX_GSM19_GW19_4G')
    expect(worst!.message).toContain('474 de 26021')
    expect(buildBestDevice(realDevices(DEVICES_91))!.entity).toBe('GW35')
  })

  it('una hora con menos del 1% de las llamadas no es mejor ni peor', () => {
    const hours = [hour(10, 0.05, 6000, 300), hour(11, 0.04, 6000, 240), hour(20, 0.2, 60, 12)]
    expect(buildBestHour(hours)!.entity).toBe('10')
    expect(buildWorstHour([hour(10, 0.05, 6000, 300), hour(20, 0, 60, 0)])!.entity).toBe('10')
  })

  it('sin candidatos con volumen suficiente no emite nada', () => {
    expect(buildBestDevice([device('A', 40, 4, 0, 0, 0)])).toBeNull()
    expect(buildWorstHour([hour(9, 0.1, 40, 4)])).toBeNull()
  })
})
