import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { DeviceRangeRow } from '../../../types/api'
import { GatewaysRangeTable } from '../GatewaysRangeTable'

const row = (
  device: string,
  total: number,
  aa: number | null,
  busy: number | null,
  congestion: number | null,
): DeviceRangeRow => ({
  device,
  total_calls: total,
  agent_answers: 10,
  machine_answers: 5,
  busy_calls: 3,
  congestion_calls: 2,
  agent_answer_rate: aa,
  busy_rate: busy,
  congestion_rate: congestion,
})

describe('GatewaysRangeTable', () => {
  it('renderiza filas con tasas formateadas', () => {
    render(
      <GatewaysRangeTable
        rows={[row('GW39', 1200, 0.05, 0.2, 0.1), row('IPLAN2', 800, null, 0.1, null)]}
      />,
    )
    const table = screen.getByTestId('gateways-range-table')
    const rows = within(table).getAllByTestId('gateways-range-row')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('GW39')
    expect(rows[0]).toHaveTextContent('1.200')
    expect(rows[0]).toHaveTextContent('5.00%')
    expect(rows[1]).toHaveTextContent('—')
  })

  it('muestra empty-state cuando rows es null o vacío', () => {
    const { unmount } = render(<GatewaysRangeTable rows={null} />)
    expect(screen.getByTestId('gateways-range-empty')).toBeInTheDocument()
    unmount()
    render(<GatewaysRangeTable rows={[]} />)
    expect(screen.getByTestId('gateways-range-empty')).toBeInTheDocument()
  })
})
