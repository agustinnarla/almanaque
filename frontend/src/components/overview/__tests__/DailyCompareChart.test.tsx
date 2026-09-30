import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DailyTrendPoint } from '../../../types/api'
import { mergeDailyPoints } from '../../../lib/chartData'
import { DailyCompareChart } from '../DailyCompareChart'

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
  fecha: string,
  total: number,
  rate: number | null,
): DailyTrendPoint => ({
  fecha,
  total_calls: total,
  agent_answers: 100,
  machine_answers: 200,
  agent_answer_rate: rate,
})

describe('mergeDailyPoints', () => {
  it('une por fecha y convierte rate a %', () => {
    const merged = mergeDailyPoints(
      [point('2026-09-01', 3000, 0.0594)],
      [point('2026-09-01', 20000, 0.0489), point('2026-09-02', 18000, null)],
    )
    expect(merged).toHaveLength(2)
    expect(merged[0]).toMatchObject({
      label: '01/09',
      totalA: 3000,
      totalB: 20000,
      rateA: 5.94,
      rateB: 4.89,
    })
    expect(merged[1]).toMatchObject({ label: '02/09', totalA: 0, rateB: null })
  })
})

describe('DailyCompareChart', () => {
  it('renderiza el gráfico dual con datos', () => {
    render(
      <DailyCompareChart
        pointsA={[point('2026-09-01', 3000, 0.0594)]}
        pointsB={[point('2026-09-01', 20000, 0.0489)]}
        labelA="Campaña 35"
        labelB="Campaña 38"
      />,
    )
    expect(screen.getByTestId('daily-compare-chart')).toBeInTheDocument()
    expect(screen.getByText('Serie diaria comparada')).toBeInTheDocument()
    expect(screen.getByText(/Campaña 35 atenuado/)).toBeInTheDocument()
  })

  it('muestra empty-state sin datos', () => {
    render(<DailyCompareChart pointsA={[]} pointsB={[]} />)
    expect(screen.getByTestId('daily-compare-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('daily-compare-chart')).not.toBeInTheDocument()
  })
})
