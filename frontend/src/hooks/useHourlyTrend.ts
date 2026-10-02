import { fetchHourlyTrend } from '../api/campaigns'
import type { HourlyTrendPoint } from '../types/api'
import { useApiResource } from './useApiResource'

interface State {
  pointsA: HourlyTrendPoint[]
  pointsB: HourlyTrendPoint[]
  loading: boolean
  refreshing: boolean
  error: string | null
}

export function useHourlyTrend(
  campaign: string,
  dateA: string,
  dateB: string,
): State & { reload: () => void } {
  const { data, loading, refreshing, error, reload } = useApiResource(
    async (signal) => {
      const [pointsA, pointsB] = await Promise.all([
        fetchHourlyTrend(campaign, dateA, signal),
        fetchHourlyTrend(campaign, dateB, signal),
      ])
      return { pointsA, pointsB }
    },
    [campaign, dateA, dateB],
    { errorMessage: 'No se pudo cargar la tendencia horaria' },
  )

  return {
    pointsA: data?.pointsA ?? [],
    pointsB: data?.pointsB ?? [],
    loading,
    refreshing,
    error,
    reload,
  }
}
