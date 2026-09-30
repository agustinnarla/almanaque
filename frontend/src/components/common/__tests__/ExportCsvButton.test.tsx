import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadCsv } from '../../../lib/csv'
import { ExportCsvButton } from '../ExportCsvButton'

vi.mock('../../../lib/csv', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/csv')>()
  return { ...actual, downloadCsv: vi.fn() }
})

const downloadMock = vi.mocked(downloadCsv)

describe('ExportCsvButton', () => {
  beforeEach(() => {
    downloadMock.mockClear()
  })

  it('descarga el CSV con nombre, encabezados y filas', async () => {
    render(
      <ExportCsvButton
        filename="rango_35_2026-09-01_2026-09-15_kpis.csv"
        headers={['Métrica', 'Valor']}
        rows={[['Total de llamadas', 100]]}
      />,
    )
    await userEvent.click(screen.getByTestId('export-csv'))
    expect(downloadMock).toHaveBeenCalledWith(
      'rango_35_2026-09-01_2026-09-15_kpis.csv',
      ['Métrica', 'Valor'],
      [['Total de llamadas', 100]],
    )
  })

  it('no se imprime (oclase print:hidden)', () => {
    render(
      <ExportCsvButton filename="a.csv" headers={['a']} rows={[['1']]} />,
    )
    expect(screen.getByTestId('export-csv').className).toContain('print:hidden')
  })

  it('muestra CSV por defecto', () => {
    render(
      <ExportCsvButton filename="a.csv" headers={['a']} rows={[['1']]} />,
    )
    expect(screen.getByTestId('export-csv')).toHaveTextContent('CSV')
  })

  it('permite un label personalizado', () => {
    render(
      <ExportCsvButton filename="a.csv" headers={['a']} rows={[['1']]} label="Bases" />,
    )
    expect(screen.getByTestId('export-csv')).toHaveTextContent('Bases')
    expect(screen.getByTestId('export-csv')).not.toHaveTextContent('CSV')
  })
})
