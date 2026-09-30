import { fetchCompareDiagnostics, type CompareParams } from '../api/campaigns'
import type { CompareDiagnosticsResponse } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export function useCompareDiagnostics(
  params: CompareParams,
): ApiResource<CompareDiagnosticsResponse> {
  const { campaign, dateA, dateB, minCalls } = params
  return useApiResource(
    (signal) =>
      fetchCompareDiagnostics({ campaign, dateA, dateB, minCalls }, signal),
    [campaign, dateA, dateB, minCalls],
    { errorMessage: 'No se pudo cargar el diagnóstico' },
  )
}
