import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterCrossCampaignBar } from '../FilterCrossCampaignBar'
import { TEST_CATALOG } from '../../../test/catalog'

const INITIAL = {
  campaignA: '35',
  campaignB: '38',
  minCalls: 50,
  from: '2026-09-01',
  to: '2026-09-15',
}

describe('FilterCrossCampaignBar', () => {
  it('renderiza los campos con los valores iniciales y el rango editable', () => {
    render(
      <FilterCrossCampaignBar
        initial={INITIAL}
        catalog={TEST_CATALOG}
        onCompare={() => {}}
      />,
    )
    expect(screen.getByTestId('filter-cross-campaign')).toBeInTheDocument()
    expect(screen.getByLabelText('Campaña A')).toHaveValue('35')
    expect(screen.getByLabelText('Campaña B')).toHaveValue('38')
    expect(screen.getByLabelText('Mín. llamadas')).toHaveValue('50')
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-09-01')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-09-15')
    expect(screen.queryByText(/Rango fijo/)).not.toBeInTheDocument()
  })

  it('emite los valores al enviar el formulario', async () => {
    const onCompare = vi.fn()
    render(
      <FilterCrossCampaignBar
        initial={INITIAL}
        catalog={TEST_CATALOG}
        onCompare={onCompare}
      />,
    )
    await userEvent.selectOptions(screen.getByLabelText('Campaña A'), '38')
    await userEvent.selectOptions(screen.getByLabelText('Campaña B'), '35')
    await userEvent.selectOptions(screen.getByLabelText('Mín. llamadas'), '100')
    await userEvent.clear(screen.getByLabelText('Desde'))
    await userEvent.type(screen.getByLabelText('Desde'), '2026-09-07')
    await userEvent.clear(screen.getByLabelText('Hasta'))
    await userEvent.type(screen.getByLabelText('Hasta'), '2026-09-11')
    await userEvent.click(screen.getByTestId('filter-cross-submit'))
    expect(onCompare).toHaveBeenCalledWith({
      campaignA: '38',
      campaignB: '35',
      minCalls: 100,
      from: '2026-09-07',
      to: '2026-09-11',
    })
  })
})
