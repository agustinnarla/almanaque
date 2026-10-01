import { describe, expect, it } from 'vitest'
import { FULL_CATALOG, TEST_CATALOG } from '../../test/catalog'
import type { CampaignCatalogEntry } from '../../types/api'
import {
  catalogBounds,
  crossPartner,
  defaultCompareValues,
  defaultCrossValues,
  defaultRangeValues,
  defaultWeekValues,
} from '../catalog'

function single(
  campaign: string,
  dates: string[],
  segment = 'Galicia Empresas',
): CampaignCatalogEntry {
  return {
    campaign,
    segment,
    first_day: dates[0],
    last_day: dates[dates.length - 1],
    days: dates.length,
    total_calls: 100,
    dates,
  }
}

describe('defaults desde el catálogo', () => {
  it('deriva los valores iniciales de los 4 modos con el catálogo real', () => {
    expect(defaultRangeValues(TEST_CATALOG, 50)).toEqual({
      campaign: '35',
      from: '2026-09-01',
      to: '2026-09-15',
      minCalls: 50,
    })
    expect(defaultCompareValues(TEST_CATALOG, 50)).toEqual({
      campaign: '35',
      dateA: '2026-09-14',
      dateB: '2026-09-15',
      minCalls: 50,
    })
    expect(defaultCrossValues(TEST_CATALOG, 50)).toEqual({
      campaignA: '35',
      campaignB: '38',
      minCalls: 50,
      from: '2026-09-01',
      to: '2026-09-15',
    })
    expect(defaultWeekValues(TEST_CATALOG, 100)).toEqual({
      campaign: '35',
      from: '2026-09-07',
      to: '2026-09-13',
      minCalls: 100,
    })
  })

  it('con una sola campaña compara la campaña consigo misma', () => {
    const catalog = [single('91', ['2026-09-01', '2026-09-02'])]
    expect(defaultCrossValues(catalog, 100)).toMatchObject({
      campaignA: '91',
      campaignB: '91',
      minCalls: 100,
    })
  })

  it('con un solo día compara el día consigo mismo', () => {
    const catalog = [single('92', ['2026-10-01'])]
    expect(defaultCompareValues(catalog, 50)).toMatchObject({
      dateA: '2026-10-01',
      dateB: '2026-10-01',
    })
  })

  it('el rango global va del primer día al último de todas las campañas', () => {
    const catalog = [
      single('35', ['2026-09-03', '2026-09-10']),
      single('38', ['2026-09-01', '2026-09-04']),
      single('91', ['2026-09-08', '2026-10-02']),
    ]
    expect(catalogBounds(catalog)).toEqual({ from: '2026-09-01', to: '2026-10-02' })
    expect(catalogBounds([])).toEqual({ from: '', to: '' })
  })

  it('el par de comparación siempre queda dentro del segmento', () => {
    expect(crossPartner(FULL_CATALOG, '91')).toBe('92')
    expect(crossPartner(FULL_CATALOG, '35', '91')).toBe('38')
    expect(crossPartner(FULL_CATALOG, '92', '91')).toBe('91')
    const lonely = [...FULL_CATALOG, single('77', ['2026-09-01'], 'Sin segmento')]
    expect(crossPartner(lonely, '77')).toBe('77')
    expect(defaultCrossValues(FULL_CATALOG, 50)).toMatchObject({
      campaignA: '35',
      campaignB: '38',
    })
  })
})
