import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Recommendation } from '../../../types/api'
import { RecommendationsPanel } from '../RecommendationsPanel'

const warningRec: Recommendation = {
  id: 'rec_gw_pacing',
  type: 'PACING',
  category: 'WARNING',
  entity: 'GW20',
  text: 'GW20 registra línea ocupada del 46.30%.',
}

const successRec: Recommendation = {
  id: 'rec_gw_routing',
  type: 'ROUTING',
  category: 'SUCCESS',
  entity: 'GW39',
  text: 'GW39 tiene la mejor tasa de Answer Agent.',
}

const volumeRec: Recommendation = {
  id: 'rec_volume_drop',
  type: 'VOLUME_DELTA',
  category: 'WARNING',
  entity: '35',
  text: 'El volumen de Answer Agent bajó de 189 a 84.',
}

describe('RecommendationsPanel', () => {
  it('renderiza tarjetas con borde por categoría', () => {
    render(<RecommendationsPanel recommendations={[warningRec, successRec]} />)
    const cards = screen.getAllByTestId('recommendation-card')
    expect(cards).toHaveLength(2)
    expect(cards[0].className).toContain('border-l-amber-500')
    expect(cards[0]).toHaveAttribute('data-category', 'WARNING')
    expect(cards[1].className).toContain('border-l-emerald-500')
    expect(cards[1]).toHaveAttribute('data-category', 'SUCCESS')
    expect(
      screen.getByText(/Generadas automáticamente a partir de los datos cargados/),
    ).toBeInTheDocument()
    expect(screen.getByText(warningRec.text)).toBeInTheDocument()
  })

  it('usa tarjetas claras con badge de severidad y sin título propio', () => {
    render(<RecommendationsPanel recommendations={[warningRec, successRec]} />)
    const cards = screen.getAllByTestId('recommendation-card')
    expect(cards[0].className).toContain('bg-white')
    expect(cards[0].className).not.toContain('bg-slate-900')
    expect(within(cards[0]).getByTestId('severity-badge')).toHaveTextContent('Advertencia')
    expect(within(cards[1]).getByTestId('severity-badge')).toHaveTextContent('Éxito')
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
    expect(screen.queryByText('Observaciones y recomendaciones')).not.toBeInTheDocument()
  })

  it('agrupa en Estrategia de campaña y Alertas del período', () => {
    render(
      <RecommendationsPanel
        recommendations={[warningRec, successRec, volumeRec]}
      />,
    )
    const strategy = screen.getByTestId('rec-section-strategy')
    const period = screen.getByTestId('rec-section-period')
    expect(screen.getByText('Estrategia de campaña')).toBeInTheDocument()
    expect(screen.getByText('Alertas del período')).toBeInTheDocument()
    expect(strategy.querySelectorAll('[data-testid="recommendation-card"]')).toHaveLength(2)
    expect(period.querySelectorAll('[data-testid="recommendation-card"]')).toHaveLength(1)
    expect(volumeRec.text && screen.getByText(volumeRec.text)).toBeInTheDocument()
  })

  it('omite la sección de período sin items de alerta', () => {
    render(<RecommendationsPanel recommendations={[successRec]} />)
    expect(screen.getByTestId('rec-section-strategy')).toBeInTheDocument()
    expect(screen.queryByTestId('rec-section-period')).not.toBeInTheDocument()
  })

  it('muestra empty-state sin recomendaciones', () => {
    render(<RecommendationsPanel recommendations={[]} />)
    expect(screen.getByTestId('recommendations-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('recommendation-card')).not.toBeInTheDocument()
  })

  it('muestra badge de AMD excluido en ROUTING con excluded_amd', () => {
    render(
      <RecommendationsPanel
        recommendations={[
          { ...successRec, entity: 'GW37', excluded_amd: ['IPLAN'] },
        ]}
      />,
    )
    const badge = screen.getByTestId('routing-excluded-amd')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Descartado del ruteo por contestadores')
    expect(badge).toHaveTextContent('IPLAN')
    expect(badge).toHaveTextContent('corregir AMD/troncal')
  })

  it('no muestra badge sin excluded_amd o en reglas que no sean ROUTING', () => {
    render(
      <RecommendationsPanel recommendations={[successRec, warningRec]} />,
    )
    expect(screen.queryByTestId('routing-excluded-amd')).not.toBeInTheDocument()
    render(
      <RecommendationsPanel
        recommendations={[{ ...warningRec, excluded_amd: ['X'] as never }]}
      />,
    )
    expect(screen.queryByTestId('routing-excluded-amd')).not.toBeInTheDocument()
  })
})
