import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { DailyTrendPoint } from '../../../types/api'
import { mapDailyPoints } from '../../../lib/chartData'
import { DailyTrendChart } from '../DailyTrendChart'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Bar: () => <div data-testid="chart-bar" />,
  Line: () => <div data-testid="chart-line" />,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
}))

const point = (fecha: string, total: number, rate: number | null): DailyTrendPoint => ({
  fecha,
  total_calls: total,
  agent_answers: 100,
  machine_answers: 200,
  agent_answer_rate: rate,
})

describe('mapDailyPoints', () => {
  it('formatea fecha a DD/MM y convierte rate a %', () => {
    const mapped = mapDailyPoints([
      point('2026-09-01', 3280, 0.0576),
      point('2026-09-15', 2357, null),
    ])
    expect(mapped[0]).toMatchObject({ label: '01/09', total: 3280, rate: 5.76 })
    expect(mapped[1]).toMatchObject({ label: '15/09', rate: null })
  })

  it('marca los días con menos del 50% de la mediana (campaña 35, 14→18/09)', () => {
    const mapped = mapDailyPoints(SEPT_35_WEEK)
    expect(mapped.filter((day) => day.lowVolume).map((day) => day.label)).toEqual(['18/09'])
    const low = mapped.find((day) => day.lowVolume)
    expect(low?.volumeShare).toBeCloseTo(1151 / 2998, 4)
  })
})

// Real daily volume of campaign 35, week of 14/09 (median 2.998 calls).
const SEPT_35_WEEK = [
  point('2026-09-14', 3693, 263 / 3693),
  point('2026-09-15', 2357, 92 / 2357),
  point('2026-09-16', 3318, 206 / 3318),
  point('2026-09-17', 2998, 197 / 2998),
  point('2026-09-18', 1151, 168 / 1151),
]

describe('DailyTrendChart', () => {
  it('avisa los días con poco volumen y los marca en la tabla', async () => {
    render(<DailyTrendChart points={SEPT_35_WEEK} />)
    expect(screen.getByTestId('low-volume-note')).toHaveTextContent(
      'Poco volumen (menos del 50% de la mediana del rango, 2.998 llamadas): 18/09. Su AA se lee con cautela.',
    )

    await userEvent.click(screen.getByTestId('chart-table-toggle'))
    const rows = within(screen.getByTestId('chart-table')).getAllByRole('row')
    expect(rows[0]).toHaveTextContent('Poco volumen')
    expect(rows[5].lastElementChild).toHaveTextContent('Sí')
    expect(rows[1].lastElementChild).toHaveTextContent('—')
  })

  it('sin días de poco volumen no muestra la nota', () => {
    render(<DailyTrendChart points={SEPT_35_WEEK.slice(0, 4)} />)
    expect(screen.queryByTestId('low-volume-note')).not.toBeInTheDocument()
  })

  it('renderiza el gráfico con datos', () => {
    render(<DailyTrendChart points={[point('2026-09-01', 3280, 0.0576)]} />)
    expect(screen.getByTestId('daily-chart')).toBeInTheDocument()
    expect(screen.getByText('Serie diaria de Agent Answer')).toBeInTheDocument()
  })

  it('muestra empty-state sin datos', () => {
    render(<DailyTrendChart points={[]} />)
    expect(screen.getByTestId('daily-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('daily-chart')).not.toBeInTheDocument()
  })
})
