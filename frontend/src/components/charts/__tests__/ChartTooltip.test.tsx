import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChartTooltip } from '../ChartTooltip'

const formatValue = (key: string, value: number) =>
  key === 'rate' ? `${value.toFixed(2)}%` : value.toLocaleString('es-AR')

const payload = [
  { dataKey: 'rate', name: 'Agent Answer %', value: 6.25, color: '#2a78d6', payload: { total: 3402 } },
  { dataKey: 'total', name: 'Llamadas', value: 3402, color: '#eb6834', payload: { total: 3402 } },
]

function rows() {
  return screen
    .getByTestId('chart-tooltip')
    .querySelectorAll('p.flex')
}

describe('ChartTooltip', () => {
  it('no se muestra si está inactivo o sin datos', () => {
    const { container, rerender } = render(
      <ChartTooltip active={false} payload={payload} label="09/09" formatValue={formatValue} />,
    )
    expect(container).toBeEmptyDOMElement()
    rerender(<ChartTooltip active payload={[]} label="09/09" formatValue={formatValue} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('pone el valor primero, formateado, y el nombre después', () => {
    render(<ChartTooltip active payload={payload} label={9} labelPrefix="Hora" formatValue={formatValue} />)
    expect(screen.getByText('Hora 9')).toBeInTheDocument()
    const [first, second] = rows()
    expect(first.children[1]).toHaveTextContent('6.25%')
    expect(first.children[1].className).toContain('font-semibold')
    expect(first.children[2]).toHaveTextContent('Agent Answer %')
    expect(second.children[1]).toHaveTextContent('3.402')
  })

  it('invierte el orden y muestra el pie y «—» para valores nulos', () => {
    render(
      <ChartTooltip
        active
        payload={[...payload, { dataKey: 'otras', name: 'Otras', value: null, color: '#c3c2b7' }]}
        label="09/09"
        formatValue={formatValue}
        reverse
        footer={(items) => `Total: ${String(items[0].payload?.total)}`}
      />,
    )
    const names = Array.from(rows()).map((row) => row.children[2].textContent)
    expect(names).toEqual(['Otras', 'Llamadas', 'Agent Answer %'])
    expect(rows()[0].children[1]).toHaveTextContent('—')
    expect(screen.getByText('Total: 3402')).toBeInTheDocument()
  })
})
