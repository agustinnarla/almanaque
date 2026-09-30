import { fetchRangeRecommendations } from '../api/overview'
import type { RangeRecommendationsResponse } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export interface RangeRecommendationsParams {
  campaign: string
  from: string
  to: string
  minCalls: number
}

export function useRangeRecommendations(
  params: RangeRecommendationsParams,
): ApiResource<RangeRecommendationsResponse> {
  const { campaign, from, to, minCalls } = params
  return useApiResource(
    (signal) => fetchRangeRecommendations(campaign, from, to, minCalls, signal),
    [campaign, from, to, minCalls],
    { errorMessage: 'No se pudieron cargar las recomendaciones' },
  )
}
