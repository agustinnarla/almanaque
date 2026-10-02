import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TRUNK_COLORS } from '../../../lib/chartPalette'
import { trunkVolumeRows } from '../../../lib/exporters'
import { TrunkVolumeChart } from '../TrunkVolumeChart'

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => null,
  Bar: ({ dataKey, fill, stackId }: { dataKey: string; fill: string; stackId: string }) => (
    <div data-testid="bar" data-key={dataKey} data-color={fill} data-stack={stackId} />
  ),
}))

const rows = [
  { fecha: '2026-09-08', device: 'GW20', total_calls: 300 },
  { fecha: '2026-09-08', device: 'GW37', total_calls: 100 },
  { fecha: '2026-09-09', device: 'IPLAN', total_calls: 600 },
]

describe('TrunkVolumeChart', () => {
  it('apila una barra por troncal, con un solo eje y leyenda con el share', () => {
    render(<TrunkVolumeChart rows={rows} headerAction={<button>CSV</button>} />)

    const bars = screen.getAllByTestId('bar')
    expect(bars.map((b) => b.dataset.key)).toEqual(['IPLAN', 'GW20', 'GW37'])
    expect(bars.map((b) => b.dataset.color)).toEqual(TRUNK_COLORS.slice(0, 3))
    expect(new Set(bars.map((b) => b.dataset.stack)).size).toBe(1)
    expect(screen.getAllByTestId('y-axis')).toHaveLength(1)
    expect(screen.getAllByTestId('trunk-legend-item').map((li) => li.textContent)).toEqual([
      'IPLAN · 60%',
      'GW20 · 30%',
      'GW37 · 10%',
    ])
    expect(screen.getByText('CSV')).toBeInTheDocument()
  })

  it('sin datos muestra el mensaje vacío y no el botón de exportar', () => {
    render(<TrunkVolumeChart rows={[]} headerAction={<button>CSV</button>} />)
    expect(screen.getByTestId('trunk-volume-empty')).toHaveTextContent(
      'No hay volumen por troncal para el rango seleccionado.',
    )
    expect(screen.queryByText('CSV')).not.toBeInTheDocument()
  })

  it('exporta una fila por día y troncal', () => {
    expect(trunkVolumeRows(rows)).toEqual({
      headers: ['Fecha', 'Troncal', 'Llamadas'],
      rows: [
        ['2026-09-08', 'GW20', 300],
        ['2026-09-08', 'GW37', 100],
        ['2026-09-09', 'IPLAN', 600],
      ],
    })
  })
})
