import { Search } from 'lucide-react'
import { useState } from 'react'
import type { RangeValues } from './FilterRangeBar'
import { campaignDates } from '../../lib/catalog'
import { buildWeekOptions, defaultWeek, findWeekByStart } from '../../lib/weeks'
import type { CampaignCatalogEntry } from '../../types/api'
import { CampaignSelect } from './CampaignSelect'
import { MinCallsSelect } from './MinCallsSelect'

export interface WeekFilterValues {
  campaign: string
  weekStart: string
  minCalls: number
}

interface FilterWeekBarProps {
  initial: WeekFilterValues
  catalog: CampaignCatalogEntry[]
  onApply: (values: RangeValues) => void
}

export function FilterWeekBar({ initial, catalog, onApply }: FilterWeekBarProps) {
  const [campaign, setCampaign] = useState(initial.campaign)
  const [weekStart, setWeekStart] = useState(initial.weekStart)
  const [minCalls, setMinCalls] = useState(initial.minCalls)

  const weeks = buildWeekOptions(campaignDates(catalog, campaign))
  const week = findWeekByStart(weeks, weekStart) ?? defaultWeek(weeks)

  const changeCampaign = (next: string) => {
    setCampaign(next)
    const nextWeeks = buildWeekOptions(campaignDates(catalog, next))
    if (!findWeekByStart(nextWeeks, weekStart)) {
      setWeekStart(defaultWeek(nextWeeks)?.start ?? '')
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

  return (
    <form
      data-testid="filter-week-bar"
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-end print:hidden"
      onSubmit={(event) => {
        event.preventDefault()
        if (week) {
          onApply({ campaign, from: week.start, to: week.end, minCalls })
        }
      }}
    >
      <CampaignSelect
        label="Campaña"
        value={campaign}
        catalog={catalog}
        onChange={changeCampaign}
        className={inputClass}
      />
      <label className="flex min-w-[9rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
        Semana
        <select
          value={week?.start ?? ''}
          onChange={(event) => setWeekStart(event.target.value)}
          className={inputClass}
          required
        >
          {weeks.map((option) => (
            <option key={option.start} value={option.start}>
              {option.label}
              {option.partial ? ' · parcial' : ''}
            </option>
          ))}
        </select>
      </label>
      {week && (
        <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {week.start} → {week.end} · {week.dataDays} días con datos
          {week.partial && (
            <span
              data-testid="filter-week-partial"
              className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
            >
              Parcial
            </span>
          )}
        </p>
      )}
      <MinCallsSelect
        value={minCalls}
        onChange={setMinCalls}
        className={inputClass}
      />
      <button
        type="submit"
        data-testid="filter-week-submit"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      >
        <Search className="h-4 w-4" aria-hidden />
        Analizar
      </button>
    </form>
  )
}
