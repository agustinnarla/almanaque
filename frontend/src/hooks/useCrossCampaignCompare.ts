import {
  fetchCrossCampaignCompare,
  type CrossCampaignParams,
} from '../api/campaigns'
import type { CrossCampaignCompareResponse } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export function useCrossCampaignCompare(
  params: CrossCampaignParams,
): ApiResource<CrossCampaignCompareResponse> {
  const { campaignA, campaignB, startDate, endDate, minCalls, startDateB, endDateB } = params
  return useApiResource(
    (signal) =>
      fetchCrossCampaignCompare(
        { campaignA, campaignB, startDate, endDate, minCalls, startDateB, endDateB },
        signal,
      ),
    [campaignA, campaignB, startDate, endDate, minCalls, startDateB, endDateB],
    { errorMessage: 'No se pudo cargar la comparación de campañas' },
  )
}
