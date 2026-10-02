import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCampaigns,
  fetchCompareDiagnostics,
  fetchCrossCampaignCompare,
  fetchCrossCampaignDiagnostics,
  fetchCrossCampaignRecommendations,
  fetchHourlyTrend,
  fetchRecommendations,
} from '../campaigns'
import {
  fetchDailySeries,
  fetchDevicesRange,
  fetchHourlyRange,
  fetchRangeDiagnostics,
  fetchRangeRecommendations,
  fetchRouting,
  fetchSummary,
} from '../overview'
import {
  fetchBasesRanking,
  fetchDevicesRanking,
  fetchHoursRanking,
  fetchPatterns,
} from '../rangeExtras'

function mockFetch(response: { ok: boolean; status?: number; body?: unknown }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status ?? 200,
    json: () => Promise.resolve(response.body ?? { ok: true }),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const RANGE = 'start_date=2026-09-01&end_date=2026-09-30'
const compare = { campaign: '35', dateA: '2026-09-14', dateB: '2026-09-15', minCalls: 50 }
const cross = { campaignA: '35', campaignB: '38', startDate: '2026-09-01', endDate: '2026-09-30', minCalls: 50 }
const CROSS = `campaign_a=35&campaign_b=38&${RANGE}&min_calls=50`
const COMPARE = 'date_a=2026-09-14&date_b=2026-09-15&min_calls=50'

// [description, call, expected URL]
const CASES: [string, (signal: AbortSignal) => Promise<unknown>, string][] = [
  ['catálogo', (s) => fetchCampaigns(s), '/api/campaigns'],
  ['resumen', (s) => fetchSummary('35', '2026-09-01', '2026-09-30', s), `/api/campaigns/35/summary?${RANGE}`],
  ['serie diaria', (s) => fetchDailySeries('35', '2026-09-01', '2026-09-30', s), `/api/campaigns/35/daily?${RANGE}`],
  ['horaria del rango', (s) => fetchHourlyRange('35', '2026-09-01', '2026-09-30', s), `/api/campaigns/35/hourly-trend?${RANGE}`],
  ['gateways del rango', (s) => fetchDevicesRange('35', '2026-09-01', '2026-09-30', s), `/api/campaigns/35/devices?${RANGE}`],
  ['ruteo', (s) => fetchRouting('35', '2026-09-01', '2026-09-30', s), `/api/campaigns/35/routing?${RANGE}`],
  ['recomendaciones del rango', (s) => fetchRangeRecommendations('35', '2026-09-01', '2026-09-30', 50, s), `/api/campaigns/35/recommendations?${RANGE}&min_calls=50`],
  ['diagnóstico del rango', (s) => fetchRangeDiagnostics('35', '2026-09-01', '2026-09-30', 50, s), `/api/campaigns/35/diagnostics?${RANGE}&min_calls=50`],
  ['ranking de bases', (s) => fetchBasesRanking('35', '2026-09-01', '2026-09-30', 50, s), `/api/campaigns/35/bases-ranking?${RANGE}&min_calls=50`],
  ['ranking de dispositivos', (s) => fetchDevicesRanking('35', '2026-09-01', '2026-09-30', 50, 5, s), `/api/campaigns/35/devices/ranking?${RANGE}&min_calls=50&limit=5`],
  ['ranking de horas', (s) => fetchHoursRanking('35', '2026-09-01', '2026-09-30', 50, 5, s), `/api/campaigns/35/hours/ranking?${RANGE}&min_calls=50&limit=5`],
  ['patrones', (s) => fetchPatterns('2026-09-01', '2026-09-30', 50, s), `/api/patterns?${RANGE}&min_calls=50`],
  ['diagnóstico de 2 días', (s) => fetchCompareDiagnostics(compare, s), `/api/campaigns/35/compare/diagnostics?${COMPARE}`],
  ['recomendaciones de 2 días', (s) => fetchRecommendations(compare, s), `/api/campaigns/35/compare/recommendations?${COMPARE}`],
  ['horaria de un día', (s) => fetchHourlyTrend('35', '2026-09-14', s), '/api/campaigns/35/hourly-trend?start_date=2026-09-14&end_date=2026-09-14'],
  ['comparar campañas', (s) => fetchCrossCampaignCompare(cross, s), `/api/campaigns/compare-campaigns?${CROSS}`],
  ['diagnóstico entre campañas', (s) => fetchCrossCampaignDiagnostics(cross, s), `/api/campaigns/compare-campaigns/diagnostics?${CROSS}`],
  ['recomendaciones entre campañas', (s) => fetchCrossCampaignRecommendations(cross, s), `/api/campaigns/compare-campaigns/recommendations?${CROSS}`],
]

describe('api', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each(CASES)('%s: pide la URL esperada con la señal y devuelve el JSON', async (_name, call, url) => {
    const fetchMock = mockFetch({ ok: true, body: { dato: 1 } })
    const signal = new AbortController().signal

    await expect(call(signal)).resolves.toEqual({ dato: 1 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(url, { signal })
  })

  it.each(CASES)('%s: ante un HTTP no OK lanza «Error de API: <código>»', async (_name, call) => {
    mockFetch({ ok: false, status: 500 })
    await expect(call(new AbortController().signal)).rejects.toThrow('Error de API: 500')
  })

  it('compara semanas: suma el rango B solo si viene completo', async () => {
    const fetchMock = mockFetch({ ok: true })
    const weeks = { ...cross, campaignB: '35', startDateB: '2026-09-21', endDateB: '2026-09-27' }
    await fetchCrossCampaignCompare(weeks)
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/campaigns/compare-campaigns?campaign_a=35&campaign_b=35&start_date=2026-09-01&end_date=2026-09-30' +
        '&min_calls=50&start_date_b=2026-09-21&end_date_b=2026-09-27',
    )
    await fetchCrossCampaignDiagnostics({ ...cross, startDateB: '2026-09-21' })
    expect(fetchMock.mock.calls[1][0]).toBe(`/api/campaigns/compare-campaigns/diagnostics?${CROSS}`)
  })

  it('codifica la campaña en la URL', async () => {
    const fetchMock = mockFetch({ ok: true })
    await fetchSummary('Sin Campaña/1', '2026-09-01', '2026-09-30')
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/campaigns/Sin%20Campa%C3%B1a%2F1/summary?${RANGE}`)
  })
})
