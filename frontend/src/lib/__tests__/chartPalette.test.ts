import { describe, expect, it } from 'vitest'
import { CHART_INK, SERIES_COLORS } from '../chartPalette'

describe('chartPalette', () => {
  it('usa los slots validados de la paleta categórica, en orden fijo', () => {
    // Validated with dataviz validate_palette.js on #ffffff: ALL CHECKS PASS.
    expect(SERIES_COLORS).toEqual(['#2a78d6', '#eb6834'])
    expect(CHART_INK).toEqual({ tick: '#898781', grid: '#e1e0d9', baseline: '#c3c2b7' })
  })
})
