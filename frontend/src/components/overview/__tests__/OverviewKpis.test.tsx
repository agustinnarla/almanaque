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
  attendable_answer_rate: 2104 / (35413 - 11282),
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
  it('renderiza los 5 KPIs con la tasa de contacto como cifra principal', () => {
    render(<OverviewKpis summary={summary} />)
    expect(screen.getByTestId('overview-kpis')).toBeInTheDocument()
    const cards = screen.getAllByTestId('stat-card')
    expect(cards.filter((card) => card.dataset.hero)).toEqual([cards[0]])
    const values = screen
      .getAllByTestId('stat-value')
      .map((el) => el.textContent)
    expect(values[0]).toBe('5.94%')
    expect(values[1]).toBe('8.72%')
    expect(values[2]).toBe('35.413')
    expect(values[3]).toBe('31.86%')
    expect(values[4]).toBe('22.027')
    expect(screen.getByText('AA sobre atendibles')).toBeInTheDocument()
    expect(screen.getByText('Agentes ÷ llamadas sin contestador')).toBeInTheDocument()
    expect(cards[0].className).toContain('lg:row-span-2')
    expect(screen.getByText('No contesta / fallidas')).toBeInTheDocument()
  })

  it('muestra — cuando agent_answer_rate es null', () => {
    render(
      <OverviewKpis
        summary={{ ...summary, agent_answer_rate: null, attendable_answer_rate: null, total_calls: 0 }}
      />,
    )
    const values = screen
      .getAllByTestId('stat-value')
      .map((el) => el.textContent)
    expect(values[0]).toBe('—')
    expect(values[1]).toBe('—')
    expect(values[3]).toBe('—')
  })

  describe('con el período anterior', () => {
    // Real campaign 35: S39 against S38.
    const s39 = {
      campaign: '35', total_calls: 9451, agent_answers: 953, machine_answers: 4601, rejected_calls: 3897,
      agent_answer_rate: 953 / 9451, attendable_answer_rate: 953 / (9451 - 4601),
    }
    const s38 = {
      campaign: '35', total_calls: 13517, agent_answers: 926, machine_answers: 6988, rejected_calls: 5603,
      agent_answer_rate: 926 / 13517, attendable_answer_rate: 926 / (13517 - 6988),
    }
    const previous = { summary: s38, range: { from: '2026-09-14', to: '2026-09-20' }, label: 'vs semana anterior' }
    const day = (fecha: string, rate: number) => ({
      fecha, total_calls: 1000, agent_answers: rate * 1000, machine_answers: 0, agent_answer_rate: rate,
    })

    it('muestra cada variación con su color según el significado', () => {
      render(<OverviewKpis summary={s39} previous={previous} />)
      const deltas = screen.getAllByTestId('stat-delta')
      expect(deltas[0]).toHaveTextContent('+3.23 pp')
      expect(deltas[0]).toHaveTextContent('vs semana anterior')
      expect(deltas[0]).toHaveAttribute('data-good')
      expect(deltas[0]).toHaveAttribute('title', 'Comparado con 14/09 → 20/09')
      expect(deltas[2]).toHaveTextContent('−30.08%')
      expect(deltas[2]).not.toHaveAttribute('data-good')
      expect(deltas[2]).not.toHaveAttribute('data-bad')
      // Answering machines: 51.70% → 48.68% of the calls, a good drop.
      expect(deltas[3]).toHaveTextContent('−3.02 pp')
      expect(deltas[3]).toHaveAttribute('data-good')
      expect(screen.queryByTestId('no-previous-period')).not.toBeInTheDocument()
    })

    it('sin datos del período anterior lo dice y no muestra variaciones', () => {
      render(
        <OverviewKpis
          summary={s39}
          previous={{ summary: { ...s38, total_calls: 0 }, range: { from: '2026-08-01', to: '2026-08-31' }, label: 'vs período anterior' }}
        />,
      )
      expect(screen.queryAllByTestId('stat-delta')).toHaveLength(0)
      expect(screen.getByTestId('no-previous-period')).toHaveTextContent(
        'Sin datos del período anterior (01/08 → 31/08): no hay variaciones para mostrar.',
      )
    })

    it('la tarjeta principal lleva la mini línea del AA diario', () => {
      render(<OverviewKpis summary={s39} daily={[day('2026-09-21', 0.0959), day('2026-09-22', 0.1113)]} />)
      expect(screen.getByRole('img', { name: 'AA diario del 21/09 al 22/09: de 9.59% a 11.13%' })).toBeInTheDocument()
    })
  })
})
