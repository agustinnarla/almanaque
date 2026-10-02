import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../hooks/useCampaignOverview', () => ({
  useCampaignOverview: () => ({
    summary: null,
    devices: [],
    daily: [],
    hourly: [],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))

vi.mock('../hooks/useRangeRankings', () => ({
  useRangeRankings: () => ({
    bases: [
      { base: '34', agent_answer_rate: 0.4495, total_calls: 198 },
      { base: '76', agent_answer_rate: 0.4118, total_calls: 17 },
      { base: '80', agent_answer_rate: 0.057, total_calls: 35198 },
    ],
    devices: {
      min_calls_applied: 50,
      limit_applied: 5,
      best: [
        {
          device: 'IPLAN',
          total_calls: 16625,
          agent_answer_rate: 0.0719,
          busy_rate: 0.0256,
          congestion_rate: 0.0168,
          health_score: 3.38,
        },
      ],
      worst: [
        {
          device: 'GW37',
          total_calls: 900,
          agent_answer_rate: 0.03,
          busy_rate: 0.4,
          congestion_rate: 0.05,
          health_score: -25.67,
        },
      ],
    },
    hours: {
      min_calls_applied: 50,
      limit_applied: 5,
      best: [
        {
          hora: 16,
          total_calls: 2446,
          agent_answer_rate: 0.049,
          busy_rate: 0.158,
          congestion_rate: 0.005,
          health_score: -3.72,
        },
      ],
      worst: [
        {
          hora: 13,
          total_calls: 3100,
          agent_answer_rate: 0.041,
          busy_rate: 0.36,
          congestion_rate: 0.012,
          health_score: -15.88,
        },
      ],
    },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))
vi.mock('../hooks/usePatternAlerts', () => ({
  usePatternAlerts: () => ({
    alerts: [
      {
        fecha: '2026-09-01',
        hora: 9,
        campaign: '35',
        base: '80',
        device: 'GW20',
        agent_answer_rate: 0,
        pattern_alert: true,
      },
      {
        fecha: '2026-09-02',
        hora: 10,
        campaign: '35',
        base: '80',
        device: 'GW20',
        agent_answer_rate: 0.02,
        pattern_alert: true,
      },
      {
        fecha: '2026-09-02',
        hora: 11,
        campaign: '38',
        base: '76',
        device: 'GW37',
        agent_answer_rate: 0,
        pattern_alert: true,
      },
    ],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))

vi.mock('../hooks/useCompareDiagnostics', () => ({
  useCompareDiagnostics: () => ({
    data: null,
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))
vi.mock('../hooks/useHourlyTrend', () => ({
  useHourlyTrend: () => ({
    pointsA: [],
    pointsB: [],
    loading: false,
    error: null,
  }),
}))
vi.mock('../hooks/useRangeDiagnostics', () => ({
  useRangeDiagnostics: () => ({ data: null, loading: false, error: null, reload: vi.fn() }),
}))
vi.mock('../hooks/useRangeRecommendations', () => ({
  useRangeRecommendations: () => ({ data: null, loading: false, error: null, reload: vi.fn() }),
}))
vi.mock('../hooks/useRecommendations', () => ({
  useRecommendations: () => ({ data: null, loading: false, error: null, reload: vi.fn() }),
}))
vi.mock('../hooks/useCrossCampaignCompare', () => ({
  useCrossCampaignCompare: () => ({
    data: {
      campaign_a: '35',
      campaign_b: '38',
      start_date: '2026-09-01',
      end_date: '2026-09-15',
      min_calls_applied: 50,
      summary: {
        total_calls_a: 100,
        total_calls_b: 200,
        delta_total_pct: 100,
        agent_answer_rate_a: 0.1,
        agent_answer_rate_b: 0.2,
        delta_rate: 0.1,
        delta_percentage: 100,
        busy_rate_a: 0.05,
        busy_rate_b: 0.06,
        congestion_rate_a: 0.01,
        congestion_rate_b: 0.02,
        congestion_rate: 0.02,
        health_score: 80,
      },
      gateways_comparison: [],
      bases_comparison: [],
      hourly_a: [
        {
          hora: 9,
          total_calls: 100,
          agent_answers: 10,
          machine_answers: 5,
          agent_answer_rate: 0.1,
        },
      ],
      hourly_b: [
        {
          hora: 9,
          total_calls: 200,
          agent_answers: 30,
          machine_answers: 5,
          agent_answer_rate: 0.15,
        },
      ],
      daily_a: [
        {
          fecha: '2026-09-01',
          total_calls: 100,
          agent_answers: 10,
          machine_answers: 5,
          agent_answer_rate: 0.1,
        },
      ],
      daily_b: [
        {
          fecha: '2026-09-01',
          total_calls: 200,
          agent_answers: 30,
          machine_answers: 5,
          agent_answer_rate: 0.15,
        },
      ],
      devices_a: [
        {
          device: 'IPLAN',
          total_calls: 80,
          agent_answers: 10,
          machine_answers: 5,
          busy_calls: 4,
          congestion_calls: 1,
          agent_answer_rate: 0.125,
          busy_rate: 0.05,
          congestion_rate: 0.0125,
        },
      ],
      devices_b: [
        {
          device: 'IPLAN',
          total_calls: 90,
          agent_answers: 18,
          machine_answers: 5,
          busy_calls: 5,
          congestion_calls: 1,
          agent_answer_rate: 0.2,
          busy_rate: 0.055,
          congestion_rate: 0.011,
        },
      ],
    },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))
vi.mock('../hooks/useCrossCampaignDiagnostics', () => ({
  useCrossCampaignDiagnostics: () => ({
    data: {
      campaign_a: '35',
      campaign_b: '38',
      start_date: '2026-09-01',
      end_date: '2026-09-15',
      min_calls_applied: 50,
      summary: null,
      root_causes: [
        {
          severity: 'CRITICAL',
          type: 'BASE_DEGRADATION',
          entity: 'Base 34',
          message: 'La Base 34 redujo su tasa de contacto.',
        },
      ],
      positive_drivers: [
        {
          severity: 'SUCCESS',
          type: 'BASE_IMPROVEMENT',
          entity: 'Base 34',
          message: 'La Base 34 mejoró su tasa de contacto.',
        },
      ],
      insights: [],
      bases_comparison: null,
      gateways_comparison: null,
    },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))
vi.mock('../hooks/useCrossCampaignRecommendations', () => ({
  useCrossCampaignRecommendations: () => ({
    data: {
      campaign_a: '35',
      campaign_b: '38',
      start_date: '2026-09-01',
      end_date: '2026-09-15',
      min_calls_applied: 50,
      recommendations: [
        {
          id: 'rec_test',
          type: 'PACING',
          category: 'WARNING',
          entity: 'GW20',
          text: 'Revisar el volumen de marcado simultáneo.',
        },
      ],
    },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))

vi.mock('../lib/csv', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/csv')>()
  return { ...actual, downloadCsv: vi.fn() }
})
vi.mock('../hooks/useCampaigns', () => ({ useCampaigns: vi.fn() }))
vi.mock('../hooks/useHeatmap', () => ({
  useHeatmap: () => ({ data: [], loading: false, refreshing: false, error: null, reload: () => {} }),
}))
vi.mock('../hooks/useRoutingChanges', () => ({
  useRoutingChanges: () => ({ changes: [], volume: [] }),
}))
vi.mock('../hooks/useSegmentPeers', () => ({
  useSegmentPeers: () => ({ peers: [], loading: false, error: null }),
}))

import { downloadCsv } from '../lib/csv'
import { useCampaigns } from '../hooks/useCampaigns'
import { TEST_CATALOG } from '../test/catalog'
import App from '../App'

function mockCatalog(overrides: Partial<ReturnType<typeof useCampaigns>> = {}) {
  vi.mocked(useCampaigns).mockReturnValue({
    campaigns: TEST_CATALOG,
    loading: false,
    error: null,
    reload: vi.fn(),
    ...overrides,
  })
}

describe('ModeTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCatalog()
  })

  it('muestra el nombre del proyecto en el encabezado', () => {
    render(<App />)
    const header = screen.getByRole('banner')
    expect(header).toHaveTextContent('Proyecto Almanaque')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Diagnóstico de Agent Answer',
    )
  })

  it('muestra cuatro tabs', () => {
    render(<App />)
    expect(screen.getByTestId('tab-range')).toBeInTheDocument()
    expect(screen.getByTestId('tab-compare')).toBeInTheDocument()
    expect(screen.getByTestId('tab-campaigns')).toBeInTheDocument()
    expect(screen.getByTestId('tab-week')).toBeInTheDocument()
    expect(screen.getByTestId('tab-week')).toHaveTextContent('Por semana')
  })

  it('activa el tab Por semana y muestra su filtro con S37 por defecto', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-week'))
    expect(screen.getByTestId('filter-week-bar')).toBeInTheDocument()
    expect(screen.getByLabelText('Campaña')).toHaveValue('35')
    expect(screen.getByLabelText('Semana')).toHaveValue('2026-09-07')
    expect(
      within(screen.getByLabelText('Semana')).getAllByRole('option'),
    ).toHaveLength(3)
  })

  it('activa el tab de comparar campañas y muestra su filtro', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    expect(screen.getByTestId('filter-cross-campaign')).toBeInTheDocument()
    expect(screen.getByLabelText('Campaña A')).toHaveValue('35')
    expect(screen.getByLabelText('Campaña B')).toHaveValue('38')
  })

  it('muestra diagnóstico y recomendaciones en el tab de campañas', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    expect(screen.getByLabelText('Diagnóstico entre campañas')).toBeInTheDocument()
    expect(screen.getByText('Causas negativas')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Recomendaciones entre campañas'),
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByLabelText('Recomendaciones entre campañas'),
      ).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(['Recomendaciones'])
    expect(screen.getByTestId('recommendation-card')).toBeInTheDocument()
  })

  it('muestra Puntos destacados con mejor hora y dispositivo por campaña', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    expect(screen.getByText('Puntos destacados')).toBeInTheDocument()
    expect(
      screen.getByText(/Mejor hora de la campaña 35: 9h/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Mejor dispositivo de la campaña 35: IPLAN/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Mejor hora de la campaña 38: 9h/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Mejor dispositivo de la campaña 38: IPLAN/),
    ).toBeInTheDocument()
    expect(
      within(screen.getByLabelText('Diagnóstico entre campañas')).getByText(
        'La Base 34 mejoró su tasa de contacto.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('insight-card')).toHaveLength(10)
  })

  it('muestra Causas negativas con peor hora y dispositivo por campaña', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    expect(screen.getByText('Causas negativas')).toBeInTheDocument()
    expect(
      screen.getByText(/Peor hora de la campaña 35: 9h/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Peor dispositivo de la campaña 35: IPLAN/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Peor hora de la campaña 38: 9h/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Peor dispositivo de la campaña 38: IPLAN/),
    ).toBeInTheDocument()
    expect(
      within(screen.getByLabelText('Diagnóstico entre campañas')).getByText(
        'La Base 34 redujo su tasa de contacto.',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByTestId('insight-card')).toHaveLength(10)
  })

  it('conserva el estado de cada modo al cambiar de tab', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    expect(screen.getByTestId('filter-cross-campaign')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('tab-compare'))
    expect(screen.getByLabelText('Fecha A')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('tab-week'))
    expect(screen.getByTestId('filter-week-bar')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    expect(screen.getByTestId('filter-cross-campaign')).toBeInTheDocument()
  })

  it('el índice del tab de campañas apunta a secciones existentes', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    const nav = screen.getByRole('navigation', { name: 'Secciones' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(10)
    for (const link of links) {
      const id = link.getAttribute('href')!.slice(1)
      expect(document.getElementById(id), id).not.toBeNull()
    }
  })

  it('ofrece 12 exportaciones CSV y una impresión en el tab de campañas', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    expect(screen.getAllByTestId('export-csv')).toHaveLength(12)
    expect(screen.getByTestId('print-report')).toBeInTheDocument()
  })

  it('descarga el CSV de indicadores con el nombre de las 2 campañas', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    await userEvent.click(screen.getAllByTestId('export-csv')[0])
    expect(vi.mocked(downloadCsv)).toHaveBeenCalledWith(
      'campanas_35_vs_38_kpis.csv',
      expect.any(Array),
      expect.any(Array),
    )
  })

  it('oculta el botón de imprimir cuando no hay datos cargados', () => {
    render(<App />)
    expect(screen.queryByTestId('export-csv')).not.toBeInTheDocument()
    expect(screen.queryByTestId('print-report')).not.toBeInTheDocument()
  })

  it('muestra un error si no se puede cargar la lista de campañas', () => {
    mockCatalog({ campaigns: null, error: 'Error de API: 500' })
    render(<App />)
    expect(screen.getByTestId('tab-range')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo cargar la lista de campañas: Error de API: 500',
    )
    expect(screen.queryByTestId('filter-range-bar')).not.toBeInTheDocument()
  })

  it('avisa cuando no hay campañas cargadas', () => {
    mockCatalog({ campaigns: [] })
    render(<App />)
    expect(screen.getByText(/No hay campañas cargadas/)).toBeInTheDocument()
    expect(screen.queryByTestId('filter-range-bar')).not.toBeInTheDocument()
  })
})
