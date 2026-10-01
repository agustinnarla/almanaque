import type { FilterValues } from '../components/Filters/FilterBar'
import type { CrossCampaignValues } from '../components/Filters/FilterCrossCampaignBar'
import type { RangeValues } from '../components/Filters/FilterRangeBar'
import type { CampaignCatalogEntry } from '../types/api'
import { buildWeekOptions, defaultWeek } from './weeks'

// Every default below assumes a non-empty catalog: App only mounts the
// modes once at least one campaign is loaded.

export function campaignEntry(
  catalog: CampaignCatalogEntry[],
  campaign: string,
): CampaignCatalogEntry | null {
  return catalog.find((entry) => entry.campaign === campaign) ?? null
}

export function segmentOf(
  catalog: CampaignCatalogEntry[],
  campaign: string,
): string | null {
  return campaignEntry(catalog, campaign)?.segment ?? null
}

// Campaigns of the same business segment (including `campaign` itself).
export function sameSegment(
  catalog: CampaignCatalogEntry[],
  campaign: string,
): CampaignCatalogEntry[] {
  const segment = segmentOf(catalog, campaign)
  return catalog.filter((entry) => entry.segment === segment)
}

// Segments are never compared with each other: B is another campaign of A's
// segment, or A itself when the segment has a single campaign.
export function crossPartner(
  catalog: CampaignCatalogEntry[],
  campaignA: string,
  current?: string,
): string {
  const peers = sameSegment(catalog, campaignA)
  if (current && current !== campaignA && peers.some((entry) => entry.campaign === current)) {
    return current
  }
  return peers.find((entry) => entry.campaign !== campaignA)?.campaign ?? campaignA
}

export function campaignDates(
  catalog: CampaignCatalogEntry[],
  campaign: string,
): string[] {
  return campaignEntry(catalog, campaign)?.dates ?? []
}

export function catalogBounds(catalog: CampaignCatalogEntry[]): {
  from: string
  to: string
} {
  const firstDays = catalog.map((entry) => entry.first_day).sort()
  const lastDays = catalog.map((entry) => entry.last_day).sort()
  return { from: firstDays[0] ?? '', to: lastDays.at(-1) ?? '' }
}

export function defaultRangeValues(
  catalog: CampaignCatalogEntry[],
  minCalls: number,
): RangeValues {
  const first = catalog[0]
  return {
    campaign: first.campaign,
    from: first.first_day,
    to: first.last_day,
    minCalls,
  }
}

export function defaultCompareValues(
  catalog: CampaignCatalogEntry[],
  minCalls: number,
): FilterValues {
  const first = catalog[0]
  const dateB = first.dates.at(-1) ?? first.last_day
  const dateA = first.dates.at(-2) ?? dateB
  return { campaign: first.campaign, dateA, dateB, minCalls }
}

export function defaultCrossValues(
  catalog: CampaignCatalogEntry[],
  minCalls: number,
): CrossCampaignValues {
  const campaignA = catalog[0].campaign
  const campaignB = crossPartner(catalog, campaignA)
  const { from, to } = catalogBounds(catalog)
  return { campaignA, campaignB, minCalls, from, to }
}

export function defaultWeekValues(
  catalog: CampaignCatalogEntry[],
  minCalls: number,
): RangeValues {
  const first = catalog[0]
  const week = defaultWeek(buildWeekOptions(first.dates))
  return {
    campaign: first.campaign,
    from: week?.start ?? first.first_day,
    to: week?.end ?? first.last_day,
    minCalls,
  }
}
