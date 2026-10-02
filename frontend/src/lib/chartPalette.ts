import { useColorScheme, type ColorScheme } from './theme'

export interface ChartPalette {
  // Two-series charts (campaign / A vs B). Slot order is the colorblind-safety
  // mechanism: series A (or a single series) is always slot 1.
  series: readonly [string, string]
  // Stacked trunk volume: slots 1–5 in the same fixed order.
  trunks: readonly string[]
  // Neutral gray for the folded tail ("Otras"), never a generated hue.
  other: string
  ink: { tick: string; grid: string; baseline: string }
  // Card surface: gaps between stacked segments and rings around dots.
  surface: string
  // Spec 058: one-hue blue ramp for magnitude (heatmap), low → high. Steps
  // 150…650 of the reference sequential ramp; dark mode reverses it so low
  // values recede toward the dark surface.
  sequential: readonly string[]
}

// Categorical slots of the reference data-viz palette, checked with the
// dataviz skill's validate_palette.js (ALL CHECKS PASS in both modes):
// - light on #ffffff: adjacent CVD ΔE 9.1, normal-vision ΔE 19.6; slots 3–5
//   sit below 3:1 contrast, so legends name every series in text.
// - dark on #0f172a (slate-900): CVD ΔE 8.4, normal-vision ΔE 19.3, all >= 3:1.
export const CHART_PALETTES: Record<ColorScheme, ChartPalette> = {
  light: {
    series: ['#2a78d6', '#eb6834'],
    trunks: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'],
    other: '#c3c2b7',
    ink: { tick: '#898781', grid: '#e1e0d9', baseline: '#c3c2b7' },
    surface: '#ffffff',
    sequential: ['#b7d3f6', '#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
  },
  dark: {
    series: ['#3987e5', '#d95926'],
    trunks: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181'],
    other: '#64748b',
    ink: { tick: '#898781', grid: '#1e293b', baseline: '#334155' },
    surface: '#0f172a',
    sequential: ['#104281', '#1c5cab', '#2a78d6', '#5598e7', '#86b6ef', '#b7d3f6'],
  },
}

// Thin bars: capped at 24px, the rest of the band stays air.
export const MAX_BAR_SIZE = 24

export function useChartPalette(): ChartPalette {
  return CHART_PALETTES[useColorScheme()]
}
