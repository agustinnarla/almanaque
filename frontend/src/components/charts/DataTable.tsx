import type { CsvCell } from '../../lib/csv'
import type { CsvTable } from '../../lib/exporters'

function formatCell(cell: CsvCell): string {
  if (cell == null || cell === '') return '—'
  if (typeof cell === 'number') {
    return cell.toLocaleString('es-AR', { maximumFractionDigits: 2 })
  }
  return String(cell)
}

interface DataTableProps {
  table: CsvTable
  caption: string
}

// Table view of a chart: the same rows the CSV export downloads.
export function DataTable({ table, caption }: DataTableProps) {
  return (
    <div data-testid="chart-table" className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500">
            {table.headers.map((header, index) => (
              <th
                key={`${index}-${header}`}
                scope="col"
                className={`whitespace-nowrap px-2 py-2 font-semibold ${index > 0 ? 'text-right' : ''}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, index) => (
                <td
                  key={index}
                  className={`whitespace-nowrap px-2 py-1.5 ${
                    index > 0 ? 'text-right tabular-nums text-slate-700' : 'text-slate-900'
                  }`}
                >
                  {formatCell(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
