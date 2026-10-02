import { useSyncExternalStore } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ColorScheme = 'light' | 'dark'

const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

let preference: ThemePreference = 'system'
const listeners = new Set<() => void>()

function darkQuery(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : null
}

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Storage blocked (private mode, site data off): fall back to the system setting.
  }
  return 'system'
}

export function resolveScheme(pref: ThemePreference): ColorScheme {
  if (pref !== 'system') return pref
  return darkQuery()?.matches ? 'dark' : 'light'
}

// The resolved scheme always lands on <html data-theme>, so the dark CSS
// variables live in one block (index.css) instead of a media query + a copy.
function apply(): void {
  document.documentElement.dataset.theme = resolveScheme(preference)
  for (const listener of listeners) listener()
}

export function initTheme(): void {
  preference = readPreference()
  darkQuery()?.addEventListener('change', () => {
    if (preference === 'system') apply()
  })
  apply()
}

export function setThemePreference(next: ThemePreference): void {
  preference = next
  try {
    window.localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Not persisted; the choice still applies to this visit.
  }
  apply()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => preference)
}

export function useColorScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, () => resolveScheme(preference))
}
