import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchDailySeries,
  fetchDevicesRange,
  fetchHourlyRange,
  fetchSummary,
} from '../api/overview'
import type {
  CampaignSummary,
  DailyTrendPoint,
  DeviceRangeRow,
  HourlyTrendPoint,
} from '../types/api'

export interface RangeParams {
  campaign: string
  from: string
  to: string
}

interface State {
  summary: CampaignSummary | null
  daily: DailyTrendPoint[]
  hourly: HourlyTrendPoint[]
  devices: DeviceRangeRow[]
  loading: boolean
  error: string | null
}

const IDLE: State = {
  summary: null,
  daily: [],
  hourly: [],
  devices: [],
  loading: false,
  error: null,
}

export function useCampaignOverview(
  params: RangeParams,
): State & { reload: () => void } {
  const [state, setState] = useState<State>(IDLE)
  const [tick, setTick] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const reload = useCallback(() => setTick((value) => value + 1), [])

  const { campaign, from, to } = params

  useEffect(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setState((prev) => ({
      summary: prev.summary,
      daily: prev.daily,
      hourly: prev.hourly,
      devices: prev.devices,
      loading: true,
      error: null,
    }))

    Promise.all([
      fetchSummary(campaign, from, to, controller.signal),
      fetchDailySeries(campaign, from, to, controller.signal),
      fetchHourlyRange(campaign, from, to, controller.signal),
      fetchDevicesRange(campaign, from, to, controller.signal),
    ])
      .then(([summary, daily, hourly, devices]) => {
        if (!controller.signal.aborted) {
          setState({ summary, daily, hourly, devices, loading: false, error: null })
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error ? err.message : 'No se pudo cargar la campaña'
        setState((prev) => ({
          summary: prev.summary,
          daily: prev.daily,
          hourly: prev.hourly,
          devices: prev.devices,
          loading: false,
          error: message,
        }))
      })

    return () => controller.abort()
  }, [campaign, from, to, tick])

  return { ...state, reload }
}
