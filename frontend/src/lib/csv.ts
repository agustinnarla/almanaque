export type CsvCell = string | number | null | undefined

const SEPARATOR = ';'
const CRLF = '\r\n'

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  let text: string
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      text = String(value)
    } else {
      const rounded = Math.round(value * 1e6) / 1e6
      text = String(rounded).replace('.', ',')
    }
  } else {
    text = value
  }
  if (
    text.includes(SEPARATOR) ||
    text.includes('"') ||
    text.includes('\n') ||
    text.includes('\r')
  ) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) =>
    row.map(escapeCell).join(SEPARATOR),
  )
  return `﻿${lines.join(CRLF)}${CRLF}`
}

export function downloadCsv(
  filename: string,
  headers: string[],
  rows: CsvCell[][],
): void {
  const blob = new Blob([toCsv(headers, rows)], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
