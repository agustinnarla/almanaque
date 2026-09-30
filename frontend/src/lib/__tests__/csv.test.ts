import { describe, expect, it, vi } from 'vitest'
import { downloadCsv, toCsv } from '../csv'

describe('toCsv', () => {
  it('prepende BOM UTF-8 y termina con CRLF', () => {
    const out = toCsv(['a'], [['1']])
    expect(out.charCodeAt(0)).toBe(0xfeff)
    expect(out).toBe('﻿a\r\n1\r\n')
  })

  it('usa punto y coma como separador', () => {
    expect(toCsv(['a', 'b'], [['1', '2']])).toContain('a;b\r\n1;2\r\n')
  })

  it('escapa celdas con separador, comillas y saltos de línea (RFC 4180)', () => {
    const out = toCsv(['h'], [
      ['tiene; punto y coma'],
      ['dijo "hola"'],
      ['linea1\nlinea2'],
    ])
    expect(out).toContain('"tiene; punto y coma"')
    expect(out).toContain('"dijo ""hola"""')
    expect(out).toContain('"linea1\nlinea2"')
  })

  it('convierte números flotantes a coma decimal y respeta enteros', () => {
    const out = toCsv(['tasa', 'total'], [[5.94, 1200]])
    expect(out).toContain('5,94')
    expect(out).toContain('1200')
    expect(out).not.toContain('5.94')
  })

  it('redondea flotantes a 6 decimales máximo', () => {
    const out = toCsv(['v'], [[0.123456789]])
    expect(out).toContain('0,123457')
  })

  it('mapea null y undefined a celda vacía', () => {
    const out = toCsv(['a', 'b', 'c'], [[null, undefined, 'x']])
    expect(out.split('\r\n')[1]).toBe(';;x')
  })
})

describe('downloadCsv', () => {
  it('crea un blob, lo descarga por un enlace temporal y revoca el object URL', () => {
    const createSpy = vi.fn(() => 'blob:fake-url')
    const revokeSpy = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL: createSpy, revokeObjectURL: revokeSpy })
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    downloadCsv('informe.csv', ['col'], [['1']])

    expect(createSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeSpy).toHaveBeenCalledWith('blob:fake-url')

    clickSpy.mockRestore()
    vi.unstubAllGlobals()
  })
})
