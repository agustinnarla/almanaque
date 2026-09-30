import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { HourlyTrendPoint } from '../../../types/api'
import { HourlyTrendChart, mergeHourlyPoints } from '../HourlyTrendChart'

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

const point = (
  hora: number,
  total: number,
  rate: number | null,
): HourlyTrendPoint => ({
  hora,
  total_calls: total,
  agent_answers: 10,
  machine_answers: 5,
  agent_answer_rate: rate,
})

describe('mergeHourlyPoints', () => {
  it('une por hora, convierte rate a % y ordena', () => {
    const merged = mergeHourlyPoints(
      [point(10, 100, 0.1), point(9, 50, null)],
      [point(9, 80, 0.2), point(11, 20, 0.05)],
    )
    expect(merged.map((r) => r.hora)).toEqual([9, 10, 11])
    expect(merged[0]).toMatchObject({
      totalA: 50,
      totalB: 80,
      rateA: null,
      rateB: 20,
    })
    expect(merged[1].rateA).toBeCloseTo(10)
    expect(merged[2].totalB).toBe(20)
  })
})

describe('HourlyTrendChart', () => {
  it('renderiza el gráfico con datos', () => {
    render(
      <HourlyTrendChart
        pointsA={[point(9, 100, 0.12)]}
        pointsB={[point(9, 90, 0.08)]}
      />,
    )
    expect(screen.getByTestId('hourly-chart')).toBeInTheDocument()
    expect(screen.getByText('Tendencia horaria')).toBeInTheDocument()
  })

  it('muestra empty-state sin datos', () => {
    render(<HourlyTrendChart pointsA={[]} pointsB={[]} />)
    expect(screen.getByTestId('hourly-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('hourly-chart')).not.toBeInTheDocument()
  })
})
