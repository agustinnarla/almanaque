import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PatternsPanel } from '../PatternsPanel'
import type { PatternAlert } from '../../../types/api'

function alert(fecha: string, base: string, device: string, rate: number, campaign = '35'): PatternAlert {
  return {
    fecha,
    hora: 9,
    campaign,
    base,
    device,
    agent_answer_rate: rate,
    pattern_alert: true,
  }
}

describe('PatternsPanel', () => {
  it('agrupa por día y muestra el top de combinaciones', () => {
    const alerts = [
      alert('2026-09-02', '80', 'GW20', 0),
      alert('2026-09-01', '80', 'GW20', 0.01),
      alert('2026-09-01', '76', 'GW37', 0),
      alert('2026-09-01', '80', 'IPLAN2', 0),
    ]
    render(<PatternsPanel alerts={alerts} campaign="35" />)

    expect(screen.getByTestId('patterns-panel')).toBeInTheDocument()
    const dayRows = screen.getAllByTestId('pattern-day-row')
    expect(dayRows).toHaveLength(2)
    expect(dayRows[0]).toHaveAttribute('title', '2026-09-01')
    expect(dayRows[0]).toHaveTextContent('01/09')
    expect(dayRows[0]).toHaveTextContent('3')
    expect(screen.getByText('Alertas por día')).toBeInTheDocument()
    expect(screen.getByText('4 alertas')).toBeInTheDocument()

    const combos = screen.getAllByTestId('pattern-combo-row')
    expect(combos).toHaveLength(3)
    expect(combos[0]).toHaveTextContent('80')
    expect(combos[0]).toHaveTextContent('GW20')
    expect(combos[0]).toHaveTextContent('2')
    expect(combos[0]).toHaveTextContent('50.0%')
    expect(combos[0].className).toContain('bg-amber-50')
  })

  it('muestra el umbral de la campaña calculado por el backend', () => {
    render(
      <PatternsPanel
        alerts={[
          { ...alert('2026-09-01', '80', 'GW20', 0.02), threshold_rate: 0.0356, campaign_rate: 0.0594 },
        ]}
        campaign="35"
      />,
    )
    expect(screen.getByTestId('patterns-threshold')).toHaveTextContent(
      'Umbral de la campaña 35: AA menor a 3.56% (60% del promedio de 5.94%)',
    )
  })

  it('filtra alertas de otras campañas', () => {
    render(
      <PatternsPanel
        alerts={[alert('2026-09-01', '80', 'GW20', 0, '38')]}
        campaign="35"
      />,
    )
    expect(screen.getByTestId('patterns-empty')).toBeInTheDocument()
  })

  it('muestra vacío cuando la campaña no tiene alertas', () => {
    render(<PatternsPanel alerts={[]} campaign="35" />)
    expect(screen.getByTestId('patterns-empty')).toBeInTheDocument()
  })

  it('no renderiza nada mientras carga', () => {
    render(<PatternsPanel alerts={null} campaign="35" />)
    expect(screen.queryByTestId('patterns-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('patterns-empty')).not.toBeInTheDocument()
  })
})
