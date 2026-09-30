import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchHourlyTrend } from '../api/campaigns'
import type { HourlyTrendPoint } from '../types/api'

interface State {
  pointsA: HourlyTrendPoint[]
  pointsB: HourlyTrendPoint[]
  loading: boolean
  error: string | null
}

const IDLE: State = { pointsA: [], pointsB: [], loading: false, error: null }

export function useHourlyTrend(
  campaign: string,
  dateA: string,
  dateB: string,
): State & { reload: () => void } {
  const [state, setState] = useState<State>(IDLE)
  const [tick, setTick] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const reload = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState((prev) => ({
      pointsA: prev.pointsA,
      pointsB: prev.pointsB,
      loading: true,
      error: null,
    }))

    Promise.all([
      fetchHourlyTrend(campaign, dateA, controller.signal),
      fetchHourlyTrend(campaign, dateB, controller.signal),
    ])
      .then(([pointsA, pointsB]) => {
        if (!controller.signal.aborted) {
          setState({ pointsA, pointsB, loading: false, error: null })
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : 'No se pudo cargar la tendencia horaria'
        setState({ pointsA: [], pointsB: [], loading: false, error: message })
      })

    return () => controller.abort()
  }, [campaign, dateA, dateB, tick])

  return { ...state, reload }
}
