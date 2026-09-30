const MIN_CALLS_OPTIONS = [50, 100, 200]

interface MinCallsSelectProps {
  value: number
  onChange: (minCalls: number) => void
  className: string
}

export function MinCallsSelect({ value, onChange, className }: MinCallsSelectProps) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      Mín. llamadas
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={className}
      >
        {MIN_CALLS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
