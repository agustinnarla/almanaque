import { fetchSummary } from '../api/overview'
import { sameSegment } from '../lib/catalog'
import type { PeerSummary } from '../lib/executiveSummary'
import type { CampaignCatalogEntry } from '../types/api'
import { useApiResource } from './useApiResource'

export interface SegmentPeersParams {
  catalog: CampaignCatalogEntry[]
  campaign: string
  from: string
  to: string
}

interface State {
  peers: PeerSummary[] | null
  loading: boolean
  error: string | null
}

// Summaries of the *other* campaigns of the same business segment, same range.
export function useSegmentPeers(params: SegmentPeersParams): State {
  const { catalog, campaign, from, to } = params
  const peerIds = sameSegment(catalog, campaign)
    .map((entry) => entry.campaign)
    .filter((id) => id !== campaign)

  const { data, loading, error } = useApiResource(
    async (signal) => {
      const summaries = await Promise.all(
        peerIds.map((id) => fetchSummary(id, from, to, signal)),
      )
      return summaries.map((summary) => ({
        campaign: summary.campaign,
        total_calls: summary.total_calls,
        agent_answers: summary.agent_answers,
      }))
    },
    [peerIds.join(','), from, to],
    { errorMessage: 'No se pudo cargar el resto del segmento' },
  )
  return { peers: data, loading, error }
}
