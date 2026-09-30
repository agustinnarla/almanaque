import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCompareDiagnostics, type CompareParams } from '../api/campaigns'
import type { CompareDiagnosticsResponse } from '../types/api'

interface State {
  data: CompareDiagnosticsResponse | null
  loading: boolean
  error: string | null
}

const IDLE: State = { data: null, loading: false, error: null }

export function useCompareDiagnostics(params: CompareParams): State & {
  reload: () => void
} {
  const [state, setState] = useState<State>(IDLE)
  const [tick, setTick] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const reload = useCallback(() => setTick((value) => value + 1), [])

  const { campaign, dateA, dateB, minCalls } = params

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState((prev) => ({ data: prev.data, loading: true, error: null }))
    fetchCompareDiagnostics({ campaign, dateA, dateB, minCalls }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ data, loading: false, error: null })
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : 'No se pudo cargar el diagnóstico'
        setState({ data: null, loading: false, error: message })
      })
    return () => controller.abort()
  }, [campaign, dateA, dateB, minCalls, tick])

  return { ...state, reload }
}
