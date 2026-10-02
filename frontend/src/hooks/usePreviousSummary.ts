import { fetchSummary } from '../api/overview'
import { previousRange } from '../lib/previousPeriod'
import type { CampaignSummary } from '../types/api'
import { useApiResource } from './useApiResource'

// Spec 059: summary of the period right before [from, to], for the KPI deltas.
export function usePreviousSummary(
  campaign: string,
  from: string,
  to: string,
): { summary: CampaignSummary | null; range: { from: string; to: string }; loading: boolean } {
  const range = previousRange(from, to)
  const { data, loading } = useApiResource(
    (signal) => fetchSummary(campaign, range.from, range.to, signal),
    [campaign, range.from, range.to],
    { errorMessage: 'No se pudo cargar el período anterior' },
  )
  return { summary: data, range, loading }
}
