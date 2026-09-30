import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PrintButton } from '../PrintButton'

describe('PrintButton', () => {
  const printMock = vi.fn()

  beforeEach(() => {
    printMock.mockClear()
    vi.stubGlobal('print', printMock)
    return () => vi.unstubAllGlobals()
  })

  it('dispara window.print() al hacer click', async () => {
    render(<PrintButton />)
    await userEvent.click(screen.getByTestId('print-report'))
    expect(printMock).toHaveBeenCalledTimes(1)
  })

  it('muestra la etiqueta en español y se oculta al imprimir', () => {
    render(<PrintButton />)
    const button = screen.getByTestId('print-report')
    expect(button).toHaveTextContent('Imprimir / PDF')
    expect(button.className).toContain('print:hidden')
  })
})
