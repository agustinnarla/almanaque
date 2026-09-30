import { fetchPatterns } from '../api/rangeExtras'
import type { PatternAlert } from '../types/api'
import { useApiResource } from './useApiResource'

export interface PatternAlertsParams {
  from: string
  to: string
}

interface State {
  alerts: PatternAlert[] | null
  loading: boolean
  error: string | null
}

export function usePatternAlerts(params: PatternAlertsParams): State & {
  reload: () => void
} {
  const { from, to } = params

  const { data, loading, error, reload } = useApiResource(
    (signal) => fetchPatterns(from, to, signal),
    [from, to],
    { errorMessage: 'No se pudieron cargar las alertas de patrones' },
  )

  return { alerts: data, loading, error, reload }
}
