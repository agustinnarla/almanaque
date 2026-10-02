import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { CHART_PALETTES } from '../../../lib/chartPalette'
import { setThemePreference } from '../../../lib/theme'
import type { HourDeviceRow } from '../../../types/api'
import { HourDeviceHeatmap } from '../HourDeviceHeatmap'

const row = (device: string, hora: number, total: number, agents: number, machines = 0): HourDeviceRow => ({
  device,
  hora,
  total_calls: total,
  agent_answers: agents,
  machine_answers: machines,
})

// IPLAN mornings strong, afternoon weak; GW37 even; IPLAN2 one small cell; GW42 under 1%.
const ROWS = [
  row('IPLAN', 9, 3922, 560, 1773),
  row('IPLAN', 15, 2753, 149, 1472),
  row('GW37', 9, 700, 52, 120),
  row('GW37', 15, 600, 33, 100),
  row('IPLAN2', 9, 22, 2, 6),
  row('IPLAN2', 15, 400, 10, 81),
  row('GW42', 10, 10, 3, 3),
]

describe('HourDeviceHeatmap', () => {
  afterEach(() => {
    act(() => setThemePreference('system'))
    window.localStorage.clear()
  })

  it('pinta cada celda con la rampa secuencial y deja sin color las chicas', () => {
    render(<HourDeviceHeatmap rows={ROWS} headerAction={<button>CSV</button>} />)
    const cells = screen.getAllByTestId('heatmap-cell')
    expect(cells).toHaveLength(6)
    const iplan9 = screen.getByLabelText(/^IPLAN · 9 h: AA 14\.28%/)
    expect(iplan9).toHaveAttribute('data-bin', '5')
    expect(iplan9).toHaveStyle({ background: CHART_PALETTES.light.sequential[5] })
    const small = screen.getByLabelText(/^IPLAN2 · 9 h: pocas llamadas/)
    expect(small).toHaveTextContent('·')
    expect(small).not.toHaveAttribute('data-bin')
    expect(screen.getByTestId('heatmap-hidden')).toHaveTextContent('1 troncal con menos del 1% del volumen no se muestran')
    expect(screen.getByText('CSV')).toBeInTheDocument()
  })

  it('cambia a AA sobre atendibles y muestra el detalle con el foco', async () => {
    render(<HourDeviceHeatmap rows={ROWS} />)
    await userEvent.click(screen.getByRole('button', { name: 'AA sobre atendibles' }))
    expect(screen.getByRole('button', { name: 'AA sobre atendibles' })).toHaveAttribute('aria-pressed', 'true')
    const cell = screen.getByLabelText(/^IPLAN · 9 h: AA sobre atendibles 26\.06%/)
    act(() => cell.focus())
    expect(screen.getByTestId('heatmap-readout')).toHaveTextContent(
      'IPLAN · 9 h: AA sobre atendibles 26.06% (560 agentes de 3.922 llamadas)',
    )
    fireEvent.blur(cell)
    expect(screen.getByTestId('heatmap-readout')).toHaveTextContent('Pasá el mouse o el foco')
    fireEvent.mouseEnter(screen.getByLabelText(/^GW37 · 15 h/))
    expect(screen.getByTestId('heatmap-readout')).toHaveTextContent('GW37 · 15 h')
  })

  it('en modo oscuro usa la rampa invertida', () => {
    act(() => setThemePreference('dark'))
    render(<HourDeviceHeatmap rows={ROWS} />)
    expect(screen.getByLabelText(/^IPLAN · 9 h/)).toHaveStyle({ background: CHART_PALETTES.dark.sequential[5] })
    expect(CHART_PALETTES.dark.sequential).toEqual([...CHART_PALETTES.light.sequential].reverse())
  })

  it('tiene vista de tabla con todas las celdas y estado vacío', async () => {
    const { unmount } = render(<HourDeviceHeatmap rows={ROWS} />)
    await userEvent.click(screen.getByTestId('chart-table-toggle'))
    const table = screen.getByTestId('chart-table')
    expect(within(table).getAllByRole('row')).toHaveLength(ROWS.length + 1)
    expect(within(table).getByText('AA sobre atendibles %')).toBeInTheDocument()
    unmount()

    render(<HourDeviceHeatmap rows={[]} />)
    expect(screen.getByTestId('heatmap-empty')).toHaveTextContent('No hay datos por hora y troncal')
  })
})
