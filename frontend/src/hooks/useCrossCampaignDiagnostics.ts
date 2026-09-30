import {
  fetchCrossCampaignDiagnostics,
  type CrossCampaignParams,
} from '../api/campaigns'
import type { CrossCampaignDiagnosticsResponse } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export function useCrossCampaignDiagnostics(
  params: CrossCampaignParams,
): ApiResource<CrossCampaignDiagnosticsResponse> {
  const { campaignA, campaignB, startDate, endDate, minCalls } = params
  return useApiResource(
    (signal) =>
      fetchCrossCampaignDiagnostics(
        { campaignA, campaignB, startDate, endDate, minCalls },
        signal,
      ),
    [campaignA, campaignB, startDate, endDate, minCalls],
    { errorMessage: 'No se pudo cargar el diagnóstico entre campañas' },
  )
}
