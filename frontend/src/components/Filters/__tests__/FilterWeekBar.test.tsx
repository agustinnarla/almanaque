import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterWeekBar } from '../FilterWeekBar'
import { WEEK_OPTIONS } from '../../../lib/weeks'

describe('FilterWeekBar', () => {
  it('renderiza campaña, las 3 semanas y la info por defecto (S37)', () => {
    render(
      <FilterWeekBar
        initial={{ campaign: '35', weekStart: '2026-09-07' }}
        onApply={() => {}}
      />,
    )
    expect(screen.getByTestId('filter-week-bar')).toBeInTheDocument()
    expect(screen.getByLabelText('Campaña')).toHaveValue('35')
    expect(screen.getByLabelText('Semana')).toHaveValue('2026-09-07')
    expect(screen.getAllByRole('option')).toHaveLength(WEEK_OPTIONS.length)
    expect(screen.getByText(/2026-09-07 → 2026-09-13/)).toBeInTheDocument()
    expect(screen.getByText(/5 días con datos/)).toBeInTheDocument()
    expect(screen.queryByTestId('filter-week-partial')).not.toBeInTheDocument()
  })

  it('marca las semanas parciales en el select y muestra el badge', async () => {
    render(
      <FilterWeekBar
        initial={{ campaign: '35', weekStart: '2026-09-07' }}
        onApply={() => {}}
      />,
    )
    expect(
      screen.getByRole('option', { name: /Semana 36.*parcial/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: /Semana 38.*parcial/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: /Semana 37(?!.*parcial)/ }),
    ).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Semana'), '2026-09-14')
    expect(screen.getByTestId('filter-week-partial')).toBeInTheDocument()
    expect(screen.getByText(/2 días con datos/)).toBeInTheDocument()
  })

  it('emite el rango completo de la semana elegida al enviar', async () => {
    const onApply = vi.fn()
    render(
      <FilterWeekBar
        initial={{ campaign: '35', weekStart: '2026-09-07' }}
        onApply={onApply}
      />,
    )
    await userEvent.selectOptions(screen.getByLabelText('Semana'), '2026-08-31')
    await userEvent.click(screen.getByTestId('filter-week-submit'))
    expect(onApply).toHaveBeenCalledWith({
      campaign: '35',
      from: '2026-08-31',
      to: '2026-09-06',
    })
  })
})
