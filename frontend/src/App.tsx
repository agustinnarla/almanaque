import { useState } from 'react'
import { useCampaigns } from './hooks/useCampaigns'
import { CampaignsCompareMode } from './modes/CampaignsCompareMode'
import { CompareMode } from './modes/CompareMode'
import { RangeMode } from './modes/RangeMode'

type ViewMode = 'range' | 'compare' | 'campaigns' | 'week'

interface ModeTabsProps {
  mode: ViewMode
  onChange: (mode: ViewMode) => void
}

function ModeTabs({ mode, onChange }: ModeTabsProps) {
  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
    }`

  return (
    <div
      data-testid="mode-tabs"
      className="mb-6 inline-flex gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1 print:hidden"
      role="tablist"
      aria-label="Modo de análisis"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'range'}
        data-testid="tab-range"
        className={tabClass(mode === 'range')}
        onClick={() => onChange('range')}
      >
        Campaña completa
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'compare'}
        data-testid="tab-compare"
        className={tabClass(mode === 'compare')}
        onClick={() => onChange('compare')}
      >
        Comparar 2 días
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'campaigns'}
        data-testid="tab-campaigns"
        className={tabClass(mode === 'campaigns')}
        onClick={() => onChange('campaigns')}
      >
        Comparar campañas
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'week'}
        data-testid="tab-week"
        className={tabClass(mode === 'week')}
        onClick={() => onChange('week')}
      >
        Por semana
      </button>
    </div>
  )
}

function App() {
  const [mode, setMode] = useState<ViewMode>('range')
  const campaigns = useCampaigns()
  const catalog = campaigns.loading ? null : campaigns.campaigns

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6 print:hidden">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
          Call Center · Análisis
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          Diagnóstico de Agent Answer
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Analizá la campaña completa o por semana, compará dos días o contrastá
          dos campañas para detectar causas de caída y factores de mejora.
        </p>
      </header>

      <ModeTabs mode={mode} onChange={setMode} />

      {campaigns.loading && (
        <div className="space-y-4" aria-busy="true" aria-label="Cargando lista de campañas">
          <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
        </div>
      )}

      {campaigns.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          No se pudo cargar la lista de campañas: {campaigns.error}. ¿Está
          corriendo el backend en el puerto 8000?
        </p>
      )}

      {catalog && catalog.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          No hay campañas cargadas. Ejecutá la ingesta de /data para empezar.
        </p>
      )}

      {catalog && catalog.length > 0 && (
        <>
          {mode === 'range' && <RangeMode catalog={catalog} />}
          {mode === 'compare' && <CompareMode catalog={catalog} />}
          {mode === 'campaigns' && <CampaignsCompareMode catalog={catalog} />}
          {mode === 'week' && <RangeMode catalog={catalog} variant="week" />}
        </>
      )}
    </div>
  )
}

export default App
