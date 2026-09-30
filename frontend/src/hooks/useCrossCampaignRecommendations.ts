import {
  fetchCrossCampaignRecommendations,
  type CrossCampaignParams,
} from '../api/campaigns'
import type { CrossCampaignRecommendationsResponse } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export function useCrossCampaignRecommendations(
  params: CrossCampaignParams,
): ApiResource<CrossCampaignRecommendationsResponse> {
  const { campaignA, campaignB, startDate, endDate, minCalls } = params
  return useApiResource(
    (signal) =>
      fetchCrossCampaignRecommendations(
        { campaignA, campaignB, startDate, endDate, minCalls },
        signal,
      ),
    [campaignA, campaignB, startDate, endDate, minCalls],
    { errorMessage: 'No se pudieron cargar las recomendaciones entre campañas' },
  )
}
