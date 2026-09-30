import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SegmentRankingTable } from '../SegmentRankingTable'
import type { SegmentRankingResponse } from '../../../types/api'

const data: SegmentRankingResponse = {
  min_calls_applied: 50,
  limit_applied: 5,
  best: [
    {
      device: 'IPLAN',
      total_calls: 16625,
      agent_answer_rate: 0.0719,
      busy_rate: 0.0256,
      congestion_rate: 0.0168,
      health_score: 3.38,
    },
  ],
  worst: [
    {
      device: 'GW37',
      total_calls: 900,
      agent_answer_rate: 0.03,
      busy_rate: 0.4,
      congestion_rate: 0.05,
      health_score: -25.67,
    },
  ],
}

describe('SegmentRankingTable', () => {
  it('renderiza bloques de mejores y peores con health score', () => {
    render(<SegmentRankingTable data={data} kind="device" />)
    expect(screen.getByText('Mejores')).toBeInTheDocument()
    expect(screen.getByText('Peores')).toBeInTheDocument()
    expect(screen.getAllByTestId('segment-ranking-row')).toHaveLength(2)
    expect(screen.getByText('IPLAN')).toBeInTheDocument()
    expect(screen.getByText('GW37')).toBeInTheDocument()
    expect(screen.getByText('3.38')).toBeInTheDocument()
    expect(screen.getByText('-25.67')).toBeInTheDocument()
    const goodCell = screen.getByText('3.38').closest('td')
    const badCell = screen.getByText('-25.67').closest('td')
    expect(goodCell).toHaveAttribute('data-good', 'true')
    expect(badCell).toHaveAttribute('data-bad', 'true')
    expect(screen.queryByText(/Volumen mínimo 50 llamadas/)).not.toBeInTheDocument()
  })

  it('usa la columna de hora cuando kind es hour', () => {
    const hours: SegmentRankingResponse = {
      ...data,
      best: [{ ...data.best[0], device: undefined, hora: 16 }],
      worst: [],
    }
    render(<SegmentRankingTable data={hours} kind="hour" />)
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.queryByText('IPLAN')).not.toBeInTheDocument()
  })

  it('muestra estado vacío sin rankings', () => {
    render(<SegmentRankingTable data={null} kind="device" />)
    expect(screen.getByTestId('segment-ranking-empty')).toBeInTheDocument()
  })

  it('envuelve las tablas en scroll horizontal con ancho mínimo', () => {
    render(<SegmentRankingTable data={data} kind="device" />)
    const tables = screen.getAllByRole('table')
    expect(tables).toHaveLength(2)
    for (const table of tables) {
      expect(table.className).toContain('min-w-[560px]')
      expect(table.parentElement?.className).toContain('overflow-x-auto')
    }
  })

  it('muestra estado vacío cuando best y worst están vacíos', () => {
    render(
      <SegmentRankingTable
        data={{ min_calls_applied: 50, limit_applied: 5, best: [], worst: [] }}
        kind="device"
      />,
    )
    expect(screen.getByTestId('segment-ranking-empty')).toBeInTheDocument()
  })
})
