import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Methodology } from '../../../types/api'
import {
  HEALTH_ACCEPTABLE_MIN,
  HEALTH_HEALTHY_MIN,
  healthScoreLabel,
} from '../../common/healthStyle'
import { MethodologyButton } from '../MethodologyButton'

// Deliberately not the production values: the text must follow the data.
const METHODOLOGY: Methodology = {
  segments: { '35': 'Galicia Empresas', '38': 'Galicia Empresas', '91': 'Galicia Individuos' },
  health: { busy_weight: 0.25, congestion_weight: 2 },
  diagnostics: {
    base_drop_warning: -0.007,
    base_drop_critical: -0.013,
    base_improvement_info: 0.006,
    base_improvement_success: 0.012,
    mix_share: 0.05,
    congestion_delta: 0.02,
    congestion_critical: 0.05,
    congestion_recovery_info: -0.02,
    congestion_recovery_success: -0.04,
    root_causes_limit: 4,
  },
  range_diagnostics: { congestion: 0.05, busy: 0.35, peak: 0.06 },
  recommendations: { volume_drop_pct: -12, amd_ratio: 3, min_volume_share: 0.1, limit: 5 },
  patterns: { relative_factor: 0.7, min_calls: 80 },
  routing: { concentration_share: 0.8, active_share: 0.1, min_day_calls: 50, amd_note_share: 0.4 },
}

function mockApi(ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(METHODOLOGY),
    }),
  )
}

async function openModal() {
  render(<MethodologyButton />)
  await userEvent.click(screen.getByTestId('methodology-button'))
  return screen.getByRole('dialog', { name: '¿Cómo se calcula?' })
}

async function showTab(name: string) {
  await userEvent.click(screen.getByRole('tab', { name }))
  return screen.getByRole('tabpanel')
}

describe('MethodologyModal', () => {
  beforeEach(() => mockApi())
  afterEach(() => vi.unstubAllGlobals())

  it('abre con el botón, toma el foco y se cierra con Esc devolviendo el foco', async () => {
    const dialog = await openModal()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveFocus()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('methodology-button')).toHaveFocus()
  })

  it('se cierra con «Cerrar» y con un clic afuera, no con un clic adentro', async () => {
    await openModal()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('methodology-button'))
    await userEvent.click(screen.getByRole('dialog'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('methodology-backdrop'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('muestra las 8 pestañas y los segmentos del backend', async () => {
    await openModal()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Métricas', 'Health score', 'Diagnóstico', 'Destacados', 'Patrones', 'Recomendaciones',
      'Ruteo y volumen', 'Datos',
    ])
    await waitFor(() =>
      expect(screen.getByRole('tabpanel')).toHaveTextContent(
        'Galicia Empresas: 35, 38 · Galicia Individuos: 91',
      ),
    )
  })

  it('el health score usa los pesos del endpoint y las etiquetas de las constantes', async () => {
    await openModal()
    const panel = await showTab('Health score')
    await waitFor(() =>
      expect(panel).toHaveTextContent('Health = (AA − ocupado × 0,25 − congestión × 2) × 100'),
    )
    // (0,06 − 0,20 × 0,25 − 0,02 × 2) × 100 = −3
    expect(panel).toHaveTextContent('= -3 → «Aceptable»')
    expect(panel).toHaveTextContent(`desde ${HEALTH_ACCEPTABLE_MIN}: «Aceptable»`)
  })

  it('cada regla muestra el umbral vigente', async () => {
    await openModal()
    let panel = await showTab('Diagnóstico')
    await waitFor(() => expect(panel).toHaveTextContent('Su AA baja 0,7 pp o más: aviso · 1,3 pp o más: crítico.'))
    expect(panel).toHaveTextContent('Hasta 4, de la más grave')

    panel = await showTab('Destacados')
    expect(panel).toHaveTextContent('al menos el 1% de las llamadas del rango')
    expect(panel).toHaveTextContent('Menos del 50% de la mediana diaria del rango (solo con 3 días o más)')

    panel = await showTab('Patrones')
    expect(panel).toHaveTextContent('80 llamadas o más y su AA queda por debajo del 70%')

    panel = await showTab('Recomendaciones')
    expect(panel).toHaveTextContent('3 contestadores o más por cada agente')
    expect(panel).toHaveTextContent('cae 12% o más')

    panel = await showTab('Ruteo y volumen')
    expect(panel).toHaveTextContent('lleva el 80% o más del volumen')
    expect(panel).toHaveTextContent('apila las 5 troncales')

    panel = await showTab('Datos')
    expect(within(panel).getByText('--full')).toBeInTheDocument()
    expect(within(panel).getByText('Cobertura de días')).toBeInTheDocument()
    expect(panel).toHaveTextContent('días hábiles (lunes a viernes)')
    expect(panel).toHaveTextContent('un día hábil sin datos puede ser uno')
  })

  it('si el endpoint falla, avisa en las secciones que lo necesitan', async () => {
    mockApi(false)
    await openModal()
    const panel = await showTab('Patrones')
    await waitFor(() =>
      expect(within(panel).getByRole('alert')).toHaveTextContent(
        'No se pudieron cargar los umbrales del backend: Error de API: 500',
      ),
    )
    const highlights = await showTab('Destacados')
    expect(highlights).toHaveTextContent('al menos el 1%')
    expect(within(highlights).queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('healthScoreLabel', () => {
  it('corta en las constantes', () => {
    expect(healthScoreLabel(HEALTH_HEALTHY_MIN)).toBe('Saludable')
    expect(healthScoreLabel(HEALTH_HEALTHY_MIN - 0.01)).toBe('Aceptable')
    expect(healthScoreLabel(HEALTH_ACCEPTABLE_MIN)).toBe('Aceptable')
    expect(healthScoreLabel(HEALTH_ACCEPTABLE_MIN - 0.01)).toBe('Crítico')
    expect(healthScoreLabel(null)).toBe('Sin datos')
  })
})
