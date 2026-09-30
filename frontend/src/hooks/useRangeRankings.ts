import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchBasesRanking,
  fetchDevicesRanking,
  fetchHoursRanking,
} from '../api/rangeExtras'
import type { BaseRankingRow, SegmentRankingResponse } from '../types/api'

export interface RangeRankingsParams {
  campaign: string
  from: string
  to: string
  minCalls: number
  limit: number
}

interface State {
  bases: BaseRankingRow[] | null
  devices: SegmentRankingResponse | null
  hours: SegmentRankingResponse | null
  loading: boolean
  error: string | null
}

const IDLE: State = {
  bases: null,
  devices: null,
  hours: null,
  loading: false,
  error: null,
}

export function useRangeRankings(params: RangeRankingsParams): State & {
  reload: () => void
} {
  const [state, setState] = useState<State>(IDLE)
  const [tick, setTick] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const reload = useCallback(() => setTick((value) => value + 1), [])

  const { campaign, from, to, minCalls, limit } = params

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState((prev) => ({ ...prev, loading: true, error: null }))
    Promise.all([
      fetchBasesRanking(campaign, from, to, controller.signal),
      fetchDevicesRanking(campaign, from, to, minCalls, limit, controller.signal),
      fetchHoursRanking(campaign, from, to, minCalls, limit, controller.signal),
    ])
      .then(([bases, devices, hours]) => {
        if (!controller.signal.aborted) {
          setState({ bases, devices, hours, loading: false, error: null })
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los rankings'
        setState({ bases: null, devices: null, hours: null, loading: false, error: message })
      })
    return () => controller.abort()
  }, [campaign, from, to, minCalls, limit, tick])

  return { ...state, reload }
}
