import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RateVolumeChart } from '../RateVolumeChart'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => null,
  Legend: () => <div data-testid="legend" />,
  Line: ({ stroke }: { stroke: string }) => <div data-testid="line" data-color={stroke} />,
  Bar: ({ fill }: { fill: string }) => <div data-testid="bar" data-color={fill} />,
}))

const data = [{ hora: 9, rateA: 5, totalA: 100, rateB: 4, totalB: 90 }]

describe('RateVolumeChart', () => {
  it('separa tasa y volumen en dos paneles con un solo eje Y cada uno', () => {
    render(
      <RateVolumeChart
        data={data}
        xKey="hora"
        xLabel="Hora"
        syncId="test"
        series={[{ name: 'Campaña', rateKey: 'rateA', totalKey: 'totalA', color: '#2a78d6' }]}
      />,
    )
    const ratePanel = screen.getByTestId('rate-panel')
    const volumePanel = screen.getByTestId('volume-panel')
    expect(within(ratePanel).getAllByTestId('y-axis')).toHaveLength(1)
    expect(within(volumePanel).getAllByTestId('y-axis')).toHaveLength(1)
    expect(within(ratePanel).getAllByTestId('line')).toHaveLength(1)
    expect(within(ratePanel).queryByTestId('bar')).not.toBeInTheDocument()
    expect(within(volumePanel).getAllByTestId('bar')).toHaveLength(1)
    expect(within(volumePanel).queryByTestId('line')).not.toBeInTheDocument()
    expect(screen.queryByTestId('legend')).not.toBeInTheDocument()
  })

  it('con dos series muestra leyenda y mantiene el color de cada entidad', () => {
    render(
      <RateVolumeChart
        data={data}
        xKey="hora"
        xLabel="Hora"
        syncId="test"
        series={[
          { name: '35', rateKey: 'rateA', totalKey: 'totalA', color: '#2a78d6' },
          { name: '38', rateKey: 'rateB', totalKey: 'totalB', color: '#eb6834' },
        ]}
      />,
    )
    expect(screen.getAllByTestId('legend')).toHaveLength(1)
    const lineColors = screen.getAllByTestId('line').map((el) => el.dataset.color)
    const barColors = screen.getAllByTestId('bar').map((el) => el.dataset.color)
    expect(lineColors).toEqual(['#2a78d6', '#eb6834'])
    expect(barColors).toEqual(lineColors)
  })
})
