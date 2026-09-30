import { fetchRecommendations, type CompareParams } from '../api/campaigns'
import type { RecommendationsResponse } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export function useRecommendations(
  params: CompareParams,
): ApiResource<RecommendationsResponse> {
  const { campaign, dateA, dateB, minCalls } = params
  return useApiResource(
    (signal) =>
      fetchRecommendations({ campaign, dateA, dateB, minCalls }, signal),
    [campaign, dateA, dateB, minCalls],
    { errorMessage: 'No se pudieron cargar las recomendaciones' },
  )
}
