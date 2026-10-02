import { cloneElement, type ReactElement } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CHART_PALETTES } from '../../../lib/chartPalette'
import { RateVolumeChart } from '../RateVolumeChart'

type DotFn = (props: { cx: number; cy: number; index: number; payload: object }) => React.ReactNode

// Line renders its dot for each datum and Bar renders its Cells, so the
// low-volume encoding is visible in the DOM.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ComposedChart: ({ children, data }: { children: React.ReactNode; data: object[] }) => (
    <div data-rows={data.length}>{children}</div>
  ),
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  // Active tooltip over the datum chosen by the test (TOOLTIP_ON.index).
  Tooltip: ({ content }: { content: ReactElement<Record<string, unknown>> }) =>
    cloneElement(content, {
      active: true,
      label: DATA[TOOLTIP_ON.index].label,
      payload: [{ dataKey: 'rate', name: 'AA', value: DATA[TOOLTIP_ON.index].rate, color: '#2a78d6', payload: DATA[TOOLTIP_ON.index] }],
    }),
  Legend: () => null,
  Line: ({ dot }: { dot: DotFn | object }) => (
    <svg data-testid="line">
      {typeof dot === 'function'
        ? DATA.map((payload, index) => dot({ cx: index, cy: 1, index, payload }))
        : null}
    </svg>
  ),
  Bar: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  Cell: ({ fillOpacity }: { fillOpacity: number }) => (
    <span data-testid="cell" data-opacity={fillOpacity} />
  ),
}))

const TOOLTIP_ON = { index: 1 }

const DATA = [
  { label: '17/09', rate: 6.57, total: 2998, lowVolume: false, volumeShare: 1 },
  { label: '18/09', rate: 14.6, total: 1151, lowVolume: true, volumeShare: 0.44 },
]

const series = [{ name: 'Campaña', rateKey: 'rate', totalKey: 'total', color: '#2a78d6' }]

describe('RateVolumeChart con días de poco volumen', () => {
  it('atenúa la barra y ahueca el punto solo del día marcado', () => {
    const { container } = render(
      <RateVolumeChart
        data={DATA}
        xKey="label"
        xLabel="Día"
        syncId="t"
        series={series}
        lowVolumeKey="lowVolume"
        lowVolumeShareKey="volumeShare"
      />,
    )
    expect(screen.getAllByTestId('cell').map((cell) => cell.dataset.opacity)).toEqual(['1', '0.35'])
    const dots = container.querySelectorAll('circle')
    expect(dots).toHaveLength(2)
    expect(dots[0]).toHaveAttribute('fill', '#2a78d6')
    expect(dots[1]).toHaveAttribute('data-low-volume', 'true')
    expect(dots[1]).toHaveAttribute('fill', CHART_PALETTES.light.surface)
    expect(dots[1]).toHaveAttribute('stroke', '#2a78d6')
    expect(screen.getAllByText('Poco volumen: 44% de la mediana del rango')).toHaveLength(2)
  })

  it('el tooltip de un día normal no suma la línea de poco volumen', () => {
    TOOLTIP_ON.index = 0
    render(
      <RateVolumeChart
        data={DATA}
        xKey="label"
        xLabel="Día"
        syncId="t"
        series={series}
        lowVolumeKey="lowVolume"
        lowVolumeShareKey="volumeShare"
      />,
    )
    expect(screen.queryByText(/Poco volumen/)).not.toBeInTheDocument()
    TOOLTIP_ON.index = 1
  })

  it('sin lowVolumeKey no agrega celdas ni puntos propios', () => {
    const { container } = render(
      <RateVolumeChart data={DATA} xKey="label" xLabel="Día" syncId="t" series={series} />,
    )
    expect(screen.queryAllByTestId('cell')).toHaveLength(0)
    expect(container.querySelectorAll('circle')).toHaveLength(0)
  })
})
