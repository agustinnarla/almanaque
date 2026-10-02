import { GitCompare } from 'lucide-react'
import { useState } from 'react'
import { campaignDates } from '../../lib/catalog'
import { buildWeekOptions, defaultWeekPair, findWeekByStart, type WeekOption } from '../../lib/weeks'
import type { CampaignCatalogEntry } from '../../types/api'
import { CampaignSelect } from './CampaignSelect'
import { MinCallsSelect } from './MinCallsSelect'

export interface WeeksCompareValues {
  campaign: string
  weekA: WeekOption
  weekB: WeekOption
  minCalls: number
}

interface FilterWeeksCompareBarProps {
  initial: WeeksCompareValues
  catalog: CampaignCatalogEntry[]
  onApply: (values: WeeksCompareValues) => void
}

export function FilterWeeksCompareBar({ initial, catalog, onApply }: FilterWeeksCompareBarProps) {
  const [campaign, setCampaign] = useState(initial.campaign)
  const [startA, setStartA] = useState(initial.weekA.start)
  const [startB, setStartB] = useState(initial.weekB.start)
  const [minCalls, setMinCalls] = useState(initial.minCalls)

  const weeks = buildWeekOptions(campaignDates(catalog, campaign))
  const weekA = findWeekByStart(weeks, startA)
  const weekB = findWeekByStart(weeks, startB)
  const sameWeek = weekA != null && weekB != null && weekA.start === weekB.start

  const changeCampaign = (next: string) => {
    setCampaign(next)
    const nextWeeks = buildWeekOptions(campaignDates(catalog, next))
    const pair = defaultWeekPair(nextWeeks)
    if (!findWeekByStart(nextWeeks, startA)) setStartA(pair?.a.start ?? '')
    if (!findWeekByStart(nextWeeks, startB)) setStartB(pair?.b.start ?? '')
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'

  const weekSelect = (label: string, value: string, onChange: (start: string) => void, testId: string) => (
    <label className="flex min-w-[11rem] flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
      {label}
      <select
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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
  )

  return (
    <form
      data-testid="filter-weeks-compare-bar"
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-end print:hidden"
      onSubmit={(event) => {
        event.preventDefault()
        if (weekA && weekB && !sameWeek) {
          onApply({ campaign, weekA, weekB, minCalls })
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
      {weekSelect('Semana A', weekA?.start ?? '', setStartA, 'filter-week-a')}
      {weekSelect('Semana B', weekB?.start ?? '', setStartB, 'filter-week-b')}
      <MinCallsSelect value={minCalls} onChange={setMinCalls} className={inputClass} />
      <button
        type="submit"
        data-testid="filter-weeks-submit"
        disabled={!weekA || !weekB || sameWeek}
        title={sameWeek ? 'Elegí dos semanas distintas' : undefined}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GitCompare className="h-4 w-4" aria-hidden />
        Comparar
      </button>
      {sameWeek && (
        <p data-testid="filter-weeks-same" className="w-full text-xs text-amber-700">
          Elegí dos semanas distintas para comparar.
        </p>
      )}
    </form>
  )
}
