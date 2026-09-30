const dayLabelFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function formatDayLabel(iso: string): string {
  const parts = dayLabelFormatter.formatToParts(new Date(`${iso}T00:00:00`))
  const day = parts.find((part) => part.type === 'day')?.value ?? ''
  const month = parts.find((part) => part.type === 'month')?.value ?? ''
  return `${day}/${month}`
}
