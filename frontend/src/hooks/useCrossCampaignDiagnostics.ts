import {
  fetchCrossCampaignDiagnostics,
  type CrossCampaignParams,
} from '../api/campaigns'
import type { CrossCampaignDiagnosticsResponse } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export function useCrossCampaignDiagnostics(
  params: CrossCampaignParams,
): ApiResource<CrossCampaignDiagnosticsResponse> {
  const { campaignA, campaignB, startDate, endDate, minCalls, startDateB, endDateB } = params
  return useApiResource(
    (signal) =>
      fetchCrossCampaignDiagnostics(
        { campaignA, campaignB, startDate, endDate, minCalls, startDateB, endDateB },
        signal,
      ),
    [campaignA, campaignB, startDate, endDate, minCalls, startDateB, endDateB],
    { errorMessage: 'No se pudo cargar el diagnóstico entre campañas' },
  )
}
