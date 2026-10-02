import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TEST_CATALOG } from '../../test/catalog'
import { RangeMode } from '../RangeMode'

const idle = { data: null, loading: false, refreshing: false, error: null, reload: () => {} }

const state = vi.hoisted(() => ({
  overview: {} as Record<string, unknown>,
  diagnostics: {} as Record<string, unknown>,
}))

vi.mock('recharts', () => {
  const Box = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  const Empty = () => null
  return {
    ResponsiveContainer: Box, ComposedChart: Box, BarChart: Box,
    CartesianGrid: Empty, XAxis: Empty, YAxis: Empty, Tooltip: Empty, Legend: Empty, Line: Empty, Bar: Empty,
  }
})
vi.mock('../../hooks/useCampaignOverview', () => ({ useCampaignOverview: () => state.overview }))
vi.mock('../../hooks/useRangeDiagnostics', () => ({ useRangeDiagnostics: () => state.diagnostics }))
vi.mock('../../hooks/useRangeRecommendations', () => ({ useRangeRecommendations: () => idle }))
vi.mock('../../hooks/useRangeRankings', () => ({
  useRangeRankings: () => ({ ...idle, bases: [], devices: null, hours: null }),
}))
vi.mock('../../hooks/usePatternAlerts', () => ({ usePatternAlerts: () => ({ ...idle, alerts: [] }) }))
vi.mock('../../hooks/useSegmentPeers', () => ({ useSegmentPeers: () => ({ peers: [], loading: false, error: null }) }))
vi.mock('../../hooks/usePreviousSummary', () => ({
  usePreviousSummary: () => ({ summary: null, range: { from: '2026-08-01', to: '2026-08-31' }, loading: false }),
}))
vi.mock('../../hooks/useHeatmap', () => ({
  useHeatmap: () => ({ data: [], loading: false, refreshing: false, error: null, reload: () => {} }),
}))
vi.mock('../../hooks/useRoutingChanges', () => ({ useRoutingChanges: () => ({ changes: [], volume: [] }) }))

const summary = {
  campaign: '35',
  total_calls: 35413,
  agent_answers: 2104,
  machine_answers: 11282,
  rejected_calls: 22027,
  agent_answer_rate: 0.0594,
}

const loadedOverview = {
  summary,
  daily: [],
  hourly: [],
  devices: [],
  loading: false,
  refreshing: false,
  error: null,
  reload: () => {},
}

describe('RangeMode: carga, recarga y error', () => {
  beforeEach(() => {
    state.overview = { ...loadedOverview }
    state.diagnostics = { ...idle }
  })

  it('en la primera carga muestra el esqueleto', () => {
    state.overview = { ...loadedOverview, summary: null, loading: true }
    render(<RangeMode catalog={TEST_CATALOG} />)
    expect(screen.getByLabelText('Cargando campaña')).toBeInTheDocument()
    expect(screen.queryByText('Indicadores acumulados')).not.toBeInTheDocument()
  })

  it('al recargar deja los datos anteriores atenuados, sin esqueleto', () => {
    state.overview = { ...loadedOverview, loading: true, refreshing: true }
    render(<RangeMode catalog={TEST_CATALOG} />)
    expect(screen.queryByLabelText('Cargando campaña')).not.toBeInTheDocument()
    const kpis = screen.getByText('Indicadores acumulados')
    const wrapper = kpis.closest('[aria-busy="true"]')
    expect(wrapper).not.toBeNull()
    expect(wrapper?.className).toContain('opacity-50')
  })

  it('una sección que recarga sola se atenúa sin esqueleto', () => {
    state.diagnostics = { ...idle, loading: true, refreshing: true, data: null }
    render(<RangeMode catalog={TEST_CATALOG} />)
    const section = document.getElementById('sec-diagnostico')
    expect(section).toHaveAttribute('aria-busy', 'true')
    expect(section?.className).toContain('opacity-50')
    expect(screen.queryByLabelText('Cargando diagnóstico')).not.toBeInTheDocument()
    expect(document.getElementById('sec-kpis')?.closest('[aria-busy="true"]')).toBeNull()
  })

  it('muestra el error de la API', () => {
    state.overview = { ...loadedOverview, summary: null, error: 'Error de API: 500' }
    render(<RangeMode catalog={TEST_CATALOG} />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo cargar la campaña: Error de API: 500',
    )
  })
})
