import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CampaignSummary } from '../../../types/api'
import { formatRatePct } from '../../../lib/format'
import { OverviewKpis } from '../OverviewKpis'

const summary: CampaignSummary = {
  campaign: '35',
  total_calls: 35413,
  agent_answers: 2104,
  machine_answers: 11282,
  rejected_calls: 22027,
  agent_answer_rate: 0.0594,
}

describe('formatRatePct', () => {
  it('convierte fracción a % con 2 decimales', () => {
    expect(formatRatePct(0.0594)).toBe('5.94%')
    expect(formatRatePct(0)).toBe('0.00%')
  })

  it('muestra em dash en null', () => {
    expect(formatRatePct(null)).toBe('—')
  })
})

describe('OverviewKpis', () => {
  it('renderiza los 4 KPIs con la tasa de contacto como cifra principal', () => {
    render(<OverviewKpis summary={summary} />)
    expect(screen.getByTestId('overview-kpis')).toBeInTheDocument()
    const cards = screen.getAllByTestId('stat-card')
    expect(cards.filter((card) => card.dataset.hero)).toEqual([cards[0]])
    const values = screen
      .getAllByTestId('stat-value')
      .map((el) => el.textContent)
    expect(values[0]).toBe('5.94%')
    expect(values[1]).toBe('35.413')
    expect(values[2]).toBe('31.86%')
    expect(values[3]).toBe('22.027')
    expect(screen.getByText('No contesta / fallidas')).toBeInTheDocument()
  })

  it('muestra — cuando agent_answer_rate es null', () => {
    render(
      <OverviewKpis
        summary={{ ...summary, agent_answer_rate: null, total_calls: 0 }}
      />,
    )
    const values = screen
      .getAllByTestId('stat-value')
      .map((el) => el.textContent)
    expect(values[0]).toBe('—')
    expect(values[2]).toBe('—')
  })
})
