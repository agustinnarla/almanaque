import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CHART_PALETTES, MAX_BAR_SIZE, useChartPalette } from '../chartPalette'
import { setThemePreference } from '../theme'

describe('chartPalette', () => {
  afterEach(() => {
    act(() => setThemePreference('system'))
    window.localStorage.clear()
  })

  it('usa los slots validados de la paleta categórica, en orden fijo, en cada modo', () => {
    // Validated with dataviz validate_palette.js: ALL CHECKS PASS on #ffffff
    // (light) and on #0f172a (dark).
    expect(CHART_PALETTES.light.series).toEqual(['#2a78d6', '#eb6834'])
    expect(CHART_PALETTES.light.trunks).toEqual(['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'])
    expect(CHART_PALETTES.dark.series).toEqual(['#3987e5', '#d95926'])
    expect(CHART_PALETTES.dark.trunks).toEqual(['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'])
    expect(CHART_PALETTES.light.surface).toBe('#ffffff')
    expect(CHART_PALETTES.dark.surface).toBe('#0f172a')
    expect(MAX_BAR_SIZE).toBe(24)
  })

  it('sigue al tema elegido', () => {
    const { result } = renderHook(() => useChartPalette())
    expect(result.current).toBe(CHART_PALETTES.light)
    act(() => setThemePreference('dark'))
    expect(result.current).toBe(CHART_PALETTES.dark)
  })
})
