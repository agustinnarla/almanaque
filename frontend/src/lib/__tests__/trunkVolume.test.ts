import { describe, expect, it } from 'vitest'
import type { TrunkVolumeRow } from '../../types/api'
import { CHART_PALETTES } from '../chartPalette'
import { buildTrunkVolume, trunkColor, trunkVolumeTable } from '../trunkVolume'

const row = (fecha: string, device: string, total_calls: number): TrunkVolumeRow => ({
  fecha,
  device,
  total_calls,
})

describe('buildTrunkVolume', () => {
  it('deja las N troncales con más volumen y suma el resto en «Otras»', () => {
    const rows = [
      row('2026-09-01', 'A', 100),
      row('2026-09-01', 'B', 50),
      row('2026-09-01', 'C', 10),
      row('2026-09-02', 'C', 5),
      row('2026-09-02', 'D', 35),
    ]
    const { trunks, days } = buildTrunkVolume(rows, 2)

    expect(trunks.map((t) => [t.name, t.total])).toEqual([
      ['A', 100],
      ['B', 50],
      ['Otras', 50],
    ])
    expect(trunks[0].share).toBe(0.5)
    expect(days).toEqual([
      { fecha: '2026-09-01', label: '01/09', total: 160, A: 100, B: 50, Otras: 10 },
      { fecha: '2026-09-02', label: '02/09', total: 40, A: 0, B: 0, Otras: 40 },
    ])
  })

  it('sin cola no agrega «Otras» y ordena los días', () => {
    const { trunks, days } = buildTrunkVolume([
      row('2026-09-02', 'IPLAN', 900),
      row('2026-09-01', 'GW20', 300),
    ])
    expect(trunks.map((t) => t.name)).toEqual(['IPLAN', 'GW20'])
    expect(days.map((d) => d.fecha)).toEqual(['2026-09-01', '2026-09-02'])
  })

  it('sin filas devuelve listas vacías', () => {
    expect(buildTrunkVolume([])).toEqual({ trunks: [], days: [] })
  })

  it('asigna los slots en orden y gris a «Otras», según la paleta del modo', () => {
    const { light, dark } = CHART_PALETTES
    expect(trunkColor({ name: 'IPLAN', total: 1, share: 1 }, 0, light)).toBe(light.trunks[0])
    expect(trunkColor({ name: 'Otras', total: 1, share: 1 }, 5, light)).toBe(light.other)
    expect(trunkColor({ name: 'IPLAN', total: 1, share: 1 }, 0, dark)).toBe(dark.trunks[0])
  })

  it('arma la tabla pivote día × troncal con el total', () => {
    const volume = buildTrunkVolume(
      [row('2026-09-01', 'A', 100), row('2026-09-01', 'B', 50), row('2026-09-02', 'C', 30)],
      2,
    )
    expect(trunkVolumeTable(volume)).toEqual({
      headers: ['Fecha', 'A', 'B', 'Otras', 'Total'],
      rows: [
        ['2026-09-01', 100, 50, 0, 150],
        ['2026-09-02', 0, 0, 30, 30],
      ],
    })
  })
})
