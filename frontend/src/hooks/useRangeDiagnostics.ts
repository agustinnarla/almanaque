import { fetchRangeDiagnostics } from '../api/overview'
import type { RangeDiagnosticsResponse } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export interface DiagnosticsRangeParams {
  campaign: string
  from: string
  to: string
  minCalls: number
}

export function useRangeDiagnostics(
  params: DiagnosticsRangeParams,
): ApiResource<RangeDiagnosticsResponse> {
  const { campaign, from, to, minCalls } = params
  return useApiResource(
    (signal) => fetchRangeDiagnostics(campaign, from, to, minCalls, signal),
    [campaign, from, to, minCalls],
    { errorMessage: 'No se pudo cargar el diagnóstico' },
  )
}
