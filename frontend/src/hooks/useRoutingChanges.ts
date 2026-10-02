import { fetchRouting } from '../api/overview'
import type { RoutingChange, TrunkVolumeRow } from '../types/api'
import { useApiResource } from './useApiResource'

export interface RoutingParams {
  campaign: string
  from: string
  to: string
}

export function useRoutingChanges(params: RoutingParams): {
  changes: RoutingChange[]
  volume: TrunkVolumeRow[]
} {
  const { campaign, from, to } = params
  const { data } = useApiResource(
    (signal) => fetchRouting(campaign, from, to, signal),
    [campaign, from, to],
    { errorMessage: 'No se pudieron cargar los cambios de ruteo' },
  )
  return { changes: data?.changes ?? [], volume: data?.volume ?? [] }
}
