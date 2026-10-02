import type {
  DailyTrendPoint,
  DiagnosticEvent,
  DeviceRangeRow,
  HourlyTrendPoint,
  PeakHour,
  RangeDiagnosticsResponse,
} from '../types/api'
import { composeCrossNegatives } from './crossDiagnostics'
import { lowVolumeDays } from './lowVolume'
import {
  AMD_RATIO,
  BEST_DAY_MIN_CALLS,
  BEST_DEVICE_MIN_CALLS,
  BEST_HOUR_MIN_CALLS,
  PEAK_WINDOW_MIN_RATE,
  POSITIVE_DRIVERS_MAX,
  TRUNK_MAX_BUSY,
  TRUNK_MAX_CONGESTION,
  TRUNK_MIN_SHARE,
} from './rangeThresholds'

const POSITIVE_PRIORITY: Record<string, number> = {
  PEAK_WINDOW: 0,
  BEST_HOUR: 1,
  BEST_DEVICE: 2,
  RELIABLE_TRUNK: 3,
  BEST_DAY: 4,
  PEAK_HOUR: 5,
}

const GUARANTEED_TYPES = ['BEST_HOUR', 'BEST_DEVICE']

function isAmdHit(device: {
  machine_answers: number
  agent_answers: number
}): boolean {
  const machines = device.machine_answers
  const agents = device.agent_answers
  if (machines === 0 && agents === 0) return false
  return machines >= AMD_RATIO * agents
}

export function mergePeakWindows(peaks: PeakHour[]): DiagnosticEvent[] {
  const qualified = peaks
    .filter(
      (hour) =>
        hour.agent_answer_rate != null &&
        hour.agent_answer_rate >= PEAK_WINDOW_MIN_RATE,
    )
    .slice()
    .sort((a, b) => a.hora - b.hora)

  if (qualified.length === 0) {
    return []
  }

  const runs: PeakHour[][] = []
  let current: PeakHour[] = [qualified[0]]
  for (let i = 1; i < qualified.length; i += 1) {
    const prev = qualified[i - 1]
    const hour = qualified[i]
    if (hour.hora === prev.hora + 1) {
      current.push(hour)
    } else {
      runs.push(current)
      current = [hour]
    }
  }
  runs.push(current)

  const events: DiagnosticEvent[] = []
  for (const run of runs) {
    if (run.length >= 2) {
      const totalCalls = run.reduce((sum, hour) => sum + hour.total_calls, 0)
      const weightedAgents = run.reduce(
        (sum, hour) =>
          sum + (hour.agent_answer_rate ?? 0) * hour.total_calls,
        0,
      )
      const rate = totalCalls > 0 ? weightedAgents / totalCalls : null
      const start = run[0].hora
      const end = run[run.length - 1].hora
      const rateText = rate != null ? `${(rate * 100).toFixed(2)}%` : '—'
      events.push({
        severity: 'INFO',
        type: 'PEAK_WINDOW',
        entity: `${start}h–${end}h`,
        message:
          `Franja ${start}h–${end}h de contacto efectivo (tasa ponderada ` +
          `${rateText}; ${Math.round(weightedAgents)} de ${totalCalls} intentos).`,
      })
    } else {
      const hour = run[0]
      events.push({
        severity: 'INFO',
        type: 'PEAK_HOUR',
        entity: String(hour.hora),
        message: hour.message,
      })
    }
  }
  return events
}

export function buildReliableTrunk(
  devices: DeviceRangeRow[],
  totalCalls: number,
): DiagnosticEvent | null {
  if (totalCalls <= 0 || devices.length === 0) {
    return null
  }

  const candidates = devices.filter((device) => {
    if (device.congestion_rate == null || device.busy_rate == null) {
      return false
    }
    const share = device.total_calls / totalCalls
    if (share < TRUNK_MIN_SHARE) return false
    if (device.congestion_rate >= TRUNK_MAX_CONGESTION) return false
    if (device.busy_rate > TRUNK_MAX_BUSY) return false
    if (isAmdHit(device)) return false
    return true
  })

  if (candidates.length === 0) {
    return null
  }

  candidates.sort((a, b) => {
    const congDiff = (a.congestion_rate ?? 0) - (b.congestion_rate ?? 0)
    if (congDiff !== 0) return congDiff
    const shareA = a.total_calls / totalCalls
    const shareB = b.total_calls / totalCalls
    return shareB - shareA
  })

  const best = candidates[0]
  const share = best.total_calls / totalCalls
  return {
    severity: 'SUCCESS',
    type: 'RELIABLE_TRUNK',
    entity: best.device,
    message:
      `${best.device} es el troncal de menor fricción del período: congestión ` +
      `${((best.congestion_rate ?? 0) * 100).toFixed(2)}%, ocupado ` +
      `${((best.busy_rate ?? 0) * 100).toFixed(2)}% y ${(share * 100).toFixed(1)}% ` +
      `del volumen, sin desbalance de contestadores.`,
  }
}

export function buildBestDay(daily: DailyTrendPoint[]): DiagnosticEvent | null {
  // Spec 050: a low-volume day's AA is noise, never the period's best day.
  const lowVolume = lowVolumeDays(daily).days
  const candidates = daily.filter(
    (day) =>
      day.agent_answer_rate != null &&
      day.total_calls >= BEST_DAY_MIN_CALLS &&
      !lowVolume.has(day.fecha),
  )
  if (candidates.length === 0) {
    return null
  }

  candidates.sort((a, b) => {
    const rateDiff = (b.agent_answer_rate ?? 0) - (a.agent_answer_rate ?? 0)
    if (rateDiff !== 0) return rateDiff
    if (b.agent_answers !== a.agent_answers) {
      return b.agent_answers - a.agent_answers
    }
    return a.fecha.localeCompare(b.fecha)
  })

  const best = candidates[0]
  const rate = (best.agent_answer_rate ?? 0) * 100
  return {
    severity: 'SUCCESS',
    type: 'BEST_DAY',
    entity: best.fecha,
    message:
      `Mejor jornada del período: ${best.fecha} con ${rate.toFixed(2)}% de ` +
      `contacto humano (${best.agent_answers} de ${best.total_calls} intentos).`,
  }
}

export function buildBestHour(
  hourly: HourlyTrendPoint[],
  campaign?: string,
): DiagnosticEvent | null {
  const candidates = hourly.filter(
    (point) =>
      point.agent_answer_rate != null &&
      point.total_calls >= BEST_HOUR_MIN_CALLS,
  )
  if (candidates.length === 0) {
    return null
  }

  candidates.sort((a, b) => {
    const rateDiff = (b.agent_answer_rate ?? 0) - (a.agent_answer_rate ?? 0)
    if (rateDiff !== 0) return rateDiff
    if (b.agent_answers !== a.agent_answers) {
      return b.agent_answers - a.agent_answers
    }
    return a.hora - b.hora
  })

  const best = candidates[0]
  const rate = (best.agent_answer_rate ?? 0) * 100
  const scope = campaign ? `de la campaña ${campaign}` : 'del período'
  return {
    severity: 'SUCCESS',
    type: 'BEST_HOUR',
    entity: campaign ? `${best.hora} · ${campaign}` : String(best.hora),
    message:
      `Mejor hora ${scope}: ${best.hora}h con ${rate.toFixed(2)}% de ` +
      `contacto humano (${best.agent_answers} de ${best.total_calls} intentos).`,
  }
}

export function buildBestDevice(
  devices: DeviceRangeRow[],
  campaign?: string,
): DiagnosticEvent | null {
  const candidates = devices.filter(
    (device) =>
      device.agent_answer_rate != null &&
      device.total_calls >= BEST_DEVICE_MIN_CALLS,
  )
  if (candidates.length === 0) {
    return null
  }

  candidates.sort((a, b) => {
    const rateDiff = (b.agent_answer_rate ?? 0) - (a.agent_answer_rate ?? 0)
    if (rateDiff !== 0) return rateDiff
    if (b.agent_answers !== a.agent_answers) {
      return b.agent_answers - a.agent_answers
    }
    return a.device.localeCompare(b.device)
  })

  const best = candidates[0]
  const rate = (best.agent_answer_rate ?? 0) * 100
  const scope = campaign ? `de la campaña ${campaign}` : 'del período'
  return {
    severity: 'SUCCESS',
    type: 'BEST_DEVICE',
    entity: campaign ? `${best.device} · ${campaign}` : best.device,
    message:
      `Mejor dispositivo ${scope}: ${best.device} con ${rate.toFixed(2)}% ` +
      `de contacto humano (${best.agent_answers} de ${best.total_calls} intentos).`,
  }
}

export function buildWorstHour(
  hourly: HourlyTrendPoint[],
  campaign?: string,
): DiagnosticEvent | null {
  const candidates = hourly.filter(
    (point) =>
      point.agent_answer_rate != null &&
      point.total_calls >= BEST_HOUR_MIN_CALLS,
  )
  if (candidates.length === 0) {
    return null
  }

  candidates.sort((a, b) => {
    const rateDiff = (a.agent_answer_rate ?? 0) - (b.agent_answer_rate ?? 0)
    if (rateDiff !== 0) return rateDiff
    if (a.agent_answers !== b.agent_answers) {
      return a.agent_answers - b.agent_answers
    }
    return a.hora - b.hora
  })

  const worst = candidates[0]
  const rate = (worst.agent_answer_rate ?? 0) * 100
  const scope = campaign ? `de la campaña ${campaign}` : 'del período'
  return {
    severity: 'WARNING',
    type: 'WORST_HOUR',
    entity: campaign ? `${worst.hora} · ${campaign}` : String(worst.hora),
    message:
      `Peor hora ${scope}: ${worst.hora}h con ${rate.toFixed(2)}% de ` +
      `contacto humano (${worst.agent_answers} de ${worst.total_calls} intentos).`,
  }
}

export function buildWorstDevice(
  devices: DeviceRangeRow[],
  campaign?: string,
): DiagnosticEvent | null {
  const candidates = devices.filter(
    (device) =>
      device.agent_answer_rate != null &&
      device.total_calls >= BEST_DEVICE_MIN_CALLS,
  )
  if (candidates.length === 0) {
    return null
  }

  candidates.sort((a, b) => {
    const rateDiff = (a.agent_answer_rate ?? 0) - (b.agent_answer_rate ?? 0)
    if (rateDiff !== 0) return rateDiff
    if (a.agent_answers !== b.agent_answers) {
      return a.agent_answers - b.agent_answers
    }
    return a.device.localeCompare(b.device)
  })

  const worst = candidates[0]
  const rate = (worst.agent_answer_rate ?? 0) * 100
  const scope = campaign ? `de la campaña ${campaign}` : 'del período'
  return {
    severity: 'WARNING',
    type: 'WORST_DEVICE',
    entity: campaign ? `${worst.device} · ${campaign}` : worst.device,
    message:
      `Peor dispositivo ${scope}: ${worst.device} con ${rate.toFixed(2)}% ` +
      `de contacto humano (${worst.agent_answers} de ${worst.total_calls} intentos).`,
  }
}

function byPositivePriority(a: DiagnosticEvent, b: DiagnosticEvent): number {
  return (POSITIVE_PRIORITY[a.type] ?? 99) - (POSITIVE_PRIORITY[b.type] ?? 99)
}

export function rankPositiveDrivers(
  events: DiagnosticEvent[],
): DiagnosticEvent[] {
  const sorted = events.slice().sort(byPositivePriority)
  const selected = sorted.slice(0, POSITIVE_DRIVERS_MAX)
  const missing = sorted.filter(
    (event) =>
      GUARANTEED_TYPES.includes(event.type) && !selected.includes(event),
  )
  if (missing.length === 0) {
    return selected
  }
  const replaceable = selected.filter(
    (event) => !GUARANTEED_TYPES.includes(event.type),
  )
  const dropped = replaceable.slice(-missing.length)
  return [...selected.filter((event) => !dropped.includes(event)), ...missing]
    .sort(byPositivePriority)
}

export function mapRangeDiagnostics(
  data: RangeDiagnosticsResponse,
  devices: DeviceRangeRow[],
  daily: DailyTrendPoint[],
  hourly: HourlyTrendPoint[],
): {
  rootCauses: DiagnosticEvent[]
  positiveDrivers: DiagnosticEvent[]
} {
  const backendCauses: DiagnosticEvent[] = [
    ...data.congested_gateways.map((gateway) => ({
      severity: 'WARNING' as const,
      type: 'NETWORK_CONGESTION',
      entity: String(gateway.device),
      message: gateway.message,
    })),
    ...data.burn_hours.map((hour) => ({
      severity: 'WARNING' as const,
      type: 'BUSY_HOUR',
      entity: String(hour.hora),
      message: hour.message,
    })),
  ]
  const worstHour = buildWorstHour(hourly)
  const worstDevice = buildWorstDevice(devices)
  const rootCauses = composeCrossNegatives(backendCauses, [
    worstHour,
    worstDevice,
  ])
  const totalCalls = devices.reduce((sum, row) => sum + row.total_calls, 0)
  const trunk = buildReliableTrunk(devices, totalCalls)
  const bestDay = buildBestDay(daily)
  const bestHour = buildBestHour(hourly)
  const bestDevice = buildBestDevice(devices)
  const positiveDrivers = rankPositiveDrivers([
    ...mergePeakWindows(data.peak_hours),
    ...(trunk ? [trunk] : []),
    ...(bestDay ? [bestDay] : []),
    ...(bestHour ? [bestHour] : []),
    ...(bestDevice ? [bestDevice] : []),
  ])
  return { rootCauses, positiveDrivers }
}
