import { useCallback, useRef, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { MethodologyModal } from './MethodologyModal'

export function MethodologyButton() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => {
    setOpen(false)
    buttonRef.current?.focus()
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-testid="methodology-button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 print:hidden"
      >
        <BookOpen className="h-3.5 w-3.5" aria-hidden />
        ¿Cómo se calcula?
      </button>
      {open && <MethodologyModal onClose={close} />}
    </>
  )
}
