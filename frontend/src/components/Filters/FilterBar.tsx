import { Search } from 'lucide-react'
import { useState } from 'react'

export interface FilterValues {
  campaign: string
  dateA: string
  dateB: string
  minCalls: number
}

interface FilterBarProps {
  initial: FilterValues
  onCompare: (values: FilterValues) => void
}

const MIN_CALLS_OPTIONS = [50, 100, 200]

export function FilterBar({ initial, onCompare }: FilterBarProps) {
  const [campaign, setCampaign] = useState(initial.campaign)
  const [dateA, setDateA] = useState(initial.dateA)
  const [dateB, setDateB] = useState(initial.dateB)
  const [minCalls, setMinCalls] = useState(initial.minCalls)

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end print:hidden"
      onSubmit={(event) => {
        event.preventDefault()
        onCompare({ campaign, dateA, dateB, minCalls })
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
        Fecha A
        <input
          type="date"
          value={dateA}
          onChange={(event) => setDateA(event.target.value)}
          className={inputClass}
          required
        />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Fecha B
        <input
          type="date"
          value={dateB}
          onChange={(event) => setDateB(event.target.value)}
          className={inputClass}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
        Mín. llamadas
        <select
          value={minCalls}
          onChange={(event) => setMinCalls(Number(event.target.value))}
          className={inputClass}
        >
          {MIN_CALLS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <Search className="h-4 w-4" aria-hidden />
        Comparar
      </button>
    </form>
  )
}
