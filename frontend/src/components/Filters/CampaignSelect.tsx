import type { CampaignCatalogEntry } from '../../types/api'

interface CampaignSelectProps {
  label: string
  value: string
  catalog: CampaignCatalogEntry[]
  onChange: (campaign: string) => void
  className: string
}

export function CampaignSelect({
  label,
  value,
  catalog,
  onChange,
  className,
}: CampaignSelectProps) {
  return (
    <label className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-600">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={className}
        required
      >
        {catalog.map((entry) => (
          <option key={entry.campaign} value={entry.campaign}>
            {entry.campaign} · {entry.days} días
          </option>
        ))}
      </select>
    </label>
  )
}
