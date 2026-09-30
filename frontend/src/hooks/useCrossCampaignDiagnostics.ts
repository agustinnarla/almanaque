import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchCrossCampaignDiagnostics,
  type CrossCampaignParams,
} from '../api/campaigns'
import type { CrossCampaignDiagnosticsResponse } from '../types/api'

interface State {
  data: CrossCampaignDiagnosticsResponse | null
  loading: boolean
  error: string | null
}

const IDLE: State = { data: null, loading: false, error: null }

export function useCrossCampaignDiagnostics(params: CrossCampaignParams): State & {
  reload: () => void
} {
  const [state, setState] = useState<State>(IDLE)
  const [tick, setTick] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const reload = useCallback(() => setTick((value) => value + 1), [])

  const { campaignA, campaignB, startDate, endDate, minCalls } = params

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState((prev) => ({ data: prev.data, loading: true, error: null }))
    fetchCrossCampaignDiagnostics(
      { campaignA, campaignB, startDate, endDate, minCalls },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, loading: false, error: null })
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el diagnóstico entre campañas'
        setState({ data: null, loading: false, error: message })
      })
    return () => controller.abort()
  }, [campaignA, campaignB, startDate, endDate, minCalls, tick])

  return { ...state, reload }
}
