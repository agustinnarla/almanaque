import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BasesRankingTable } from '../BasesRankingTable'

describe('BasesRankingTable', () => {
  it('muestra todas las bases ordenadas con su AA %, intentos y rank', () => {
    render(
      <BasesRankingTable
        rows={[
          { base: '34', agent_answer_rate: 0.4495, total_calls: 198 },
          { base: '76', agent_answer_rate: 0.4118, total_calls: 17 },
          { base: '80', agent_answer_rate: 0.057, total_calls: 35198 },
        ]}
      />,
    )
    expect(screen.getAllByTestId('bases-ranking-row')).toHaveLength(3)
    const cells = screen.getAllByRole('cell')
    expect(cells[0]).toHaveTextContent('#1')
    expect(cells[1]).toHaveTextContent('34')
    expect(cells[2]).toHaveTextContent((198).toLocaleString('es-AR'))
    expect(cells[3]).toHaveTextContent('44.95%')
    expect(cells[8]).toHaveTextContent('#3')
    expect(cells[9]).toHaveTextContent('80')
    expect(cells[10]).toHaveTextContent((35198).toLocaleString('es-AR'))
    expect(cells[11]).toHaveTextContent('5.70%')
    expect(screen.getAllByRole('columnheader').map((th) => th.textContent)).toEqual([
      '#',
      'Base',
      'Intentos',
      'AA %',
    ])
    expect(screen.getAllByTestId('bases-ranking-row')[2]).toHaveTextContent('#3')
    // the best AA among ranked bases is highlighted, not the first row
    expect(screen.getAllByTestId('bases-ranking-row')[0].className).toContain(
      'bg-emerald-50',
    )
    expect(screen.getAllByTestId('bases-ranking-row')[2].className).not.toContain(
      'bg-emerald-50',
    )
    const wrapper = screen.getByTestId('bases-ranking-table')
    expect(wrapper.className).toContain('overflow-x-auto')
    expect(screen.getByRole('table').className).toContain('min-w-[480px]')
  })

  it('deja las bases con pocos intentos abajo, en gris y sin rank', () => {
    render(
      <BasesRankingTable
        minCalls={50}
        rows={[
          { base: '14', agent_answer_rate: 0.719, total_calls: 121, ranked: true },
          { base: '5', agent_answer_rate: 0.0655, total_calls: 17135, ranked: true },
          { base: '27', agent_answer_rate: 1, total_calls: 1, ranked: false },
        ]}
      />,
    )
    const rows = screen.getAllByTestId('bases-ranking-row')
    expect(rows.map((row) => row.firstElementChild?.textContent)).toEqual(['#1', '#2', '—'])
    expect(rows[2]).toHaveAttribute('data-ranked', 'false')
    expect(rows[2].className).toContain('text-slate-400')
    expect(screen.getByTestId('bases-ranking-divider')).toHaveTextContent(
      'Pocos intentos (menos de 50 llamadas) · no compiten en el ranking',
    )
  })

  it('muestra estado vacío cuando no hay filas', () => {
    render(<BasesRankingTable rows={[]} />)
    expect(screen.getByTestId('bases-ranking-empty')).toBeInTheDocument()
  })

  it('muestra estado vacío cuando el dato aún no llegó', () => {
    render(<BasesRankingTable rows={null} />)
    expect(screen.getByTestId('bases-ranking-empty')).toBeInTheDocument()
  })
})
