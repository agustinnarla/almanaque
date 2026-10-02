import { Monitor, Moon, Sun } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  setThemePreference,
  useThemePreference,
  type ThemePreference,
} from '../../lib/theme'

const OPTIONS: { value: ThemePreference; label: string; icon: LucideIcon }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
]

export function ThemeToggle() {
  const preference = useThemePreference()

  return (
    <div
      role="group"
      aria-label="Tema"
      data-testid="theme-toggle"
      className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-white p-0.5 print:hidden"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            title={label}
            onClick={() => setThemePreference(value)}
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
              active ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
            <span className="sr-only sm:hidden">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
