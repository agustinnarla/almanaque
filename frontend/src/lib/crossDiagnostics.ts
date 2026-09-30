import type { DiagnosticEvent } from '../types/api'
import { NEGATIVE_DRIVERS_MAX, POSITIVE_DRIVERS_MAX } from './rangeThresholds'

function composeCross(
  backendEvents: DiagnosticEvent[],
  campaignEvents: (DiagnosticEvent | null)[],
  limit: number,
): DiagnosticEvent[] {
  const highlights = campaignEvents.filter(
    (event): event is DiagnosticEvent => event != null,
  )
  const reserved = highlights.slice(0, limit)
  const room = Math.max(limit - reserved.length, 0)
  return [...backendEvents.slice(0, room), ...reserved]
}

export function composeCrossPositives(
  backendPositives: DiagnosticEvent[],
  campaignEvents: (DiagnosticEvent | null)[],
): DiagnosticEvent[] {
  return composeCross(backendPositives, campaignEvents, POSITIVE_DRIVERS_MAX)
}

export function composeCrossNegatives(
  backendRootCauses: DiagnosticEvent[],
  campaignEvents: (DiagnosticEvent | null)[],
): DiagnosticEvent[] {
  return composeCross(backendRootCauses, campaignEvents, NEGATIVE_DRIVERS_MAX)
}
