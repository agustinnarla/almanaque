import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SectionNav } from '../SectionNav'

describe('SectionNav', () => {
  it('renderiza un enlace de ancla por sección dentro de un nav accesible', () => {
    render(
      <SectionNav
        links={[
          { id: 'sec-filtros', label: 'Filtros' },
          { id: 'sec-kpis', label: 'Indicadores' },
        ]}
      />,
    )
    const nav = screen.getByRole('navigation', { name: 'Secciones' })
    expect(nav.className).toContain('sticky')
    expect(nav.className).toContain('print:hidden')
    const links = within(nav).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['Filtros', 'Indicadores'])
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#sec-filtros',
      '#sec-kpis',
    ])
  })
})
