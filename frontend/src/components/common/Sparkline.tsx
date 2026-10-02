import { useChartPalette } from '../../lib/chartPalette'

interface SparklineProps {
  // One value per day; null = no rate that day (gap in the line).
  values: (number | null)[]
  label: string
  width?: number
  height?: number
}

const PAD = 4

// Spec 059: tiny trend for a stat tile — the line in the de-emphasis ink, the
// latest point in the series accent with a surface ring (dataviz stat tile).
export function Sparkline({ values, label, width = 160, height = 36 }: SparklineProps) {
  const palette = useChartPalette()
  const present = values.filter((value): value is number => value != null)
  if (present.length < 2) return null

  const min = Math.min(...present)
  const max = Math.max(...present)
  const x = (index: number) => PAD + (index * (width - 2 * PAD)) / Math.max(values.length - 1, 1)
  const y = (value: number) =>
    max === min ? height / 2 : PAD + ((max - value) * (height - 2 * PAD)) / (max - min)

  // Split into segments at nulls, so a day without a rate leaves a gap.
  const segments: string[] = []
  let current: string[] = []
  values.forEach((value, index) => {
    if (value == null) {
      if (current.length > 1) segments.push(current.join(' '))
      current = []
      return
    }
    current.push(`${x(index).toFixed(1)},${y(value).toFixed(1)}`)
  })
  if (current.length > 1) segments.push(current.join(' '))

  const lastIndex = values.findLastIndex((value) => value != null)
  const last = values[lastIndex] as number

  return (
    <svg
      data-testid="sparkline"
      role="img"
      aria-label={label}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="block max-w-full"
    >
      {segments.map((points) => (
        <polyline
          key={points}
          data-testid="sparkline-segment"
          points={points}
          fill="none"
          stroke={palette.ink.tick}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      <circle
        data-testid="sparkline-last"
        cx={x(lastIndex)}
        cy={y(last)}
        r={3}
        fill={palette.series[0]}
        stroke={palette.surface}
        strokeWidth={2}
      />
    </svg>
  )
}
