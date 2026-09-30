import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { BaseComparison } from '../../../types/api'
import { BasesCompareTable } from '../BasesCompareTable'

const rows: BaseComparison[] = [
  {
    base: '80',
    total_calls_a: 1200,
    total_calls_b: 9000,
    agent_answer_rate_a: 0.0654,
    agent_answer_rate_b: 0.0489,
    delta_rate: -0.0165,
    share_a: 0.4,
    share_b: 0.6,
    share_delta: 0.2,
    relative_change_pct: -25.23,
  },
  {
    base: '34',
    total_calls_a: 800,
    total_calls_b: 5000,
    agent_answer_rate_a: 0.05,
    agent_answer_rate_b: 0.07,
    delta_rate: 0.02,
    share_a: 0.3,
    share_b: 0.25,
    share_delta: -0.05,
    relative_change_pct: 40,
  },
]

describe('BasesCompareTable', () => {
  it('renderiza una fila por base con AA, Δ y share', () => {
    render(<BasesCompareTable rows={rows} />)
    expect(screen.getByTestId('bases-compare-table')).toBeInTheDocument()
    const trs = screen.getAllByTestId('bases-compare-row')
    expect(trs).toHaveLength(2)
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('34')).toBeInTheDocument()
    expect(screen.getByText('6.54%')).toBeInTheDocument()
    expect(screen.getByText('4.89%')).toBeInTheDocument()
    expect(screen.getByText('−1.65 pp')).toBeInTheDocument()
    expect(screen.getByText('+2.00 pp')).toBeInTheDocument()
    expect(screen.getByText('40.0%')).toBeInTheDocument()
  })

  it('muestra empty-state sin filas', () => {
    render(<BasesCompareTable rows={null} />)
    expect(screen.getByTestId('bases-compare-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('bases-compare-table')).not.toBeInTheDocument()
  })
})
