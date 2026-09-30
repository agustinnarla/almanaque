import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { HourlyTrendPoint } from '../../../types/api'
import { HourlyAggregateChart } from '../HourlyAggregateChart'

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

const point = (hora: number, total: number, rate: number | null): HourlyTrendPoint => ({
  hora,
  total_calls: total,
  agent_answers: 10,
  machine_answers: 5,
  agent_answer_rate: rate,
})

describe('HourlyAggregateChart', () => {
  it('renderiza el gráfico con datos', () => {
    render(<HourlyAggregateChart points={[point(9, 500, 0.07)]} />)
    expect(screen.getByTestId('hourly-agg-chart')).toBeInTheDocument()
    expect(screen.getByText('Tendencia horaria del rango')).toBeInTheDocument()
  })

  it('muestra empty-state sin datos', () => {
    render(<HourlyAggregateChart points={[]} />)
    expect(screen.getByTestId('hourly-agg-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('hourly-agg-chart')).not.toBeInTheDocument()
  })
})
