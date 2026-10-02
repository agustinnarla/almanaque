// Categorical slots of the reference data-viz palette, validated with the
// dataviz skill's validate_palette.js on the white card surface (#ffffff):
// CVD ΔE 24.7, normal-vision ΔE 33.6, contrast >= 3:1. Slot order is the
// colorblind-safety mechanism: series A (or a single series) is always slot 1.
export const SERIES_COLORS = ['#2a78d6', '#eb6834'] as const

// First five slots of the same palette, same order, for stacked trunk volume.
// Validated on #ffffff: adjacent CVD ΔE 9.1, normal-vision ΔE 19.6. Slots 3–5
// sit below 3:1 contrast, so the legend names every trunk in text.
export const TRUNK_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4'] as const
// Neutral gray for the folded tail ("Otras"), never a generated hue.
export const OTHER_TRUNK_COLOR = '#c3c2b7'

export const CHART_INK = {
  tick: '#898781',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
} as const
