import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FULL_CATALOG } from '../../test/catalog'
import { useCampaignOverview } from '../useCampaignOverview'
import { useCampaigns } from '../useCampaigns'
import { useCompareDiagnostics } from '../useCompareDiagnostics'
import { useCrossCampaignCompare } from '../useCrossCampaignCompare'
import { useCrossCampaignDiagnostics } from '../useCrossCampaignDiagnostics'
import { useCrossCampaignRecommendations } from '../useCrossCampaignRecommendations'
import { useHeatmap } from '../useHeatmap'
import { useHourlyTrend } from '../useHourlyTrend'
import { usePatternAlerts } from '../usePatternAlerts'
import { useRangeDiagnostics } from '../useRangeDiagnostics'
import { useRangeRankings } from '../useRangeRankings'
import { useRangeRecommendations } from '../useRangeRecommendations'
import { useRecommendations } from '../useRecommendations'
import { useRoutingChanges } from '../useRoutingChanges'
import { useSegmentPeers } from '../useSegmentPeers'

// Fake API: answers by path, echoing what the hooks need to map.
function respond(url: string): unknown {
  const { pathname, searchParams } = new URL(url, 'http://test')
  const summary = /^\/api\/campaigns\/([^/]+)\/summary$/.exec(pathname)
  if (summary) {
    return { campaign: decodeURIComponent(summary[1]), total_calls: 100, agent_answers: 7, extra: 'x' }
  }
  if (pathname.endsWith('/hourly-trend')) {
    return [{ hora: 9, fecha: searchParams.get('start_date') }]
  }
  if (pathname.endsWith('/routing')) {
    return { days: [], changes: [{ date: '2026-09-09' }], volume: [{ fecha: '2026-09-09' }] }
  }
  return { path: pathname }
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn((url: string) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(respond(url)) }),
  )
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const range = { campaign: '35', from: '2026-09-01', to: '2026-09-30' }
const compare = { campaign: '35', dateA: '2026-09-14', dateB: '2026-09-15', minCalls: 50 }
const cross = { campaignA: '35', campaignB: '38', startDate: '2026-09-01', endDate: '2026-09-30', minCalls: 50 }

async function settle<T extends { loading: boolean }>(hook: () => T) {
  const rendered = renderHook(hook)
  await waitFor(() => expect(rendered.result.current.loading).toBe(false))
  return rendered
}

describe('hooks de datos', () => {
  it('useCampaignOverview junta resumen, serie, horas y gateways', async () => {
    const { result } = await settle(() => useCampaignOverview(range))
    expect(result.current.summary).toMatchObject({ campaign: '35', total_calls: 100 })
    expect(result.current.daily).toEqual({ path: '/api/campaigns/35/daily' })
    expect(result.current.hourly).toEqual([{ hora: 9, fecha: '2026-09-01' }])
    expect(result.current.devices).toEqual({ path: '/api/campaigns/35/devices' })
    expect(result.current.refreshing).toBe(false)
  })

  it('useHourlyTrend pide un día por serie', async () => {
    const { result } = await settle(() => useHourlyTrend('35', '2026-09-14', '2026-09-15'))
    expect(result.current.pointsA).toEqual([{ hora: 9, fecha: '2026-09-14' }])
    expect(result.current.pointsB).toEqual([{ hora: 9, fecha: '2026-09-15' }])
  })

  it('useRangeRankings trae bases, dispositivos y horas', async () => {
    const { result } = await settle(() => useRangeRankings({ ...range, minCalls: 50, limit: 5 }))
    expect(result.current.bases).toEqual({ path: '/api/campaigns/35/bases-ranking' })
    expect(result.current.devices).toEqual({ path: '/api/campaigns/35/devices/ranking' })
    expect(result.current.hours).toEqual({ path: '/api/campaigns/35/hours/ranking' })
  })

  it('useRoutingChanges expone cambios y volumen', async () => {
    const { result } = renderHook(() => useRoutingChanges(range))
    expect(result.current).toEqual({ changes: [], volume: [] })
    await waitFor(() => expect(result.current.changes).toHaveLength(1))
    expect(result.current.volume).toEqual([{ fecha: '2026-09-09' }])
  })

  it('useSegmentPeers resume las otras campañas del mismo segmento', async () => {
    const { result } = await settle(() => useSegmentPeers({ catalog: FULL_CATALOG, ...range }))
    expect(result.current.peers).toEqual([{ campaign: '38', total_calls: 100, agent_answers: 7 }])
  })

  it.each([
    ['useCampaigns', () => useCampaigns(), 'campaigns', '/api/campaigns'],
    ['usePatternAlerts', () => usePatternAlerts({ from: '2026-09-01', to: '2026-09-30', minCalls: 50 }), 'alerts', '/api/patterns'],
    ['useRangeDiagnostics', () => useRangeDiagnostics({ ...range, minCalls: 50 }), 'data', '/api/campaigns/35/diagnostics'],
    ['useHeatmap', () => useHeatmap('35', '2026-09-01', '2026-09-30'), 'data', '/api/campaigns/35/heatmap'],
    ['useRangeRecommendations', () => useRangeRecommendations({ ...range, minCalls: 50 }), 'data', '/api/campaigns/35/recommendations'],
    ['useCompareDiagnostics', () => useCompareDiagnostics(compare), 'data', '/api/campaigns/35/compare/diagnostics'],
    ['useRecommendations', () => useRecommendations(compare), 'data', '/api/campaigns/35/compare/recommendations'],
    ['useCrossCampaignCompare', () => useCrossCampaignCompare(cross), 'data', '/api/campaigns/compare-campaigns'],
    ['useCrossCampaignDiagnostics', () => useCrossCampaignDiagnostics(cross), 'data', '/api/campaigns/compare-campaigns/diagnostics'],
    ['useCrossCampaignRecommendations', () => useCrossCampaignRecommendations(cross), 'data', '/api/campaigns/compare-campaigns/recommendations'],
  ] as const)('%s devuelve la respuesta de su endpoint', async (_name, hook, field, path) => {
    const { result } = await settle(hook as () => { loading: boolean })
    expect((result.current as Record<string, unknown>)[field]).toEqual({ path })
  })

  it('un error HTTP llega como mensaje y sin datos', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve({}) })
    const { result } = await settle(() => useRangeRankings({ ...range, minCalls: 50, limit: 5 }))
    expect(result.current.error).toBe('Error de API: 503')
    expect(result.current.bases).toBeNull()
  })
})
