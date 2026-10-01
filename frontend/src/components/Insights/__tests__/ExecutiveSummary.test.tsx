import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExecutiveSummary } from '../ExecutiveSummary'

describe('ExecutiveSummary', () => {
  it('muestra una línea por item con su etiqueta, o nada si no hay items', () => {
    const { container, rerender } = render(
      <ExecutiveSummary
        items={[
          { kind: 'context', label: 'Contexto', text: 'AA 5.94%' },
          { kind: 'action', label: 'Qué hacer', text: 'Revisar GW20.' },
        ]}
      />,
    )
    expect(screen.getByRole('region', { name: 'Resumen' })).toHaveAttribute(
      'id',
      'sec-resumen',
    )
    expect(screen.getByTestId('summary-context')).toHaveTextContent('ContextoAA 5.94%')
    expect(screen.getByTestId('summary-action')).toHaveTextContent(
      'Qué hacerRevisar GW20.',
    )
    expect(screen.queryByTestId('summary-problem')).not.toBeInTheDocument()

    rerender(<ExecutiveSummary items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
