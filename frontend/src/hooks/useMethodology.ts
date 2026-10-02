import { fetchMethodology } from '../api/methodology'
import type { Methodology } from '../types/api'
import { useApiResource, type ApiResource } from './useApiResource'

// Loaded when the modal mounts (it only mounts while open).
export function useMethodology(): ApiResource<Methodology> {
  return useApiResource((signal) => fetchMethodology(signal), [], {
    errorMessage: 'No se pudo cargar la metodología',
  })
}
