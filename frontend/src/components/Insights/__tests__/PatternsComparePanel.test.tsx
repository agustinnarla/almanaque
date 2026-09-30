import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PatternsComparePanel } from '../PatternsComparePanel'
import type { PatternAlert } from '../../../types/api'

function alert(fecha: string, base: string, device: string, rate: number, campaign: string): PatternAlert {
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

describe('PatternsComparePanel', () => {
  it('muestra fechas unidas con barras por campaña y totales', () => {
    const alerts = [
      alert('2026-09-01', '80', 'GW20', 0, '35'),
      alert('2026-09-01', '80', 'GW20', 0, '35'),
      alert('2026-09-02', '34', 'IPLAN', 0.01, '38'),
      alert('2026-09-01', '80', 'GW20', 0, '99'),
    ]
    render(
      <PatternsComparePanel alerts={alerts} campaignA="35" campaignB="38" />,
    )

    expect(screen.getByTestId('patterns-compare-panel')).toBeInTheDocument()
    const dayRows = screen.getAllByTestId('pattern-compare-day-row')
    expect(dayRows).toHaveLength(2)
    expect(dayRows[0]).toHaveAttribute('title', '2026-09-01')
    expect(dayRows[0]).toHaveTextContent('01/09')

    expect(screen.getByText('35: 2 alertas')).toBeInTheDocument()
    expect(screen.getByText('38: 1 alertas')).toBeInTheDocument()

    const comboRows = screen.getAllByTestId('pattern-compare-combo-row')
    expect(comboRows).toHaveLength(2)
    expect(comboRows[0]).toHaveTextContent('80')
    expect(comboRows[0]).toHaveTextContent('GW20')
    expect(comboRows[0]).toHaveTextContent('2')
    expect(comboRows[1]).toHaveTextContent('34')
    expect(comboRows[1]).toHaveTextContent('IPLAN')
    expect(comboRows[0].className).toContain('bg-amber-50')
  })

  it('agrupa la misma combinación de ambas campañas en una fila', () => {
    const alerts = [
      alert('2026-09-01', '80', 'GW20', 0.03, '35'),
      alert('2026-09-01', '80', 'GW20', 0.02, '38'),
      alert('2026-09-01', '80', 'GW20', 0.01, '38'),
    ]
    render(
      <PatternsComparePanel alerts={alerts} campaignA="35" campaignB="38" />,
    )
    const comboRows = screen.getAllByTestId('pattern-compare-combo-row')
    expect(comboRows).toHaveLength(1)
    expect(comboRows[0]).toHaveTextContent('3')
    expect(screen.getByText('35: 1 alertas')).toBeInTheDocument()
    expect(screen.getByText('38: 2 alertas')).toBeInTheDocument()
  })

  it('muestra vacío cuando ninguna campaña tiene alertas', () => {
    render(
      <PatternsComparePanel
        alerts={[alert('2026-09-01', '80', 'GW20', 0, '99')]}
        campaignA="35"
        campaignB="38"
      />,
    )
    expect(screen.getByTestId('patterns-compare-empty')).toBeInTheDocument()
  })

  it('no renderiza nada mientras carga', () => {
    render(
      <PatternsComparePanel alerts={null} campaignA="35" campaignB="38" />,
    )
    expect(screen.queryByTestId('patterns-compare-panel')).not.toBeInTheDocument()
    expect(screen.queryByTestId('patterns-compare-empty')).not.toBeInTheDocument()
  })
})
