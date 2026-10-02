import type {
  CampaignSummary,
  DailyTrendPoint,
  DeviceRangeRow,
  HourDeviceRow,
  HourlyTrendPoint,
  RangeDiagnosticsResponse,
  RangeRecommendationsResponse,
  RoutingResponse,
} from '../types/api'

async function fetchJson<T>(
  campaign: string,
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> {
  const query = new URLSearchParams(params)
  const response = await fetch(
    `/api/campaigns/${encodeURIComponent(campaign)}/${path}?${query}`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as T
}

export function fetchSummary(
  campaign: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<CampaignSummary> {
  return fetchJson(campaign, 'summary', { start_date: from, end_date: to }, signal)
}

export function fetchDailySeries(
  campaign: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<DailyTrendPoint[]> {
  return fetchJson(campaign, 'daily', { start_date: from, end_date: to }, signal)
}

export function fetchHourlyRange(
  campaign: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<HourlyTrendPoint[]> {
  return fetchJson(campaign, 'hourly-trend', { start_date: from, end_date: to }, signal)
}

export function fetchDevicesRange(
  campaign: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<DeviceRangeRow[]> {
  return fetchJson(campaign, 'devices', { start_date: from, end_date: to }, signal)
}

export function fetchRangeRecommendations(
  campaign: string,
  from: string,
  to: string,
  minCalls: number,
  signal?: AbortSignal,
): Promise<RangeRecommendationsResponse> {
  return fetchJson(
    campaign,
    'recommendations',
    { start_date: from, end_date: to, min_calls: String(minCalls) },
    signal,
  )
}

export function fetchRouting(
  campaign: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<RoutingResponse> {
  return fetchJson(campaign, 'routing', { start_date: from, end_date: to }, signal)
}

export function fetchRangeDiagnostics(
  campaign: string,
  from: string,
  to: string,
  minCalls: number,
  signal?: AbortSignal,
): Promise<RangeDiagnosticsResponse> {
  return fetchJson(
    campaign,
    'diagnostics',
    { start_date: from, end_date: to, min_calls: String(minCalls) },
    signal,
  )
}

export function fetchHeatmap(
  campaign: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<HourDeviceRow[]> {
  return fetchJson(campaign, 'heatmap', { start_date: from, end_date: to }, signal)
}
