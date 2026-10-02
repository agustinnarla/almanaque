import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CampaignCatalogEntry } from '../../types/api'
import { WeeksCompareMode } from '../WeeksCompareMode'

const calls = vi.hoisted(() => ({ compare: [] as object[], diagnostics: [] as object[], recommendations: [] as object[] }))
// Per-test overrides of each hook's state (loading, error, refreshing, data…).
const overrides = vi.hoisted(() => ({
  compare: {} as Record<string, unknown>,
  diagnostics: {} as Record<string, unknown>,
  recommendations: {} as Record<string, unknown>,
  reload: { compare: 0, diagnostics: 0, recommendations: 0 },
}))

const day = (fecha: string, total: number, agents: number) => ({
  fecha,
  total_calls: total,
  agent_answers: agents,
  machine_answers: 0,
  agent_answer_rate: agents / total,
})

vi.mock('recharts', () => {
  const Box = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>
  const Empty = () => null
  return {
    ResponsiveContainer: Box, ComposedChart: Box, BarChart: Box, Cell: Empty,
    CartesianGrid: Empty, XAxis: Empty, YAxis: Empty, Tooltip: Empty, Legend: Empty, Line: Empty, Bar: Empty,
  }
})
vi.mock('../../hooks/useCrossCampaignCompare', () => ({
  useCrossCampaignCompare: (params: object) => {
    calls.compare.push(params)
    return {
      loading: false, refreshing: false, error: null,
      reload: () => { overrides.reload.compare += 1 },
      data: {
        summary: {
          total_calls_a: 15000, total_calls_b: 14000, delta_total_pct: -6.7,
          agent_answer_rate_a: 0.07, agent_answer_rate_b: 0.075, delta_rate: 0.005, delta_percentage: 7.1,
          busy_rate_a: 0.1, busy_rate_b: 0.1, congestion_rate_a: 0.01, congestion_rate_b: 0.01,
          congestion_rate: 0.01, health_score: -2,
        },
        gateways_comparison: [],
        bases_comparison: [],
        hourly_a: [],
        hourly_b: [],
        daily_a: [day('2026-09-14', 3693, 263), day('2026-09-15', 2357, 92)],
        daily_b: [day('2026-09-21', 1517, 155), day('2026-09-22', 1716, 191)],
      },
      ...overrides.compare,
    }
  },
}))
vi.mock('../../hooks/useCrossCampaignDiagnostics', () => ({
  useCrossCampaignDiagnostics: (params: object) => {
    calls.diagnostics.push(params)
    return {
      data: { root_causes: [], positive_drivers: [] }, loading: false, refreshing: false, error: null,
      reload: () => { overrides.reload.diagnostics += 1 },
      ...overrides.diagnostics,
    }
  },
}))
vi.mock('../../hooks/useCrossCampaignRecommendations', () => ({
  useCrossCampaignRecommendations: (params: object) => {
    calls.recommendations.push(params)
    return {
      data: { recommendations: [] }, loading: false, refreshing: false, error: null,
      reload: () => { overrides.reload.recommendations += 1 },
      ...overrides.recommendations,
    }
  },
}))

// Real September weekdays of campaign 35: S36 partial (4), S37–S39 (5), S40 partial (3).
function septemberDates(): string[] {
  const dates: string[] = []
  for (let d = 1; d <= 30; d++) {
    const iso = `2026-09-${String(d).padStart(2, '0')}`
    const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay()
    if (weekday !== 0 && weekday !== 6) dates.push(iso)
  }
  return dates
}

const CATALOG: CampaignCatalogEntry[] = [
  {
    campaign: '35', segment: 'Galicia Empresas', first_day: '2026-09-01', last_day: '2026-09-30',
    days: 22, total_calls: 60265, dates: septemberDates(),
  },
]

describe('WeeksCompareMode', () => {
  beforeEach(() => {
    calls.compare.length = 0
    calls.diagnostics.length = 0
    calls.recommendations.length = 0
    overrides.compare = {}
    overrides.diagnostics = {}
    overrides.recommendations = {}
    overrides.reload = { compare: 0, diagnostics: 0, recommendations: 0 }
  })

  it('por defecto compara la última semana completa contra la anterior', () => {
    render(<WeeksCompareMode catalog={CATALOG} />)
    expect(screen.getByTestId('filter-week-a')).toHaveValue('2026-09-14')
    expect(screen.getByTestId('filter-week-b')).toHaveValue('2026-09-21')
    const expected = {
      campaignA: '35', campaignB: '35',
      startDate: '2026-09-14', endDate: '2026-09-20',
      startDateB: '2026-09-21', endDateB: '2026-09-27',
      minCalls: 50,
    }
    expect(calls.compare.at(-1)).toEqual(expected)
    expect(calls.diagnostics.at(-1)).toEqual(expected)
    expect(calls.recommendations.at(-1)).toEqual(expected)
    expect(screen.queryByTestId('weeks-mismatch-warning')).not.toBeInTheDocument()
  })

  it('muestra las secciones con las etiquetas de las semanas y alinea los días', async () => {
    render(<WeeksCompareMode catalog={CATALOG} />)
    expect(screen.getByText('Indicadores: Semana 38 → Semana 39')).toBeInTheDocument()
    expect(screen.getByTestId('executive-summary')).toHaveTextContent('entre Semana 38 y Semana 39')
    expect(screen.getByText('Para la Semana 39')).toBeInTheDocument()

    const chart = screen.getByTestId('weekday-compare-chart')
    await userEvent.click(within(chart).getByTestId('chart-table-toggle'))
    const rows = within(chart).getAllByRole('row').map((row) => row.textContent)
    expect(rows[1]).toContain('Lun')
    expect(rows[1]).toContain('2026-09-14')
    expect(rows[1]).toContain('2026-09-21')
    expect(rows[2]).toContain('Mar')
  })

  it('avisa si las semanas tienen distinta cantidad de días', async () => {
    render(<WeeksCompareMode catalog={CATALOG} />)
    await userEvent.selectOptions(screen.getByTestId('filter-week-b'), '2026-09-28')
    await userEvent.click(screen.getByTestId('filter-weeks-submit'))
    expect(calls.compare.at(-1)).toMatchObject({ startDateB: '2026-09-28', endDateB: '2026-10-04' })
    expect(screen.getByTestId('weeks-mismatch-warning')).toHaveTextContent(
      'La Semana 38 (14–20/09) tiene 5 días con datos y la Semana 40 (28/09–04/10), 3: los totales no son comparables; las tasas sí.',
    )
  })

  it('no deja comparar una semana consigo misma', async () => {
    render(<WeeksCompareMode catalog={CATALOG} />)
    await userEvent.selectOptions(screen.getByTestId('filter-week-a'), '2026-09-21')
    expect(screen.getByTestId('filter-weeks-submit')).toBeDisabled()
    expect(screen.getByTestId('filter-weeks-same')).toHaveTextContent('Elegí dos semanas distintas')
  })

  it('sin dos semanas de datos lo explica', () => {
    const oneWeek = [{ ...CATALOG[0], dates: ['2026-09-14', '2026-09-15'], first_day: '2026-09-14', last_day: '2026-09-15', days: 2 }]
    render(<WeeksCompareMode catalog={oneWeek} />)
    expect(screen.getByText('Hace falta al menos una campaña con dos semanas de datos para comparar.')).toBeInTheDocument()
  })

  it('primera carga: esqueleto; error: aviso', () => {
    overrides.compare = { loading: true, data: null }
    const { unmount } = render(<WeeksCompareMode catalog={CATALOG} />)
    expect(screen.getByLabelText('Cargando comparación de semanas')).toBeInTheDocument()
    unmount()

    overrides.compare = { error: 'Error de API: 500', data: null }
    render(<WeeksCompareMode catalog={CATALOG} />)
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar la comparación de semanas: Error de API: 500')
  })

  it('recarga sin esqueleto y estados de diagnóstico y recomendaciones', () => {
    overrides.compare = { loading: true, refreshing: true }
    overrides.diagnostics = { loading: true, data: null }
    overrides.recommendations = { error: 'Error de API: 503' }
    const { unmount } = render(<WeeksCompareMode catalog={CATALOG} />)
    expect(screen.queryByLabelText('Cargando comparación de semanas')).not.toBeInTheDocument()
    expect(screen.getByText('Indicadores: Semana 38 → Semana 39').closest('[aria-busy="true"]')?.className).toContain('opacity-50')
    expect(screen.getByLabelText('Cargando diagnóstico')).toBeInTheDocument()
    expect(screen.getByText(/No se pudieron cargar las recomendaciones: Error de API: 503/)).toBeInTheDocument()
    unmount()

    overrides.compare = {}
    overrides.diagnostics = { error: 'Error de API: 502' }
    overrides.recommendations = { loading: true, data: null }
    render(<WeeksCompareMode catalog={CATALOG} />)
    expect(screen.getByText(/No se pudo cargar el diagnóstico: Error de API: 502/)).toBeInTheDocument()
    expect(screen.getByLabelText('Cargando recomendaciones')).toBeInTheDocument()
  })

  it('comparar otra vez lo mismo recarga los tres pedidos', async () => {
    render(<WeeksCompareMode catalog={CATALOG} />)
    await userEvent.click(screen.getByTestId('filter-weeks-submit'))
    expect(overrides.reload).toEqual({ compare: 1, diagnostics: 1, recommendations: 1 })
  })

  it('al cambiar de campaña toma sus semanas si las elegidas no existen, y si existen las conserva', async () => {
    // 38 with data only up to 11/09: weeks S36 (partial) and S37.
    const short: CampaignCatalogEntry = {
      ...CATALOG[0], campaign: '38', dates: septemberDates().slice(0, 9), last_day: '2026-09-11', days: 9,
    }
    render(<WeeksCompareMode catalog={[...CATALOG, short]} />)
    await userEvent.selectOptions(screen.getByLabelText('Campaña'), '38')
    expect(screen.getByTestId('filter-week-a')).toHaveValue('2026-08-31')
    expect(screen.getByTestId('filter-week-b')).toHaveValue('2026-09-07')

    await userEvent.selectOptions(screen.getByLabelText('Campaña'), '35')
    expect(screen.getByTestId('filter-week-a')).toHaveValue('2026-08-31')
    expect(screen.getByTestId('filter-week-b')).toHaveValue('2026-09-07')
  })

  it('sin datos diarios, el gráfico por día lo dice', () => {
    overrides.compare = {
      data: {
        summary: null, gateways_comparison: [], bases_comparison: [], hourly_a: [], hourly_b: [], daily_a: [], daily_b: [],
      },
    }
    render(<WeeksCompareMode catalog={CATALOG} />)
    expect(screen.getByTestId('weekday-compare-empty')).toHaveTextContent('No hay datos diarios para las semanas seleccionadas.')
  })
})
