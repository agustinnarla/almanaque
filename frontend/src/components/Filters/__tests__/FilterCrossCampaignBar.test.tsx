import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FilterCrossCampaignBar } from '../FilterCrossCampaignBar'

describe('FilterCrossCampaignBar', () => {
  it('renderiza los campos con los valores iniciales y el rango fijo', () => {
    render(
      <FilterCrossCampaignBar
        initial={{ campaignA: '35', campaignB: '38', minCalls: 50 }}
        startDate="2026-09-01"
        endDate="2026-09-15"
        onCompare={() => {}}
      />,
    )
    expect(screen.getByTestId('filter-cross-campaign')).toBeInTheDocument()
    expect(screen.getByLabelText('Campaña A')).toHaveValue('35')
    expect(screen.getByLabelText('Campaña B')).toHaveValue('38')
    expect(screen.getByLabelText('Mín. llamadas')).toHaveValue('50')
    expect(
      screen.getByText(/Rango fijo: 2026-09-01 → 2026-09-15/),
    ).toBeInTheDocument()
  })

  it('emite los valores al enviar el formulario', async () => {
    const onCompare = vi.fn()
    render(
      <FilterCrossCampaignBar
        initial={{ campaignA: '35', campaignB: '38', minCalls: 50 }}
        startDate="2026-09-01"
        endDate="2026-09-15"
        onCompare={onCompare}
      />,
    )
    await userEvent.clear(screen.getByLabelText('Campaña B'))
    await userEvent.type(screen.getByLabelText('Campaña B'), '40')
    await userEvent.selectOptions(screen.getByLabelText('Mín. llamadas'), '100')
    await userEvent.click(screen.getByTestId('filter-cross-submit'))
    expect(onCompare).toHaveBeenCalledWith({
      campaignA: '35',
      campaignB: '40',
      minCalls: 100,
    })
  })
})
