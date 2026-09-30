import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const dayPoint = {
  fecha: '2026-09-01',
  total_calls: 100,
  agent_answers: 10,
  machine_answers: 5,
  agent_answer_rate: 0.1,
}

const hourPoint = {
  hora: 9,
  total_calls: 100,
  agent_answers: 10,
  machine_answers: 5,
  agent_answer_rate: 0.1,
}

vi.mock('../hooks/useCampaignOverview', () => ({
  useCampaignOverview: () => ({
    summary: {
      campaign: '35',
      total_calls: 263198,
      agent_answers: 35413,
      machine_answers: 200000,
      rejected_calls: 27785,
      agent_answer_rate: 0.0594,
    },
    devices: [
      {
        device: 'GW20',
        total_calls: 1000,
        agent_answers: 60,
        machine_answers: 900,
        busy_calls: 30,
        congestion_calls: 10,
        agent_answer_rate: 0.06,
        busy_rate: 0.03,
        congestion_rate: 0.01,
      },
    ],
    daily: [dayPoint],
    hourly: [hourPoint],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))
vi.mock('../hooks/useRangeDiagnostics', () => ({
  useRangeDiagnostics: () => ({
    data: {
      min_calls_applied: 50,
      congested_gateways: [
        {
          device: 'GW20',
          total_calls: 1000,
          congestion_rate: 0.01,
          health_score: 60,
          message: 'Congestión sostenida en GW20.',
        },
      ],
      burn_hours: [
        {
          hora: 10,
          total_calls: 4000,
          busy_rate: 0.4,
          health_score: 55,
          message: 'Hora quemada a las 10.',
        },
      ],
      peak_hours: [
        {
          hora: 9,
          total_calls: 4378,
          agent_answer_rate: 0.069,
          health_score: 80,
          message: 'Pico a las 9.',
        },
      ],
    },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))
vi.mock('../hooks/useRangeRecommendations', () => ({
  useRangeRecommendations: () => ({
    data: {
      campaign: '35',
      start_date: '2026-09-01',
      end_date: '2026-09-15',
      min_calls_applied: 50,
      recommendations: [
        {
          id: 'r1',
          type: 'PACING',
          category: 'WARNING',
          entity: 'GW20',
          text: 'Bajar el marcado simultáneo.',
        },
      ],
    },
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
    data: {
      campaign: '35',
      date_a: '2026-09-01',
      date_b: '2026-09-02',
      min_calls_applied: 50,
      summary: {
        total_calls_a: 1000,
        total_calls_b: 1200,
        delta_total_pct: 20,
        agent_answer_rate_a: 0.0594,
        agent_answer_rate_b: 0.073,
        delta_rate: 0.0136,
        delta_percentage: 22.9,
        busy_rate_a: 0.1,
        busy_rate_b: 0.105,
        congestion_rate_a: 0.01,
        congestion_rate_b: 0.011,
        congestion_rate: 0.011,
        health_score: 82.5,
      },
      root_causes: [
        {
          severity: 'CRITICAL',
          type: 'BASE_DEGRADATION',
          entity: 'Base 34',
          message: 'La Base 34 cayó.',
        },
      ],
      positive_drivers: [],
      insights: [],
      bases_comparison: null,
      gateways_comparison: [
        {
          device: 'GW1',
          congestion_rate_a: 0.01,
          congestion_rate_b: 0.0125,
          delta_congestion: 0.0025,
        },
      ],
    },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}))
vi.mock('../hooks/useHourlyTrend', () => ({
  useHourlyTrend: () => ({
    pointsA: [hourPoint],
    pointsB: [hourPoint],
    loading: false,
    error: null,
  }),
}))
vi.mock('../hooks/useRecommendations', () => ({
  useRecommendations: () => ({
    data: {
      campaign: '35',
      date_a: '2026-09-01',
      date_b: '2026-09-02',
      min_calls_applied: 50,
      recommendations: [
        {
          id: 'r2',
          type: 'SCHEDULE',
          category: 'INFO',
          entity: '9',
          text: 'Reforzar la franja de las 9.',
        },
      ],
    },
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
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
        total_calls_a: 1000,
        total_calls_b: 1200,
        delta_total_pct: 20,
        agent_answer_rate_a: 0.0594,
        agent_answer_rate_b: 0.073,
        delta_rate: 0.0136,
        delta_percentage: 22.9,
        busy_rate_a: 0.1,
        busy_rate_b: 0.105,
        congestion_rate_a: 0.01,
        congestion_rate_b: 0.011,
        congestion_rate: 0.011,
        health_score: 82.5,
      },
      gateways_comparison: [],
      bases_comparison: [
        {
          base: 'Base 34',
          total_calls_a: 500,
          total_calls_b: 400,
          agent_answer_rate_a: 0.08,
          agent_answer_rate_b: 0.06,
          delta_rate: -0.02,
          share_a: 0.5,
          share_b: 0.4,
          share_delta: -0.1,
          relative_change_pct: -20,
        },
      ],
      hourly_a: [hourPoint],
      hourly_b: [hourPoint],
      daily_a: [dayPoint],
      daily_b: [dayPoint],
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
          message: 'La Base 34 redujo su tasa.',
        },
      ],
      positive_drivers: [],
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
          id: 'r3',
          type: 'PACING',
          category: 'WARNING',
          entity: 'GW20',
          text: 'Revisar el volumen de marcado.',
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

import { downloadCsv } from '../lib/csv'
import { useCampaigns } from '../hooks/useCampaigns'
import { TEST_CATALOG } from '../test/catalog'
import App from '../App'

const downloadMock = vi.mocked(downloadCsv)

describe('Exportación por modo', () => {
  beforeEach(() => {
    downloadMock.mockClear()
    vi.mocked(useCampaigns).mockReturnValue({
      campaigns: TEST_CATALOG,
      loading: false,
      error: null,
      reload: vi.fn(),
    })
    vi.stubGlobal('print', vi.fn())
    return () => vi.unstubAllGlobals()
  })

  it('RangeMode ofrece 11 CSV + imprimir', () => {
    render(<App />)
    expect(screen.getAllByTestId('export-csv')).toHaveLength(11)
    expect(screen.getByTestId('print-report')).toBeInTheDocument()
  })

  it('apila las tarjetas de Rankings del rango en una sola columna', () => {
    render(<App />)
    const section = screen.getByLabelText('Rankings del rango')
    const grid = section.querySelector('.grid')
    expect(grid).not.toBeNull()
    expect(grid?.className).not.toContain('lg:grid-cols-3')
    expect(grid?.className).toContain('gap-8')
    const csvButtons = within(section).getAllByTestId('export-csv')
    expect(csvButtons).toHaveLength(3)
    expect(csvButtons[0].parentElement?.className).toContain('flex-wrap')
    expect(section.querySelector('[data-testid="bases-ranking-table"]'))
      .not.toBeNull()
  })

  it('WeekMode ofrece 11 CSV + imprimir con S37 por defecto', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-week'))
    expect(screen.getAllByTestId('export-csv')).toHaveLength(11)
    expect(screen.getByTestId('print-report')).toBeInTheDocument()
    expect(screen.queryByTestId('week-partial-badge')).not.toBeInTheDocument()
  })

  it('WeekMode exporta los CSV con prefijo semana_ y marca la semana parcial', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-week'))
    await userEvent.click(screen.getAllByTestId('export-csv')[0])
    expect(downloadMock).toHaveBeenCalledWith(
      'semana_35_2026-09-07_2026-09-13_kpis.csv',
      expect.any(Array),
      expect.any(Array),
    )

    await userEvent.selectOptions(screen.getByLabelText('Semana'), '2026-09-14')
    await userEvent.click(screen.getByTestId('filter-week-submit'))
    expect(screen.getByTestId('week-partial-badge')).toBeInTheDocument()
    expect(screen.getByTestId('filter-week-partial')).toBeInTheDocument()
    expect(
      screen.getAllByText(/2 días con datos/).length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('RangeMode muestra peor hora y peor dispositivo en Causas negativas', () => {
    render(<App />)
    expect(screen.getByText('Causas negativas')).toBeInTheDocument()
    expect(
      screen.getByText(/Peor hora del período: 9h con 10\.00%/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Peor dispositivo del período: GW20 con 6\.00%/),
    ).toBeInTheDocument()
    expect(screen.getByText('Congestión sostenida en GW20.')).toBeInTheDocument()
    expect(screen.getByText('Hora quemada a las 10.')).toBeInTheDocument()
    expect(
      screen.getAllByTestId('insight-card').length,
    ).toBeLessThanOrEqual(10)
  })

  it('RangeMode exporta el diagnóstico del rango con WORST_HOUR y WORST_DEVICE', async () => {
    render(<App />)
    await userEvent.click(screen.getAllByTestId('export-csv')[1])

    const [filename, headers, rows] = downloadMock.mock.calls[0]
    expect(filename).toBe('rango_35_2026-09-01_2026-09-15_diagnosticos.csv')
    expect(headers).toEqual([
      'Polaridad',
      'Severidad',
      'Tipo',
      'Entidad',
      'Mensaje',
    ])
    const negatives = rows.filter((row: unknown[]) => row[0] === 'Negativa')
    expect(negatives).toHaveLength(4)
    expect(rows.map((row: unknown[]) => row[2])).toEqual(
      expect.arrayContaining(['NETWORK_CONGESTION', 'BUSY_HOUR', 'WORST_HOUR', 'WORST_DEVICE']),
    )
    const worstHour = rows.find((row: unknown[]) => row[2] === 'WORST_HOUR')
    expect(worstHour?.[0]).toBe('Negativa')
    expect(worstHour?.[1]).toBe('WARNING')
    expect(worstHour?.[3]).toBe('9')
  })

  it('RangeMode exporta el ranking de bases con su sección', async () => {
    render(<App />)
    const buttons = screen.getAllByTestId('export-csv')
    await userEvent.click(buttons[3])
    expect(downloadMock).toHaveBeenCalledWith(
      'rango_35_2026-09-01_2026-09-15_bases_ranking.csv',
      ['Rank', 'Base', 'Intentos', 'Agent Answer %'],
      [
        ['#1', '34', 198, 44.95],
        ['#2', '76', 17, 41.18],
        ['#3', '80', 35198, 5.7],
      ],
    )
  })

  it('RangeMode exporta las alertas por día y por combinación', async () => {
    render(<App />)
    const buttons = screen.getAllByTestId('export-csv')
    await userEvent.click(buttons[6])
    expect(downloadMock).toHaveBeenLastCalledWith(
      'rango_35_2026-09-01_2026-09-15_patterns_daily.csv',
      ['Fecha', 'Alertas'],
      [
        ['2026-09-01', 1],
        ['2026-09-02', 1],
      ],
    )
    await userEvent.click(buttons[7])
    expect(downloadMock).toHaveBeenLastCalledWith(
      'rango_35_2026-09-01_2026-09-15_patterns_combos.csv',
      expect.any(Array),
      expect.any(Array),
    )
  })

  it('RangeMode nombra los CSV con campaña y rango', async () => {
    render(<App />)
    await userEvent.click(screen.getAllByTestId('export-csv')[0])
    expect(downloadMock).toHaveBeenCalledWith(
      'rango_35_2026-09-01_2026-09-15_kpis.csv',
      expect.any(Array),
      expect.any(Array),
    )
  })

  it('CompareMode ofrece 5 CSV + imprimir', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-compare'))
    expect(screen.getAllByTestId('export-csv')).toHaveLength(5)
    expect(screen.getByTestId('print-report')).toBeInTheDocument()
  })

  it('CompareMode nombra los CSV con campaña y ambas fechas', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-compare'))
    await userEvent.click(screen.getAllByTestId('export-csv')[1])
    expect(downloadMock).toHaveBeenCalledWith(
      'comparar_35_2026-09-14_2026-09-15_diagnosticos.csv',
      expect.any(Array),
      expect.any(Array),
    )
  })

  it('CampaignsCompareMode ofrece 12 CSV + imprimir', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    expect(screen.getAllByTestId('export-csv')).toHaveLength(12)
    expect(screen.getByTestId('print-report')).toBeInTheDocument()
  })

  it('CampaignsCompareMode nombra los CSV con ambas campañas', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    await userEvent.click(screen.getAllByTestId('export-csv')[10])
    expect(downloadMock).toHaveBeenCalledWith(
      'campanas_35_vs_38_bases.csv',
      expect.any(Array),
      expect.any(Array),
    )
  })

  it('CampaignsCompareMode exporta los rankings comparados', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    await userEvent.click(screen.getAllByTestId('export-csv')[3])
    expect(downloadMock).toHaveBeenCalledWith(
      'campanas_35_vs_38_rank_bases.csv',
      [
        'Base',
        'Intentos A',
        'Agent Answer A %',
        'Intentos B',
        'Agent Answer B %',
        'Delta pp',
      ],
      expect.any(Array),
    )
    await userEvent.click(screen.getAllByTestId('export-csv')[6])
    expect(downloadMock).toHaveBeenCalledWith(
      'campanas_35_vs_38_patterns_daily.csv',
      ['Fecha', 'Alertas A', 'Alertas B'],
      expect.any(Array),
    )
  })

  it('CampaignsCompareMode exporta el diagnóstico compuesto (5 negativas + 4 positivas)', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('tab-campaigns'))
    await userEvent.click(screen.getAllByTestId('export-csv')[1])

    expect(downloadMock).toHaveBeenCalledTimes(1)
    const [filename, headers, rows] = downloadMock.mock.calls[0]
    expect(filename).toBe('campanas_35_vs_38_diagnosticos.csv')
    expect(headers).toEqual([
      'Polaridad',
      'Severidad',
      'Tipo',
      'Entidad',
      'Mensaje',
    ])
    expect(rows).toHaveLength(9)
    expect(rows.filter((row) => row[0] === 'Negativa')).toHaveLength(5)
    expect(rows.filter((row) => row[0] === 'Positiva')).toHaveLength(4)
    expect(rows[0]).toEqual([
      'Negativa',
      'CRITICAL',
      'BASE_DEGRADATION',
      'Base 34',
      'La Base 34 redujo su tasa.',
    ])
    expect(rows[1]).toEqual([
      'Negativa',
      'WARNING',
      'WORST_HOUR',
      '9 · 35',
      expect.stringContaining('Peor hora de la campaña 35: 9h'),
    ])
    expect(rows[4][3]).toBe('IPLAN · 38')
    expect(rows[5][2]).toBe('BEST_HOUR')
    expect(rows[5][0]).toBe('Positiva')
  })

  it('el botón imprimir dispara window.print()', async () => {
    render(<App />)
    await userEvent.click(screen.getByTestId('print-report'))
    expect(window.print).toHaveBeenCalledTimes(1)
  })
})
