import type {
  CampaignCatalogEntry,
  CompareDiagnosticsResponse,
  CrossCampaignCompareResponse,
  CrossCampaignDiagnosticsResponse,
  CrossCampaignRecommendationsResponse,
  HourlyTrendPoint,
  RecommendationsResponse,
} from '../types/api'

export interface CompareParams {
  campaign: string
  dateA: string
  dateB: string
  minCalls: number
}

export interface CrossCampaignParams {
  campaignA: string
  campaignB: string
  startDate: string
  endDate: string
  minCalls: number
  // Spec 057: side B's own range (week vs week); omitted = same as side A.
  startDateB?: string
  endDateB?: string
}

function crossQuery(params: CrossCampaignParams): URLSearchParams {
  const query = new URLSearchParams({
    campaign_a: params.campaignA,
    campaign_b: params.campaignB,
    start_date: params.startDate,
    end_date: params.endDate,
    min_calls: String(params.minCalls),
  })
  if (params.startDateB && params.endDateB) {
    query.set('start_date_b', params.startDateB)
    query.set('end_date_b', params.endDateB)
  }
  return query
}

export async function fetchCampaigns(
  signal?: AbortSignal,
): Promise<CampaignCatalogEntry[]> {
  const response = await fetch('/api/campaigns', { signal })
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as CampaignCatalogEntry[]
}

export async function fetchCompareDiagnostics(
  params: CompareParams,
  signal?: AbortSignal,
): Promise<CompareDiagnosticsResponse> {
  const query = new URLSearchParams({
    date_a: params.dateA,
    date_b: params.dateB,
    min_calls: String(params.minCalls),
  })
  const response = await fetch(
    `/api/campaigns/${encodeURIComponent(params.campaign)}/compare/diagnostics?${query}`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as CompareDiagnosticsResponse
}

export async function fetchCrossCampaignCompare(
  params: CrossCampaignParams,
  signal?: AbortSignal,
): Promise<CrossCampaignCompareResponse> {
  const query = crossQuery(params)
  const response = await fetch(
    `/api/campaigns/compare-campaigns?${query}`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as CrossCampaignCompareResponse
}

export async function fetchCrossCampaignDiagnostics(
  params: CrossCampaignParams,
  signal?: AbortSignal,
): Promise<CrossCampaignDiagnosticsResponse> {
  const query = crossQuery(params)
  const response = await fetch(
    `/api/campaigns/compare-campaigns/diagnostics?${query}`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as CrossCampaignDiagnosticsResponse
}

export async function fetchCrossCampaignRecommendations(
  params: CrossCampaignParams,
  signal?: AbortSignal,
): Promise<CrossCampaignRecommendationsResponse> {
  const query = crossQuery(params)
  const response = await fetch(
    `/api/campaigns/compare-campaigns/recommendations?${query}`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as CrossCampaignRecommendationsResponse
}

export async function fetchRecommendations(
  params: CompareParams,
  signal?: AbortSignal,
): Promise<RecommendationsResponse> {
  const query = new URLSearchParams({
    date_a: params.dateA,
    date_b: params.dateB,
    min_calls: String(params.minCalls),
  })
  const response = await fetch(
    `/api/campaigns/${encodeURIComponent(params.campaign)}/compare/recommendations?${query}`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as RecommendationsResponse
}

export async function fetchHourlyTrend(
  campaign: string,
  date: string,
  signal?: AbortSignal,
): Promise<HourlyTrendPoint[]> {
  const query = new URLSearchParams({ start_date: date, end_date: date })
  const response = await fetch(
    `/api/campaigns/${encodeURIComponent(campaign)}/hourly-trend?${query}`,
    { signal },
  )
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as HourlyTrendPoint[]
}
