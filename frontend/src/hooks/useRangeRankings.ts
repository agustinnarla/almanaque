import {
  fetchBasesRanking,
  fetchDevicesRanking,
  fetchHoursRanking,
} from '../api/rangeExtras'
import type { BaseRankingRow, SegmentRankingResponse } from '../types/api'
import { useApiResource } from './useApiResource'

export interface RangeRankingsParams {
  campaign: string
  from: string
  to: string
  minCalls: number
  limit: number
}

interface State {
  bases: BaseRankingRow[] | null
  devices: SegmentRankingResponse | null
  hours: SegmentRankingResponse | null
  loading: boolean
  error: string | null
}

export function useRangeRankings(params: RangeRankingsParams): State & {
  reload: () => void
} {
  const { campaign, from, to, minCalls, limit } = params

  const { data, loading, error, reload } = useApiResource(
    async (signal) => {
      const [bases, devices, hours] = await Promise.all([
        fetchBasesRanking(campaign, from, to, minCalls, signal),
        fetchDevicesRanking(campaign, from, to, minCalls, limit, signal),
        fetchHoursRanking(campaign, from, to, minCalls, limit, signal),
      ])
      return { bases, devices, hours }
    },
    [campaign, from, to, minCalls, limit],
    { errorMessage: 'No se pudieron cargar los rankings' },
  )

  return {
    bases: data?.bases ?? null,
    devices: data?.devices ?? null,
    hours: data?.hours ?? null,
    loading,
    error,
    reload,
  }
}
