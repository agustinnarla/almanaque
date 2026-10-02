import type { Methodology } from '../types/api'

export async function fetchMethodology(signal?: AbortSignal): Promise<Methodology> {
  const response = await fetch('/api/methodology', { signal })
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as Methodology
}
