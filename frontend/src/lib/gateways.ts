import type { GatewayComparison } from '../types/api'

export type GatewayStatus = 'Saturado' | 'Aliviado' | 'Normal'

export const SATURATED_RATE_B = 0.05
export const RELIEVED_DELTA = -0.02

export function gatewayStatus(row: GatewayComparison): GatewayStatus {
  const rateB = row.congestion_rate_b
  const delta = row.delta_congestion
  if (rateB != null && rateB >= SATURATED_RATE_B) return 'Saturado'
  if (
    rateB != null &&
    rateB < SATURATED_RATE_B &&
    delta != null &&
    delta <= RELIEVED_DELTA
  ) {
    return 'Aliviado'
  }
  return 'Normal'
}
