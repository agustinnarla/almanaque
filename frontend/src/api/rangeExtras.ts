import type { BaseRankingRow, PatternAlert, SegmentRankingResponse } from '../types/api'

async function fetchJson<T>(
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Error de API: ${response.status}`)
  }
  return (await response.json()) as T
}

function rangeQuery(from: string, to: string): URLSearchParams {
  return new URLSearchParams({ start_date: from, end_date: to })
}

export function fetchBasesRanking(
  campaign: string,
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<BaseRankingRow[]> {
  const query = rangeQuery(from, to)
  return fetchJson(
    `/api/campaigns/${encodeURIComponent(campaign)}/bases-ranking?${query}`,
    signal,
  )
}

function fetchSegmentRanking(
  path: 'devices' | 'hours',
  campaign: string,
  from: string,
  to: string,
  minCalls: number,
  limit: number,
  signal?: AbortSignal,
): Promise<SegmentRankingResponse> {
  const query = rangeQuery(from, to)
  query.set('min_calls', String(minCalls))
  query.set('limit', String(limit))
  return fetchJson(
    `/api/campaigns/${encodeURIComponent(campaign)}/${path}/ranking?${query}`,
    signal,
  )
}

export function fetchDevicesRanking(
  campaign: string,
  from: string,
  to: string,
  minCalls: number,
  limit: number,
  signal?: AbortSignal,
): Promise<SegmentRankingResponse> {
  return fetchSegmentRanking('devices', campaign, from, to, minCalls, limit, signal)
}

export function fetchHoursRanking(
  campaign: string,
  from: string,
  to: string,
  minCalls: number,
  limit: number,
  signal?: AbortSignal,
): Promise<SegmentRankingResponse> {
  return fetchSegmentRanking('hours', campaign, from, to, minCalls, limit, signal)
}

export function fetchPatterns(
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<PatternAlert[]> {
  const query = rangeQuery(from, to)
  return fetchJson(`/api/patterns?${query}`, signal)
}
