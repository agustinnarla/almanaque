import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { GatewayComparison } from '../../../types/api'
import { formatDeltaPp } from '../../../lib/format'
import { gatewayStatus } from '../../../lib/gateways'
import { GatewaysTable } from '../GatewaysTable'

const saturatedImproved: GatewayComparison = {
  device: 'GW37',
  congestion_rate_a: 0.171,
  congestion_rate_b: 0.123,
  delta_congestion: -0.048,
}

const relieved: GatewayComparison = {
  device: 'GWX',
  congestion_rate_a: 0.03,
  congestion_rate_b: 0.01,
  delta_congestion: -0.02,
}

const normal: GatewayComparison = {
  device: 'GW20',
  congestion_rate_a: 0.04,
  congestion_rate_b: 0.045,
  delta_congestion: 0.005,
}

describe('gatewayStatus precedence', () => {
  it('Saturado tiene prioridad aunque haya mejorado', () => {
    expect(gatewayStatus(saturatedImproved)).toBe('Saturado')
  })

  it('Aliviado solo si B < 5% y delta ≤ -2 pp', () => {
    expect(gatewayStatus(relieved)).toBe('Aliviado')
  })

  it('Normal en el resto', () => {
    expect(gatewayStatus(normal)).toBe('Normal')
  })
})

describe('formatDeltaPp', () => {
  it('convierte fracción a pp con 2 decimales', () => {
    expect(formatDeltaPp(-0.048)).toBe('−4.80 pp')
    expect(formatDeltaPp(0.002)).toBe('+0.20 pp')
    expect(formatDeltaPp(null)).toBe('—')
  })
})

describe('GatewaysTable', () => {
  it('renderiza filas con estado Saturado prioritario', () => {
    render(<GatewaysTable rows={[saturatedImproved, relieved, normal]} />)
    const table = screen.getByTestId('gateways-table')
    expect(within(table).getAllByTestId('gateways-row')).toHaveLength(3)
    const statuses = within(table)
      .getAllByTestId('gateway-status')
      .map((el) => el.getAttribute('data-status'))
    expect(statuses).toEqual(['Saturado', 'Aliviado', 'Normal'])
    expect(table.className).toContain('min-w-[480px]')
    expect(table.parentElement?.className).toContain('overflow-x-auto')
  })

  it('muestra empty-state cuando rows es null o vacío', () => {
    const { unmount } = render(<GatewaysTable rows={null} />)
    expect(screen.getByTestId('gateways-empty')).toBeInTheDocument()
    unmount()
    render(<GatewaysTable rows={[]} />)
    expect(screen.getByTestId('gateways-empty')).toBeInTheDocument()
  })
})
