import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CompareDiagnosticsResponse, SummaryKpi } from '../../../types/api'
import { KpiGrid } from '../KpiGrid'

function summary(overrides: Partial<SummaryKpi> = {}): SummaryKpi {
  return {
    total_calls_a: 1000,
    total_calls_b: 1100,
    delta_total_pct: 10,
    agent_answer_rate_a: 0.0654,
    agent_answer_rate_b: 0.079,
    delta_rate: 0.0136,
    delta_percentage: 20.75,
    busy_rate_a: 0.2,
    busy_rate_b: 0.22,
    congestion_rate_a: 0.05,
    congestion_rate_b: 0.04,
    congestion_rate: 0.04,
    health_score: 1.5,
    ...overrides,
  }
}

function payload(s: SummaryKpi | null): CompareDiagnosticsResponse {
  return {
    campaign: '35',
    date_a: '2026-09-01',
    date_b: '2026-09-02',
    min_calls_applied: 50,
    summary: s,
    root_causes: [],
    positive_drivers: [],
    insights: [],
    bases_comparison: null,
    gateways_comparison: null,
  }
}

describe('KpiGrid', () => {
  it('muestra Tasa de contacto con delta dual pp + relativo', () => {
    render(<KpiGrid data={payload(summary())} />)
    expect(screen.getByText('Tasa de contacto')).toBeInTheDocument()
    const cards = screen.getAllByTestId('stat-delta')
    const contact = cards.find((el) =>
      el.textContent?.includes('+1.36 pp'),
    )
    expect(contact).toBeDefined()
    expect(contact).toHaveTextContent('+1.36 pp')
    expect(contact).toHaveTextContent('(+20.75%)')
    expect(contact).not.toHaveTextContent('relativo')
  })

  it('omite el delta dual cuando los campos son null', () => {
    render(
      <KpiGrid
        data={payload(summary({ delta_rate: null, delta_percentage: null }))}
      />,
    )
    const contactTitle = screen.getByText('Tasa de contacto')
    const card = contactTitle.closest('[data-testid="stat-card"]')
    expect(card).not.toBeNull()
    expect(
      card!.querySelector('[data-testid="stat-delta"]'),
    ).not.toBeInTheDocument()
  })

  it('muestra empty-state cuando summary es null', () => {
    render(<KpiGrid data={payload(null)} />)
    expect(
      screen.getByText(/No hay datos de resumen para las fechas/i),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('stat-card')).not.toBeInTheDocument()
  })

  it('conserva las otras tarjetas sin dual', () => {
    render(<KpiGrid data={payload(summary())} />)
    expect(screen.getByText('Total de llamadas')).toBeInTheDocument()
    expect(screen.getByText('Congestión (Día B)')).toBeInTheDocument()
    expect(screen.getByText('Health score (Día B)')).toBeInTheDocument()
    const totalDelta = screen
      .getAllByTestId('stat-delta')
      .find((el) => el.textContent?.includes('+10.00%'))
    expect(totalDelta).toBeDefined()
  })

  it('usa labelA/labelB opcionales para Congestión y Health score', () => {
    render(<KpiGrid data={payload(summary())} labelA="Campaña" labelB="Campaña" />)
    expect(screen.getByText('Congestión (Campaña B)')).toBeInTheDocument()
    expect(screen.getByText('Health score (Campaña B)')).toBeInTheDocument()
    expect(screen.getByText(/Campaña A: 1\.000/)).toBeInTheDocument()
  })
})
