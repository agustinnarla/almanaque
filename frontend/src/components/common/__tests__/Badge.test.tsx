import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from '../Badge'
import {
  congestionTrendClass,
  congestionTrendLabel,
  healthScoreClass,
  healthScoreLabel,
} from '../healthStyle'

describe('Badge', () => {
  it('renderiza CRITICAL en español', () => {
    render(<Badge severity="CRITICAL" />)
    const badge = screen.getByTestId('severity-badge')
    expect(badge).toHaveTextContent('Crítico')
    expect(badge).toHaveAttribute('data-severity', 'CRITICAL')
    expect(badge.className).toContain('bg-red-100')
  })

  it('renderiza SUCCESS en español', () => {
    render(<Badge severity="SUCCESS" />)
    expect(screen.getByTestId('severity-badge')).toHaveTextContent('Éxito')
  })
})

describe('congestion trend badge', () => {
  it('alinea el badge con la dirección del delta en pp', () => {
    expect(congestionTrendLabel(-1.02)).toBe('Mejorando')
    expect(congestionTrendLabel(2.5)).toBe('Empeorando')
    expect(congestionTrendLabel(0)).toBe('Sin cambios')
    expect(congestionTrendLabel(null)).toBe('Sin datos')
    expect(congestionTrendClass(-1.02)).toContain('bg-emerald-100')
    expect(congestionTrendClass(2.5)).toContain('bg-red-100')
    expect(congestionTrendClass(0)).toContain('bg-slate-100')
  })
})

describe('health score badge', () => {
  it('clasifica por cortes < -25, [-25, 0) y >= 0', () => {
    expect(healthScoreLabel(5)).toBe('Saludable')
    expect(healthScoreLabel(-3)).toBe('Aceptable')
    expect(healthScoreLabel(-15.77)).toBe('Aceptable')
    expect(healthScoreLabel(-26.8)).toBe('Crítico')
    expect(healthScoreLabel(null)).toBe('Sin datos')
    expect(healthScoreClass(0)).toContain('bg-emerald-100')
    expect(healthScoreClass(-25)).toContain('bg-amber-100')
    expect(healthScoreClass(-25.01)).toContain('bg-rose-100')
  })
})
