import { fetchPatterns } from '../api/rangeExtras'
import type { PatternAlert } from '../types/api'
import { useApiResource } from './useApiResource'

export interface PatternAlertsParams {
  from: string
  to: string
  minCalls: number
}

interface State {
  alerts: PatternAlert[] | null
  loading: boolean
  refreshing: boolean
  error: string | null
}

export function usePatternAlerts(params: PatternAlertsParams): State & {
  reload: () => void
} {
  const { from, to, minCalls } = params

  const { data, loading, refreshing, error, reload } = useApiResource(
    (signal) => fetchPatterns(from, to, minCalls, signal),
    [from, to, minCalls],
    { errorMessage: 'No se pudieron cargar las alertas de patrones' },
  )

  return { alerts: data, loading, refreshing, error, reload }
}
