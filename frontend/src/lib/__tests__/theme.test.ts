import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  initTheme,
  resolveScheme,
  setThemePreference,
  useColorScheme,
  useThemePreference,
} from '../theme'

function mockSystemDark(dark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: dark,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  )
}

describe('theme', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    window.localStorage.clear()
    act(() => setThemePreference('system'))
    window.localStorage.clear()
  })

  it('sin preferencia guardada sigue al sistema y lo escribe en data-theme', () => {
    mockSystemDark(true)
    initTheme()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(resolveScheme('system')).toBe('dark')
    expect(resolveScheme('light')).toBe('light')
  })

  it('aplica y guarda la preferencia elegida', () => {
    mockSystemDark(false)
    const { result } = renderHook(() => ({
      preference: useThemePreference(),
      scheme: useColorScheme(),
    }))

    act(() => setThemePreference('dark'))

    expect(result.current).toEqual({ preference: 'dark', scheme: 'dark' })
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem('theme')).toBe('dark')

    initTheme()
    expect(result.current.preference).toBe('dark')
  })

  it('si el almacenamiento falla, el tema se aplica igual', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(() => act(() => setThemePreference('dark'))).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(() => initTheme()).not.toThrow()
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
