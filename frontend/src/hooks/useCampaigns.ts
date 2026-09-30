import { fetchCampaigns } from '../api/campaigns'
import type { CampaignCatalogEntry } from '../types/api'
import { useApiResource } from './useApiResource'

interface State {
  campaigns: CampaignCatalogEntry[] | null
  loading: boolean
  error: string | null
}

export function useCampaigns(): State & { reload: () => void } {
  const { data, loading, error, reload } = useApiResource(
    (signal) => fetchCampaigns(signal),
    [],
    { errorMessage: 'No se pudo cargar la lista de campañas' },
  )
  return { campaigns: data, loading, error, reload }
}
