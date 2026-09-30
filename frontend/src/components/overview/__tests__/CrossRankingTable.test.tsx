import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CrossRankingTable } from '../CrossRankingTable'
import type { CrossRankingRow } from '../../../types/api'

describe('CrossRankingTable', () => {
  it('renderiza bases con columnas de intentos A, B y delta', () => {
    const rows: CrossRankingRow[] = [
      {
        key: '34',
        rateA: 0.4495,
        rateB: 0.5158,
        delta: 6.63,
        healthA: null,
        healthB: null,
        attemptsA: 1000,
        attemptsB: 900,
      },
      {
        key: '0',
        rateA: null,
        rateB: 0.7,
        delta: null,
        healthA: null,
        healthB: null,
        attemptsA: null,
        attemptsB: 700,
      },
    ]
    render(<CrossRankingTable kind="base" rows={rows} />)

    expect(screen.getByTestId('cross-ranking-table')).toBeInTheDocument()
    expect(screen.getAllByTestId('cross-ranking-row')).toHaveLength(2)
    expect(screen.getByText('Base')).toBeInTheDocument()
    expect(screen.getByText('Intentos A')).toBeInTheDocument()
    expect(screen.getByText('Intentos B')).toBeInTheDocument()
    expect(screen.getByText('AA A')).toBeInTheDocument()
    expect(screen.getByText('AA B')).toBeInTheDocument()
    expect(screen.getByText('+6.63 pp')).toBeInTheDocument()
    expect(screen.getByText('70.00%')).toBeInTheDocument()
    expect(screen.queryByText('H A')).not.toBeInTheDocument()

    const cells = screen.getAllByRole('cell')
    expect(cells[5]).toHaveAttribute('data-delta-up')
    expect(cells[5]).toHaveTextContent('+6.63 pp')
    expect(cells[1]).toHaveTextContent('1.000')
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)

    expect(screen.getAllByTestId('cross-ranking-row')[0].className).toContain(
      'bg-emerald-50',
    )
  })

  it('colorea el health A y B con sus atributos', () => {
    const rows: CrossRankingRow[] = [
      {
        key: 'IPLAN',
        rateA: 0.0719,
        rateB: 0.07,
        delta: -0.19,
        healthA: 3.38,
        healthB: 1.65,
        attemptsA: 16625,
        attemptsB: 114708,
      },
      {
        key: 'GW37',
        rateA: 0.03,
        rateB: 0.02,
        delta: -1,
        healthA: -25.67,
        healthB: -35.33,
        attemptsA: 1200,
        attemptsB: 261943,
      },
    ]
    render(<CrossRankingTable kind="device" rows={rows} />)

    expect(screen.getByText('H A')).toBeInTheDocument()
    expect(screen.getByText('H B')).toBeInTheDocument()
    expect(screen.getByText('16.625')).toBeInTheDocument()
    expect(screen.getByText('261.943')).toBeInTheDocument()

    const firstRow = screen.getAllByTestId('cross-ranking-row')[0]
    const goodCells = firstRow.querySelectorAll('[data-good="true"]')
    expect(goodCells).toHaveLength(2)
    expect(goodCells[0]).toHaveTextContent('3.38')
    expect(goodCells[1]).toHaveTextContent('1.65')

    const secondRow = screen.getAllByTestId('cross-ranking-row')[1]
    const badCells = secondRow.querySelectorAll('[data-bad="true"]')
    expect(badCells).toHaveLength(2)
    expect(badCells[0]).toHaveTextContent('-25.67')
    expect(badCells[1]).toHaveTextContent('-35.33')

    expect(screen.getByText('−1.00 pp')).toBeInTheDocument()
    expect(screen.getByText('−0.19 pp')).toBeInTheDocument()
  })

  it('usa la etiqueta de hora cuando kind es hour', () => {
    render(
      <CrossRankingTable
        kind="hour"
        rows={[
          {
            key: '16',
            rateA: 0.05,
            rateB: 0.06,
            delta: 1,
            healthA: -4,
            healthB: -3,
            attemptsA: 100,
            attemptsB: 200,
          },
        ]}
      />,
    )
    expect(screen.getByText('Hora')).toBeInTheDocument()
    expect(screen.queryByText('Dispositivo')).not.toBeInTheDocument()
  })

  it('muestra estado vacío sin filas', () => {
    render(<CrossRankingTable kind="base" rows={null} />)
    expect(screen.getByTestId('cross-ranking-empty')).toBeInTheDocument()

    render(<CrossRankingTable kind="device" rows={[]} />)
    expect(screen.getAllByTestId('cross-ranking-empty')).toHaveLength(2)
  })
})
