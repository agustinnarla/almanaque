import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ChartCard } from '../ChartCard'

const table = {
  headers: ['Fecha', 'Llamadas', 'Agent Answer %'],
  rows: [
    ['2026-09-01', 3402, 6.25],
    ['2026-09-02', 1151, null],
  ],
}

describe('ChartCard', () => {
  it('alterna entre el gráfico y su tabla', async () => {
    render(
      <ChartCard testId="test-chart" title="Serie diaria" subtitle="Por día" table={table}>
        <div data-testid="the-chart" />
      </ChartCard>,
    )
    const toggle = screen.getByTestId('chart-table-toggle')
    expect(toggle).toHaveTextContent('Ver tabla')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('the-chart')).toBeInTheDocument()

    await userEvent.click(toggle)

    expect(toggle).toHaveTextContent('Ver gráfico')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByTestId('the-chart')).not.toBeInTheDocument()
    const tableEl = screen.getByTestId('chart-table')
    const cells = within(tableEl)
      .getAllByRole('row')
      .map((row) => within(row).getAllByRole(row.querySelector('th') ? 'columnheader' : 'cell').map((c) => c.textContent))
    expect(cells).toEqual([
      ['Fecha', 'Llamadas', 'Agent Answer %'],
      ['2026-09-01', '3.402', '6,25'],
      ['2026-09-02', '1.151', '—'],
    ])
    expect(within(tableEl).getByText('Serie diaria')).toHaveClass('sr-only')
  })
})
