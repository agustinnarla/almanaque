import { useState, type ReactNode } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import type { CsvTable } from '../../lib/exporters'
import { DataTable } from './DataTable'

interface ChartCardProps {
  testId: string
  title: string
  subtitle: ReactNode
  table: CsvTable
  headerAction?: ReactNode
  children: ReactNode
}

// Every chart has a table twin: hover enhances, it never gates the values.
export function ChartCard({ testId, title, subtitle, table, headerAction, children }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false)

  return (
    <div
      data-testid={testId}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="mb-1 text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="chart-table-toggle"
            aria-pressed={showTable}
            onClick={() => setShowTable((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 print:hidden"
          >
            {showTable ? (
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Table2 className="h-3.5 w-3.5" aria-hidden />
            )}
            {showTable ? 'Ver gráfico' : 'Ver tabla'}
          </button>
          {headerAction}
        </div>
      </div>
      {showTable ? <DataTable table={table} caption={title} /> : children}
    </div>
  )
}
