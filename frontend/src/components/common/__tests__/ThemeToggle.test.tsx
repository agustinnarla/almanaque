import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { setThemePreference } from '../../../lib/theme'
import { ThemeToggle } from '../ThemeToggle'

describe('ThemeToggle', () => {
  afterEach(() => {
    act(() => setThemePreference('system'))
    window.localStorage.clear()
  })

  it('marca la opción elegida y aplica el tema', async () => {
    render(<ThemeToggle />)
    const [system, light, dark] = screen.getAllByRole('button')
    expect(system).toHaveAttribute('aria-pressed', 'true')

    await userEvent.click(dark)
    expect(dark).toHaveAttribute('aria-pressed', 'true')
    expect(system).toHaveAttribute('aria-pressed', 'false')
    expect(document.documentElement.dataset.theme).toBe('dark')

    await userEvent.click(light)
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
