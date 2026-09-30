import { render, screen } from '@testing-library/react'
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
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
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
})

describe('DailyTrendChart', () => {
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
