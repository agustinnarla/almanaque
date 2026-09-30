import { Search } from 'lucide-react'
import { useState } from 'react'

export interface RangeValues {
  campaign: string
  from: string
  to: string
}

interface FilterRangeBarProps {
  initial: RangeValues
  onApply: (values: RangeValues) => void
}

export function FilterRangeBar({ initial, onApply }: FilterRangeBarProps) {
  const [campaign, setCampaign] = useState(initial.campaign)
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

  return (
    <form
      data-testid="filter-range-bar"
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end print:hidden"
      onSubmit={(event) => {
        event.preventDefault()
        onApply({ campaign, from, to })
      }}
    >
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Campaña
        <input
          type="text"
          value={campaign}
          onChange={(event) => setCampaign(event.target.value)}
          className={inputClass}
          required
        />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Desde
        <input
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          className={inputClass}
          required
        />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Hasta
        <input
          type="date"
          value={to}
          min={from}
          onChange={(event) => setTo(event.target.value)}
          className={inputClass}
          required
        />
      </label>
      <button
        type="submit"
        data-testid="filter-range-submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <Search className="h-4 w-4" aria-hidden />
        Analizar
      </button>
    </form>
  )
}
