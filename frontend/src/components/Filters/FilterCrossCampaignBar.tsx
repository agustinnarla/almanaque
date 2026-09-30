import { Search } from 'lucide-react'
import { useState } from 'react'
import { catalogBounds } from '../../lib/catalog'
import type { CampaignCatalogEntry } from '../../types/api'
import { CampaignSelect } from './CampaignSelect'

export interface CrossCampaignValues {
  campaignA: string
  campaignB: string
  minCalls: number
  from: string
  to: string
}

interface FilterCrossCampaignBarProps {
  initial: CrossCampaignValues
  catalog: CampaignCatalogEntry[]
  onCompare: (values: CrossCampaignValues) => void
}

const MIN_CALLS_OPTIONS = [50, 100, 200]

export function FilterCrossCampaignBar({
  initial,
  catalog,
  onCompare,
}: FilterCrossCampaignBarProps) {
  const [campaignA, setCampaignA] = useState(initial.campaignA)
  const [campaignB, setCampaignB] = useState(initial.campaignB)
  const [minCalls, setMinCalls] = useState(initial.minCalls)
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)

  const bounds = catalogBounds(catalog)

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

  return (
    <form
      data-testid="filter-cross-campaign"
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end print:hidden"
      onSubmit={(event) => {
        event.preventDefault()
        onCompare({ campaignA, campaignB, minCalls, from, to })
      }}
    >
      <CampaignSelect
        label="Campaña A"
        value={campaignA}
        catalog={catalog}
        onChange={setCampaignA}
        className={inputClass}
      />
      <CampaignSelect
        label="Campaña B"
        value={campaignB}
        catalog={catalog}
        onChange={setCampaignB}
        className={inputClass}
      />
      <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Desde
        <input
          type="date"
          value={from}
          min={bounds.from}
          max={bounds.to}
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
          max={bounds.to}
          onChange={(event) => setTo(event.target.value)}
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
        data-testid="filter-cross-submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <Search className="h-4 w-4" aria-hidden />
        Comparar
      </button>
    </form>
  )
}
