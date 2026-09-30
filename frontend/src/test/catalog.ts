import type { CampaignCatalogEntry } from '../types/api'

// Real coverage of the reference data: 11 business days, 2026-09-01 → 2026-09-15.
export const SEPTEMBER_DATES = [
  '2026-09-01',
  '2026-09-02',
  '2026-09-03',
  '2026-09-04',
  '2026-09-07',
  '2026-09-08',
  '2026-09-09',
  '2026-09-10',
  '2026-09-11',
  '2026-09-14',
  '2026-09-15',
]

function entry(campaign: string, totalCalls: number): CampaignCatalogEntry {
  return {
    campaign,
    first_day: SEPTEMBER_DATES[0],
    last_day: SEPTEMBER_DATES[SEPTEMBER_DATES.length - 1],
    days: SEPTEMBER_DATES.length,
    total_calls: totalCalls,
    dates: SEPTEMBER_DATES,
  }
}

export const TEST_CATALOG: CampaignCatalogEntry[] = [
  entry('35', 35413),
  entry('38', 263198),
]
