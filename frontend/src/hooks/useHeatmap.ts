import { fetchHeatmap } from '../api/overview'
import type { HourDeviceRow } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

export function useHeatmap(campaign: string, from: string, to: string): ApiResource<HourDeviceRow[]> {
  return useApiResource((signal) => fetchHeatmap(campaign, from, to, signal), [campaign, from, to], {
    errorMessage: 'No se pudo cargar el mapa de calor',
  })
}
