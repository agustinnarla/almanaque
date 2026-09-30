import { Download } from 'lucide-react'
import { downloadCsv, type CsvCell } from '../../lib/csv'

interface ExportCsvButtonProps {
  filename: string
  headers: string[]
  rows: CsvCell[][]
  label?: string
}

export function ExportCsvButton({ filename, headers, rows, label = 'CSV' }: ExportCsvButtonProps) {
  return (
    <button
      type="button"
      data-testid="export-csv"
      onClick={() => downloadCsv(filename, headers, rows)}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 print:hidden"
    >
      <Download className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  )
}
