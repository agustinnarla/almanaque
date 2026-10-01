// Categorical slots of the reference data-viz palette, validated with the
// dataviz skill's validate_palette.js on the white card surface (#ffffff):
// CVD ΔE 24.7, normal-vision ΔE 33.6, contrast >= 3:1. Slot order is the
// colorblind-safety mechanism: series A (or a single series) is always slot 1.
export const SERIES_COLORS = ['#2a78d6', '#eb6834'] as const

export const CHART_INK = {
  tick: '#898781',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
} as const
