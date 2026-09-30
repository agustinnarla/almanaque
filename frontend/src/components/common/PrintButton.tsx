import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      type="button"
      data-testid="print-report"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 print:hidden"
    >
      <Printer className="h-3.5 w-3.5" aria-hidden />
      Imprimir / PDF
    </button>
  )
}
