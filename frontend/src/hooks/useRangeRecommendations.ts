import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchRangeRecommendations } from '../api/overview'
import type { RangeRecommendationsResponse } from '../types/api'

export interface RangeRecommendationsParams {
  campaign: string
  from: string
  to: string
  minCalls: number
}

interface State {
  data: RangeRecommendationsResponse | null
  loading: boolean
  error: string | null
}

const IDLE: State = { data: null, loading: false, error: null }

export function useRangeRecommendations(
  params: RangeRecommendationsParams,
): State & { reload: () => void } {
  const [state, setState] = useState<State>(IDLE)
  const [tick, setTick] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const reload = useCallback(() => setTick((value) => value + 1), [])

  const { campaign, from, to, minCalls } = params

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState((prev) => ({ data: prev.data, loading: true, error: null }))
    fetchRangeRecommendations(campaign, from, to, minCalls, controller.signal)
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
            : 'No se pudieron cargar las recomendaciones'
        setState({ data: null, loading: false, error: message })
      })
    return () => controller.abort()
  }, [campaign, from, to, minCalls, tick])

  return { ...state, reload }
}
