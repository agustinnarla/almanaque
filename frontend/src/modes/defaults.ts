import type { FilterValues } from '../components/Filters/FilterBar'
import type { CrossCampaignValues } from '../components/Filters/FilterCrossCampaignBar'
import type { RangeValues } from '../components/Filters/FilterRangeBar'
import { DEFAULT_WEEK } from '../lib/weeks'

export const DEFAULT_MIN_CALLS = 50
export const RANKING_LIMIT = 5

export const CROSS_START_DATE = '2026-09-01'
export const CROSS_END_DATE = '2026-09-15'

export const DEFAULT_FILTERS: FilterValues = {
  campaign: '35',
  dateA: '2026-09-01',
  dateB: '2026-09-02',
  minCalls: 50,
}

export const DEFAULT_RANGE: RangeValues = {
  campaign: '35',
  from: '2026-09-01',
  to: '2026-09-15',
}

export const DEFAULT_CROSS: CrossCampaignValues = {
  campaignA: '35',
  campaignB: '38',
  minCalls: 50,
}

export const DEFAULT_WEEK_RANGE: RangeValues = {
  campaign: '35',
  from: DEFAULT_WEEK.start,
  to: DEFAULT_WEEK.end,
}
