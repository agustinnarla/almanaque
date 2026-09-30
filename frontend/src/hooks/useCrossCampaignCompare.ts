import {
  fetchCrossCampaignCompare,
  type CrossCampaignParams,
} from '../api/campaigns'
import type { CrossCampaignCompareResponse } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export function useCrossCampaignCompare(
  params: CrossCampaignParams,
): ApiResource<CrossCampaignCompareResponse> {
  const { campaignA, campaignB, startDate, endDate, minCalls } = params
  return useApiResource(
    (signal) =>
      fetchCrossCampaignCompare(
        { campaignA, campaignB, startDate, endDate, minCalls },
        signal,
      ),
    [campaignA, campaignB, startDate, endDate, minCalls],
    { errorMessage: 'No se pudo cargar la comparación de campañas' },
  )
}
