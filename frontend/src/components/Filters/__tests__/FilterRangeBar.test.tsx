import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterRangeBar } from '../FilterRangeBar'

describe('FilterRangeBar', () => {
  it('renderiza los campos con los valores iniciales', () => {
    render(
      <FilterRangeBar
        initial={{ campaign: '35', from: '2026-09-01', to: '2026-09-15' }}
        onApply={() => {}}
      />,
    )
    expect(screen.getByTestId('filter-range-bar')).toBeInTheDocument()
    expect(screen.getByLabelText('Campaña')).toHaveValue('35')
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-09-01')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-09-15')
  })

  it('emite los valores al enviar el formulario', async () => {
    const onApply = vi.fn()
    render(
      <FilterRangeBar
        initial={{ campaign: '35', from: '2026-09-01', to: '2026-09-15' }}
        onApply={onApply}
      />,
    )
    await userEvent.clear(screen.getByLabelText('Desde'))
    await userEvent.type(screen.getByLabelText('Desde'), '2026-09-07')
    await userEvent.click(screen.getByTestId('filter-range-submit'))
    expect(onApply).toHaveBeenCalledWith({
      campaign: '35',
      from: '2026-09-07',
      to: '2026-09-15',
    })
  })
})
