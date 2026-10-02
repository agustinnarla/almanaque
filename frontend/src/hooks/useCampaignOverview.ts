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
import { useApiResource } from './useApiResource'

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
  refreshing: boolean
  error: string | null
}

export function useCampaignOverview(
  params: RangeParams,
): State & { reload: () => void } {
  const { campaign, from, to } = params

  const { data, loading, refreshing, error, reload } = useApiResource(
    async (signal) => {
      const [summary, daily, hourly, devices] = await Promise.all([
        fetchSummary(campaign, from, to, signal),
        fetchDailySeries(campaign, from, to, signal),
        fetchHourlyRange(campaign, from, to, signal),
        fetchDevicesRange(campaign, from, to, signal),
      ])
      return { summary, daily, hourly, devices }
    },
    [campaign, from, to],
    { errorMessage: 'No se pudo cargar la campaña', keepDataOnError: true },
  )

  return {
    summary: data?.summary ?? null,
    daily: data?.daily ?? [],
    hourly: data?.hourly ?? [],
    devices: data?.devices ?? [],
    loading,
    refreshing,
    error,
    reload,
  }
}
