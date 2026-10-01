import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CampaignSelect } from '../CampaignSelect'
import { FULL_CATALOG } from '../../../test/catalog'

describe('CampaignSelect', () => {
  it('agrupa las campañas por segmento de negocio', () => {
    render(
      <CampaignSelect
        label="Campaña"
        value="91"
        catalog={FULL_CATALOG}
        onChange={() => {}}
        className=""
      />,
    )
    const select = screen.getByLabelText('Campaña')
    const groups = within(select).getAllByRole('group')
    expect(groups.map((group) => group.getAttribute('label'))).toEqual([
      'Galicia Empresas',
      'Galicia Individuos',
    ])
    expect(
      within(groups[1])
        .getAllByRole('option')
        .map((option) => option.getAttribute('value')),
    ).toEqual(['91', '92'])
    expect(select).toHaveValue('91')
  })
})
