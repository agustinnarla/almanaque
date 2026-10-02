import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CHART_PALETTES } from '../../../lib/chartPalette'
import { Sparkline } from '../Sparkline'

describe('Sparkline', () => {
  it('dibuja la línea en tinta de baja prioridad y destaca el último punto', () => {
    render(<Sparkline values={[5, 7, 6, 10]} label="AA diario" width={100} height={20} />)
    expect(screen.getByRole('img', { name: 'AA diario' })).toBeInTheDocument()
    const segments = screen.getAllByTestId('sparkline-segment')
    expect(segments).toHaveLength(1)
    expect(segments[0]).toHaveAttribute('stroke', CHART_PALETTES.light.ink.tick)
    expect(segments[0].getAttribute('points')!.split(' ')).toHaveLength(4)
    const last = screen.getByTestId('sparkline-last')
    expect(last).toHaveAttribute('fill', CHART_PALETTES.light.series[0])
    expect(Number(last.getAttribute('cx'))).toBeCloseTo(96, 5)
    expect(Number(last.getAttribute('cy'))).toBeCloseTo(4, 5)
  })

  it('corta la línea en los días sin tasa y el último punto es el último con dato', () => {
    render(<Sparkline values={[5, 6, null, 7, 8, null]} label="AA" width={100} height={20} />)
    expect(screen.getAllByTestId('sparkline-segment')).toHaveLength(2)
    expect(Number(screen.getByTestId('sparkline-last').getAttribute('cx'))).toBeCloseTo(4 + (4 * 92) / 5, 5)
  })

  it('con valores iguales queda una línea plana; con menos de 2, nada', () => {
    const { container, rerender } = render(<Sparkline values={[6, 6]} label="AA" height={20} />)
    expect(screen.getByTestId('sparkline-last')).toHaveAttribute('cy', '10')
    rerender(<Sparkline values={[6, null]} label="AA" />)
    expect(container).toBeEmptyDOMElement()
  })
})
