import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterRangeBar } from '../FilterRangeBar'
import { TEST_CATALOG } from '../../../test/catalog'

describe('FilterRangeBar', () => {
  it('renderiza los campos con los valores iniciales', () => {
    render(
      <FilterRangeBar
        initial={{ campaign: '35', from: '2026-09-01', to: '2026-09-15', minCalls: 50 }}
        catalog={TEST_CATALOG}
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
        initial={{ campaign: '35', from: '2026-09-01', to: '2026-09-15', minCalls: 50 }}
        catalog={TEST_CATALOG}
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
      minCalls: 50,
    })
  })

  it('ofrece las campañas del catálogo y limita las fechas a su rango', async () => {
    const onApply = vi.fn()
    render(
      <FilterRangeBar
        initial={{ campaign: '35', from: '2026-09-01', to: '2026-09-15', minCalls: 50 }}
        catalog={TEST_CATALOG}
        onApply={onApply}
      />,
    )
    expect(
      within(screen.getByLabelText('Campaña'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['35 · 11 días', '38 · 11 días'])
    expect(screen.getByLabelText('Desde')).toHaveAttribute('min', '2026-09-01')
    expect(screen.getByLabelText('Hasta')).toHaveAttribute('max', '2026-09-15')

    await userEvent.selectOptions(screen.getByLabelText('Campaña'), '38')
    await userEvent.click(screen.getByTestId('filter-range-submit'))
    expect(onApply).toHaveBeenCalledWith({
      campaign: '38',
      from: '2026-09-01',
      to: '2026-09-15',
      minCalls: 50,
    })
  })

  it('emite el mínimo de llamadas elegido', async () => {
    const onApply = vi.fn()
    render(
      <FilterRangeBar
        initial={{ campaign: '35', from: '2026-09-01', to: '2026-09-15', minCalls: 50 }}
        catalog={TEST_CATALOG}
        onApply={onApply}
      />,
    )
    expect(screen.getByLabelText('Mín. llamadas')).toHaveValue('50')
    await userEvent.selectOptions(screen.getByLabelText('Mín. llamadas'), '100')
    await userEvent.click(screen.getByTestId('filter-range-submit'))
    expect(onApply).toHaveBeenCalledWith({
      campaign: '35',
      from: '2026-09-01',
      to: '2026-09-15',
      minCalls: 100,
    })
  })
})
