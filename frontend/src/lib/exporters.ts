import type {
  BaseComparison,
  CampaignSummary,
  DailyTrendPoint,
  DeviceRangeRow,
  DiagnosticEvent,
  GatewayComparison,
  HourlyTrendPoint,
  Recommendation,
  SummaryKpi,
  TrunkVolumeRow,
} from '../types/api'

import type { PatternCombo, PatternCompareCombo, PatternCompareDay, PatternDayCount } from './patterns'
import type { CrossRankingKind } from './rankings'
import type {
  BaseRankingRow,
  CrossRankingRow,
  SegmentRankingItem,
  SegmentRankingResponse,
} from '../types/api'
import type { CsvCell } from './csv'

export interface CsvTable {
  headers: string[]
  rows: CsvCell[][]
}

function pct(rate: number | null | undefined): number | null {
  if (rate == null) return null
  return Math.round(rate * 10000) / 100
}

function ppDelta(a: number | null | undefined, b: number | null | undefined): number | null {
  if (a == null || b == null) return null
  return Math.round((b - a) * 10000) / 100
}

export function kpiRangeRows(summary: CampaignSummary): CsvTable {
  const machineShare =
    summary.total_calls > 0 ? summary.machine_answers / summary.total_calls : null
  const rejectedShare =
    summary.total_calls > 0 ? summary.rejected_calls / summary.total_calls : null
  return {
    headers: ['Métrica', 'Valor'],
    rows: [
      ['Total de llamadas', summary.total_calls],
      ['Respuestas de agente', summary.agent_answers],
      ['Agent Answer %', pct(summary.agent_answer_rate)],
      ['AA sobre atendibles %', pct(summary.attendable_answer_rate)],
      ['Contestadores %', pct(machineShare)],
      ['No contesta / fallidas', summary.rejected_calls],
      ['No contesta %', pct(rejectedShare)],
    ],
  }
}

export function kpiCompareRows(summary: SummaryKpi): CsvTable {
  return {
    headers: ['Métrica', 'Valor A', 'Valor B', 'Delta'],
    rows: [
      ['Total de llamadas', summary.total_calls_a, summary.total_calls_b, summary.delta_total_pct],
      [
        'Agent Answer %',
        pct(summary.agent_answer_rate_a),
        pct(summary.agent_answer_rate_b),
        summary.delta_percentage,
      ],
      [
        'Ocupación %',
        pct(summary.busy_rate_a),
        pct(summary.busy_rate_b),
        ppDelta(summary.busy_rate_a, summary.busy_rate_b),
      ],
      [
        'Congestión %',
        pct(summary.congestion_rate_a),
        pct(summary.congestion_rate_b),
        ppDelta(summary.congestion_rate_a, summary.congestion_rate_b),
      ],
      ['Health score (B)', null, summary.health_score, null],
    ],
  }
}

export function diagnosticRows(
  rootCauses: DiagnosticEvent[],
  positiveDrivers: DiagnosticEvent[],
): CsvTable {
  const row = (polarity: string) => (event: DiagnosticEvent): CsvCell[] => [
    polarity,
    event.severity,
    event.type,
    event.entity,
    event.message,
  ]
  return {
    headers: ['Polaridad', 'Severidad', 'Tipo', 'Entidad', 'Mensaje'],
    rows: [
      ...rootCauses.map(row('Negativa')),
      ...positiveDrivers.map(row('Positiva')),
    ],
  }
}

export function recommendationRows(recommendations: Recommendation[]): CsvTable {
  return {
    headers: ['Tipo', 'Categoría', 'Entidad', 'Texto', 'Descartados AMD'],
    rows: recommendations.map((rec) => [
      rec.type,
      rec.category,
      rec.entity,
      rec.text,
      (rec.excluded_amd ?? []).join(', '),
    ]),
  }
}

export function dailyRows(points: DailyTrendPoint[]): CsvTable {
  return {
    headers: ['Fecha', 'Llamadas', 'Agentes', 'Automáticos', 'Agent Answer %'],
    rows: points.map((p) => [
      p.fecha,
      p.total_calls,
      p.agent_answers,
      p.machine_answers,
      pct(p.agent_answer_rate),
    ]),
  }
}

export function trunkVolumeRows(rows: TrunkVolumeRow[]): CsvTable {
  return {
    headers: ['Fecha', 'Troncal', 'Llamadas'],
    rows: rows.map((r) => [r.fecha, r.device, r.total_calls]),
  }
}

export function hourlyRows(points: HourlyTrendPoint[]): CsvTable {
  return {
    headers: ['Hora', 'Llamadas', 'Agentes', 'Automáticos', 'Agent Answer %'],
    rows: points.map((p) => [
      p.hora,
      p.total_calls,
      p.agent_answers,
      p.machine_answers,
      pct(p.agent_answer_rate),
    ]),
  }
}

export function dailyCompareRows(
  pointsA: DailyTrendPoint[],
  pointsB: DailyTrendPoint[],
): CsvTable {
  const byFecha = new Map<string, CsvCell[]>()
  const ensure = (fecha: string): CsvCell[] => {
    let row = byFecha.get(fecha)
    if (!row) {
      row = [fecha, null, null, null, null]
      byFecha.set(fecha, row)
    }
    return row
  }
  for (const p of pointsA) {
    const row = ensure(p.fecha)
    row[1] = p.total_calls
    row[3] = pct(p.agent_answer_rate)
  }
  for (const p of pointsB) {
    const row = ensure(p.fecha)
    row[2] = p.total_calls
    row[4] = pct(p.agent_answer_rate)
  }
  return {
    headers: ['Fecha', 'Llamadas A', 'Llamadas B', 'Agent Answer A %', 'Agent Answer B %'],
    rows: [...byFecha.values()],
  }
}

export function hourlyCompareRows(
  pointsA: HourlyTrendPoint[],
  pointsB: HourlyTrendPoint[],
): CsvTable {
  const byHour = new Map<number, CsvCell[]>()
  const ensure = (hora: number): CsvCell[] => {
    let row = byHour.get(hora)
    if (!row) {
      row = [hora, null, null, null, null]
      byHour.set(hora, row)
    }
    return row
  }
  for (const p of pointsA) {
    const row = ensure(p.hora)
    row[1] = p.total_calls
    row[3] = pct(p.agent_answer_rate)
  }
  for (const p of pointsB) {
    const row = ensure(p.hora)
    row[2] = p.total_calls
    row[4] = pct(p.agent_answer_rate)
  }
  const rows = [...byHour.values()].sort((a, b) => Number(a[0]) - Number(b[0]))
  return {
    headers: ['Hora', 'Llamadas A', 'Llamadas B', 'Agent Answer A %', 'Agent Answer B %'],
    rows,
  }
}

export function gatewaysRangeRows(devices: DeviceRangeRow[]): CsvTable {
  return {
    headers: [
      'Dispositivo',
      'Llamadas',
      'Agentes',
      'Automáticos',
      'Ocupadas',
      'Congestión',
      'Agent Answer %',
      'AA sobre atendibles %',
      'Ocupación %',
      'Congestión %',
    ],
    rows: devices.map((d) => [
      d.device,
      d.total_calls,
      d.agent_answers,
      d.machine_answers,
      d.busy_calls,
      d.congestion_calls,
      pct(d.agent_answer_rate),
      pct(d.attendable_answer_rate),
      pct(d.busy_rate),
      pct(d.congestion_rate),
    ]),
  }
}

export function gatewaysCompareRows(rows: GatewayComparison[]): CsvTable {
  return {
    headers: ['Dispositivo', 'Congestión A %', 'Congestión B %', 'Delta pp'],
    rows: rows.map((row) => [
      row.device,
      pct(row.congestion_rate_a),
      pct(row.congestion_rate_b),
      ppDelta(row.congestion_rate_a, row.congestion_rate_b),
    ]),
  }
}

export function basesCompareRows(rows: BaseComparison[]): CsvTable {
  return {
    headers: [
      'Base',
      'Llamadas A',
      'Llamadas B',
      'Agent Answer A %',
      'Agent Answer B %',
      'Delta pp',
      'Share A %',
      'Share B %',
      'Share delta pp',
      'Relativo %',
    ],
    rows: rows.map((row) => [
      row.base,
      row.total_calls_a,
      row.total_calls_b,
      pct(row.agent_answer_rate_a),
      pct(row.agent_answer_rate_b),
      ppDelta(row.agent_answer_rate_a, row.agent_answer_rate_b),
      pct(row.share_a),
      pct(row.share_b),
      pct(row.share_delta),
      row.relative_change_pct,
    ]),
  }
}

export function basesRankingRows(rows: BaseRankingRow[]): CsvTable {
  return {
    headers: ['Rank', 'Base', 'Intentos', 'Agent Answer %'],
    rows: rows.map((row, index) => [
      row.ranked === false ? 'Pocos intentos' : `#${index + 1}`,
      row.base,
      row.total_calls,
      pct(row.agent_answer_rate),
    ]),
  }
}

export function segmentRankingRows(
  label: string,
  data: SegmentRankingResponse,
): CsvTable {
  const row = (position: string) => (
    item: SegmentRankingItem,
  ): CsvCell[] => [
    position,
    item.device ?? (item.hora != null ? String(item.hora) : ''),
    item.total_calls,
    pct(item.agent_answer_rate),
    pct(item.busy_rate),
    pct(item.congestion_rate),
    item.health_score,
  ]
  return {
    headers: [
      label,
      'Segmento',
      'Intentos',
      'Agent Answer %',
      'Ocupación %',
      'Congestión %',
      'Health score',
    ],
    rows: [
      ...data.best.map(row('Mejor')),
      ...data.worst.map(row('Peor')),
    ],
  }
}

export function patternDailyRows(byDay: PatternDayCount[]): CsvTable {
  return {
    headers: ['Fecha', 'Alertas'],
    rows: byDay.map((day) => [day.fecha, day.alerts]),
  }
}

export function patternComboRows(topCombos: PatternCombo[]): CsvTable {
  return {
    headers: ['Base', 'Dispositivo', 'Alertas', 'Peor Agent Answer %'],
    rows: topCombos.map((combo) => [
      combo.base,
      combo.device,
      combo.alerts,
      pct(combo.worstRate),
    ]),
  }
}

export function crossRankingRows(
  kind: CrossRankingKind,
  rows: CrossRankingRow[],
): CsvTable {
  const headers =
    kind === 'base'
      ? [
          'Base',
          'Intentos A',
          'Agent Answer A %',
          'Intentos B',
          'Agent Answer B %',
          'Delta pp',
        ]
      : [
          kind === 'device' ? 'Dispositivo' : 'Hora',
          'Intentos A',
          'Agent Answer A %',
          'Health A',
          'Intentos B',
          'Agent Answer B %',
          'Health B',
          'Delta pp',
        ]
  return {
    headers,
    rows: rows.map((row) => {
      const base: CsvCell[] = [
        row.key,
        row.attemptsA,
        pct(row.rateA),
      ]
      const restB: CsvCell[] = [row.attemptsB, pct(row.rateB)]
      const health: CsvCell[] = kind === 'base' ? [] : [row.healthA]
      const healthB: CsvCell[] = kind === 'base' ? [] : [row.healthB]
      return [
        ...base,
        ...health,
        ...restB,
        ...healthB,
        ppDelta(row.rateA, row.rateB),
      ]
    }),
  }
}

export function patternCompareDailyRows(byDay: PatternCompareDay[]): CsvTable {
  return {
    headers: ['Fecha', 'Alertas A', 'Alertas B'],
    rows: byDay.map((day) => [day.fecha, day.alertsA, day.alertsB]),
  }
}

export function patternCompareComboRows(combos: PatternCompareCombo[]): CsvTable {
  return {
    headers: ['Base', 'Dispositivo', 'Alertas A', 'Alertas B', 'Total'],
    rows: combos.map((combo) => [
      combo.base,
      combo.device,
      combo.alertsA,
      combo.alertsB,
      combo.total,
    ]),
  }
}
