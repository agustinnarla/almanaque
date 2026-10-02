import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TEST_CATALOG } from '../../test/catalog'
import { CampaignsCompareMode } from '../CampaignsCompareMode'
import { CompareMode } from '../CompareMode'

const idle = { data: null, loading: false, refreshing: false, error: null, reload: () => {} }

const state = vi.hoisted(() => ({
  compare: {} as Record<string, unknown>,
  cross: {} as Record<string, unknown>,
}))

vi.mock('recharts', () => {
  const Box = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  const Empty = () => null
  return {
    ResponsiveContainer: Box, ComposedChart: Box, BarChart: Box,
    CartesianGrid: Empty, XAxis: Empty, YAxis: Empty, Tooltip: Empty, Legend: Empty, Line: Empty, Bar: Empty,
  }
})
vi.mock('../../hooks/useCompareDiagnostics', () => ({ useCompareDiagnostics: () => state.compare }))
vi.mock('../../hooks/useRecommendations', () => ({ useRecommendations: () => idle }))
vi.mock('../../hooks/useHourlyTrend', () => ({
  useHourlyTrend: () => ({ ...idle, pointsA: [], pointsB: [] }),
}))
vi.mock('../../hooks/useCrossCampaignCompare', () => ({ useCrossCampaignCompare: () => state.cross }))
vi.mock('../../hooks/useCrossCampaignDiagnostics', () => ({ useCrossCampaignDiagnostics: () => idle }))
vi.mock('../../hooks/useCrossCampaignRecommendations', () => ({ useCrossCampaignRecommendations: () => idle }))
vi.mock('../../hooks/useRangeRankings', () => ({
  useRangeRankings: () => ({ ...idle, bases: [], devices: null, hours: null }),
}))
vi.mock('../../hooks/usePatternAlerts', () => ({ usePatternAlerts: () => ({ ...idle, alerts: [] }) }))

const compareData = {
  campaign: '35',
  date_a: '2026-09-14',
  date_b: '2026-09-15',
  min_calls_applied: 50,
  summary: null,
  root_causes: [],
  positive_drivers: [],
  gateways_comparison: [],
}

describe('Comparar 2 días: carga, recarga y error', () => {
  beforeEach(() => {
    state.compare = { ...idle, data: compareData }
  })

  it('en la primera carga muestra el esqueleto', () => {
    state.compare = { ...idle, loading: true }
    render(<CompareMode catalog={TEST_CATALOG} />)
    expect(screen.getByLabelText('Cargando')).toBeInTheDocument()
  })

  it('al recargar deja el diagnóstico anterior atenuado, sin esqueleto', () => {
    state.compare = { ...idle, data: compareData, loading: true, refreshing: true }
    render(<CompareMode catalog={TEST_CATALOG} />)
    expect(screen.queryByLabelText('Cargando')).not.toBeInTheDocument()
    const wrapper = screen.getByText('Indicadores clave').closest('[aria-busy="true"]')
    expect(wrapper?.className).toContain('opacity-50')
  })

  it('muestra el error de la API', () => {
    state.compare = { ...idle, error: 'Error de API: 502' }
    render(<CompareMode catalog={TEST_CATALOG} />)
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar el diagnóstico: Error de API: 502')
  })
})

describe('Comparar campañas: carga y error', () => {
  it('en la primera carga muestra el esqueleto', () => {
    state.cross = { ...idle, loading: true }
    render(<CampaignsCompareMode catalog={TEST_CATALOG} />)
    expect(screen.getAllByLabelText(/Cargando/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra el error de la API', () => {
    state.cross = { ...idle, error: 'Error de API: 500' }
    render(<CampaignsCompareMode catalog={TEST_CATALOG} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Error de API: 500')
  })
})
