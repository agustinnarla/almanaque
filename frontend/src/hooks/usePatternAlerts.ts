import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchPatterns } from '../api/rangeExtras'
import type { PatternAlert } from '../types/api'

export interface PatternAlertsParams {
  from: string
  to: string
}

interface State {
  alerts: PatternAlert[] | null
  loading: boolean
  error: string | null
}

const IDLE: State = { alerts: null, loading: false, error: null }

export function usePatternAlerts(params: PatternAlertsParams): State & {
  reload: () => void
} {
  const [state, setState] = useState<State>(IDLE)
  const [tick, setTick] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const reload = useCallback(() => setTick((value) => value + 1), [])

  const { from, to } = params

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState((prev) => ({ ...prev, loading: true, error: null }))
    fetchPatterns(from, to, controller.signal)
      .then((alerts) => {
        if (!controller.signal.aborted) {
          setState({ alerts, loading: false, error: null })
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar las alertas de patrones'
        setState({ alerts: null, loading: false, error: message })
      })
    return () => controller.abort()
  }, [from, to, tick])

  return { ...state, reload }
}
