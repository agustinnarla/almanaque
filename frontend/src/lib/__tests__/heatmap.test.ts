import { describe, expect, it } from 'vitest'
import type { HourDeviceRow } from '../../types/api'
import { buildHeatmap, cellKey, heatBin } from '../heatmap'

// Real cells of campaign 35, 01→30/09: [device, hour, calls, agents, answering machines].
const REAL: [string, number, number, number, number][] = [
  ['GW42', 10, 10, 3, 3], ['GW42', 11, 4, 2, 1],
  ['IPLAN', 9, 3922, 560, 1773], ['IPLAN', 10, 3441, 468, 1519], ['IPLAN', 11, 4575, 521, 2154],
  ['IPLAN', 12, 5771, 365, 3026], ['IPLAN', 13, 5926, 355, 3125], ['IPLAN', 14, 6828, 362, 3634],
  ['IPLAN', 15, 2753, 149, 1472], ['IPLAN', 16, 3643, 195, 1959], ['IPLAN', 17, 3896, 205, 2116],
  ['IPLAN2', 9, 22, 2, 6], ['IPLAN2', 10, 62, 8, 14], ['IPLAN2', 11, 109, 3, 23],
  ['IPLAN2', 12, 446, 15, 79], ['IPLAN2', 13, 470, 16, 96], ['IPLAN2', 14, 400, 10, 81],
  ['IPLAN2', 15, 34, 0, 12], ['IPLAN2', 16, 11, 0, 2], ['IPLAN2', 17, 1, 1, 0],
]
const rows: HourDeviceRow[] = REAL.map(([device, hora, total_calls, agent_answers, machine_answers]) => ({
  device,
  hora,
  total_calls,
  agent_answers,
  machine_answers,
}))

describe('buildHeatmap', () => {
  it('deja las troncales con el 1% o más, ordenadas por volumen, y cuenta las ocultas', () => {
    const heatmap = buildHeatmap(rows, 'aa')
    expect(heatmap.devices.map((d) => d.device)).toEqual(['IPLAN', 'IPLAN2'])
    expect(heatmap.hiddenDevices).toBe(1)
    expect(heatmap.hours).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17])
  })

  it('las celdas con menos de 50 llamadas no tienen color ni entran en la escala', () => {
    const heatmap = buildHeatmap(rows, 'aa')
    const small = [...heatmap.cells.values()].filter((cell) => cell.small)
    expect(small.map((cell) => `${cell.device} ${cell.hora}`)).toEqual([
      'IPLAN2 9', 'IPLAN2 15', 'IPLAN2 16', 'IPLAN2 17',
    ])
    // IPLAN2 at 17 h: 1 agent of 1 call (100%) must not stretch the scale.
    expect(heatmap.domain![0]).toBeCloseTo(10 / 400, 6)
    expect(heatmap.domain![1]).toBeCloseTo(560 / 3922, 6)
  })

  it('IPLAN a las 9: 14,3% de AA y 26,1% sobre atendibles', () => {
    expect(buildHeatmap(rows, 'aa').cells.get(cellKey('IPLAN', 9))!.value).toBeCloseTo(0.1428, 4)
    expect(buildHeatmap(rows, 'attendable').cells.get(cellKey('IPLAN', 9))!.value).toBeCloseTo(
      560 / (3922 - 1773),
      6,
    )
  })

  it('sin filas o sin denominador', () => {
    expect(buildHeatmap([], 'aa')).toMatchObject({ hours: [], devices: [], domain: null, hiddenDevices: 0 })
    const allMachines = buildHeatmap(
      [{ device: 'A', hora: 9, total_calls: 100, agent_answers: 0, machine_answers: 100 }],
      'attendable',
    )
    expect(allMachines.cells.get(cellKey('A', 9))!.value).toBeNull()
    expect(allMachines.domain).toBeNull()
  })
})

describe('heatBin', () => {
  it('reparte el dominio en 6 tramos y fija los extremos', () => {
    expect(heatBin(0.02, [0.02, 0.14])).toBe(0)
    expect(heatBin(0.14, [0.02, 0.14])).toBe(5)
    expect(heatBin(0.085, [0.02, 0.14])).toBe(3)
    expect(heatBin(0.5, [0.02, 0.14])).toBe(5)
    expect(heatBin(0.05, [0.05, 0.05])).toBe(5)
  })
})
