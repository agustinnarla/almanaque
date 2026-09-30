import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { DiagnosticEvent } from '../../../types/api'
import { DiagnosticsFeed } from '../DiagnosticsFeed'

const positive: DiagnosticEvent[] = [
  {
    severity: 'SUCCESS',
    type: 'RELIABLE_TRUNK',
    entity: 'GW39',
    message: 'Troncal sano.',
  },
]

describe('DiagnosticsFeed', () => {
  it('muestra titulos por defecto sin props opcionales', () => {
    render(
      <DiagnosticsFeed rootCauses={[]} positiveDrivers={positive} />,
    )
    expect(screen.getByText('Factores de mejora')).toBeInTheDocument()
    expect(
      screen.getByText('Señales positivas o recuperaciones detectadas'),
    ).toBeInTheDocument()
    expect(screen.getByText('Causas negativas')).toBeInTheDocument()
  })

  it('permite titulo dinamico para el modo rango', () => {
    render(
      <DiagnosticsFeed
        rootCauses={[]}
        positiveDrivers={positive}
        positiveTitle="Puntos destacados"
        positiveDescription="Fortalezas y señales positivas del período"
      />,
    )
    expect(screen.getByText('Puntos destacados')).toBeInTheDocument()
    expect(
      screen.getByText('Fortalezas y señales positivas del período'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Factores de mejora')).not.toBeInTheDocument()
  })

  it('usa h3 en las columnas para no competir con el título de la sección', () => {
    render(
      <DiagnosticsFeed rootCauses={[]} positiveDrivers={positive} />,
    )
    expect(
      screen.getByRole('heading', { level: 3, name: 'Causas negativas' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Factores de mejora' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})
