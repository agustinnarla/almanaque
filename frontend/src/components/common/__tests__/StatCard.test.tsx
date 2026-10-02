import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard } from '../StatCard'

describe('StatCard', () => {
  it('muestra valor y delta positivo con signo +', () => {
    render(
      <StatCard title="Total" value="1.400 → 1.100" delta={12.5} deltaLabel="vs A" />,
    )
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByTestId('stat-value')).toHaveTextContent('1.400 → 1.100')
    expect(screen.getByTestId('stat-delta')).toHaveTextContent('+12.50%')
  })

  it('muestra delta negativo en rojo por defecto', () => {
    render(<StatCard title="Contacto" value="10% → 8%" delta={-17.92} />)
    const delta = screen.getByTestId('stat-delta')
    expect(delta).toHaveTextContent('−17.92%')
    expect(delta.className).toContain('text-red-600')
    expect(delta).toHaveAttribute('data-bad')
  })

  it('pinta de verde un delta negativo con goodWhenNegative', () => {
    render(
      <StatCard
        title="Congestión"
        value="8.5% → 7.5%"
        delta={-1.02}
        deltaIsPercent={false}
        goodWhenNegative
        deltaLabel="pp vs A"
      />,
    )
    const delta = screen.getByTestId('stat-delta')
    expect(delta).toHaveTextContent('−1.02')
    expect(delta).toHaveTextContent('pp vs A')
    expect(delta.className).toContain('text-emerald-600')
    expect(delta).toHaveAttribute('data-good')
  })

  it('pinta de rojo un delta positivo con goodWhenNegative', () => {
    render(
      <StatCard title="Congestión" value="7% → 9%" delta={2} deltaIsPercent={false} goodWhenNegative />,
    )
    expect(screen.getByTestId('stat-delta').className).toContain('text-red-600')
  })

  it('omite delta cuando es null', () => {
    render(<StatCard title="Health" value="—" delta={null} />)
    expect(screen.queryByTestId('stat-delta')).not.toBeInTheDocument()
  })

  it('muestra delta dual pp y relativo entre parentesis', () => {
    render(
      <StatCard
        title="Tasa de contacto"
        value="6.54% → 7.90%"
        delta={1.36}
        deltaIsPercent={false}
        deltaSuffix="pp"
        deltaSecondary={20.75}
      />,
    )
    const delta = screen.getByTestId('stat-delta')
    expect(delta).toHaveTextContent('+1.36 pp')
    expect(delta).toHaveTextContent('(+20.75%)')
    expect(delta).toHaveAttribute('data-good')
  })

  it('muestra solo el sufijo pp sin secundario', () => {
    render(
      <StatCard
        title="Tasa"
        value="1% → 2%"
        delta={-1.5}
        deltaIsPercent={false}
        deltaSuffix="pp"
      />,
    )
    const delta = screen.getByTestId('stat-delta')
    expect(delta).toHaveTextContent('−1.50 pp')
    expect(delta).not.toHaveTextContent('(')
  })

  it('muestra solo el secundario cuando el primario es null', () => {
    render(
      <StatCard title="Tasa" value="—" delta={null} deltaSecondary={-12.5} />,
    )
    const delta = screen.getByTestId('stat-delta')
    expect(delta).toHaveTextContent('−12.50%')
    expect(delta).toHaveAttribute('data-bad')
  })
  it('hero agranda el valor; el título va en mayúscula inicial', () => {
    const { rerender } = render(<StatCard title="Tasa de contacto" value="5.94%" hero />)
    expect(screen.getByTestId('stat-card')).toHaveAttribute('data-hero')
    expect(screen.getByTestId('stat-value').className).toContain('lg:text-5xl')
    expect(screen.getByText('Tasa de contacto').className).not.toContain('uppercase')

    rerender(<StatCard title="Total" value="35.413" />)
    expect(screen.getByTestId('stat-card')).not.toHaveAttribute('data-hero')
    expect(screen.getByTestId('stat-value').className).toContain('text-2xl')
  })
  it('neutral: la variación queda en gris aunque suba o baje', () => {
    render(<StatCard title="Total" value="9.451" delta={-30.08} neutral deltaTitle="Comparado con 14/09 → 20/09" />)
    const delta = screen.getByTestId('stat-delta')
    expect(delta).toHaveTextContent('−30.08%')
    expect(delta.className).toContain('text-slate-500')
    expect(delta).not.toHaveAttribute('data-bad')
    expect(delta).toHaveAttribute('title', 'Comparado con 14/09 → 20/09')
  })

  it('muestra la mini línea debajo de la variación', () => {
    render(<StatCard title="AA" value="10.08%" delta={3.23} trend={<svg data-testid="trend" />} />)
    const delta = screen.getByTestId('stat-delta')
    expect(delta.compareDocumentPosition(screen.getByTestId('trend')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
