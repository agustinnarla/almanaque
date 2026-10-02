import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ExportCsvButton } from '../components/common/ExportCsvButton'
import { PrintButton } from '../components/common/PrintButton'
import { SectionNav, type SectionLink } from '../components/common/SectionNav'
import { BasesCompareTable } from '../components/dashboard/BasesCompareTable'
import { GatewaysTable } from '../components/dashboard/GatewaysTable'
import { HourlyTrendChart } from '../components/dashboard/HourlyTrendChart'
import { KpiGrid } from '../components/dashboard/KpiGrid'
import {
  FilterWeeksCompareBar,
  type WeeksCompareValues,
} from '../components/Filters/FilterWeeksCompareBar'
import { DiagnosticsFeed } from '../components/Insights/DiagnosticsFeed'
import { ExecutiveSummary } from '../components/Insights/ExecutiveSummary'
import { RecommendationsPanel } from '../components/Insights/RecommendationsPanel'
import { WeekdayCompareChart } from '../components/overview/WeekdayCompareChart'
import { useCrossCampaignCompare } from '../hooks/useCrossCampaignCompare'
import { useCrossCampaignDiagnostics } from '../hooks/useCrossCampaignDiagnostics'
import { useCrossCampaignRecommendations } from '../hooks/useCrossCampaignRecommendations'
import { campaignDates, segmentOf } from '../lib/catalog'
import { mergeDailyByWeekday } from '../lib/chartData'
import { compareSummaryItems } from '../lib/executiveSummary'
import {
  basesCompareRows,
  diagnosticRows,
  gatewaysCompareRows,
  hourlyCompareRows,
  kpiCompareRows,
  recommendationRows,
  weekdayCompareRows,
} from '../lib/exporters'
import { dimWhile } from '../lib/refreshing'
import { buildWeekOptions, defaultWeekPair, weekMismatchNote } from '../lib/weeks'
import type { CampaignCatalogEntry } from '../types/api'
import { DEFAULT_MIN_CALLS } from './defaults'

const WEEKS_SECTIONS: SectionLink[] = [
  { id: 'sec-filtros', label: 'Filtros' },
  { id: 'sec-resumen', label: 'Resumen' },
  { id: 'sec-kpis', label: 'Indicadores' },
  { id: 'sec-diagnostico', label: 'Diagnóstico' },
  { id: 'sec-recomendaciones', label: 'Recomendaciones' },
  { id: 'sec-temporal', label: 'Horas y gateways' },
  { id: 'sec-bases', label: 'Bases' },
  { id: 'sec-diario', label: 'Por día' },
]

// "Semana 39 (21–27/09)" → "Semana 39" for chart series and titles.
const shortLabel = (label: string) => label.split(' (')[0]

function defaultValues(catalog: CampaignCatalogEntry[]): WeeksCompareValues | null {
  for (const entry of catalog) {
    const pair = defaultWeekPair(buildWeekOptions(campaignDates(catalog, entry.campaign)))
    if (pair) return { campaign: entry.campaign, weekA: pair.a, weekB: pair.b, minCalls: DEFAULT_MIN_CALLS }
  }
  return null
}

interface WeeksCompareModeProps {
  catalog: CampaignCatalogEntry[]
}

// Spec 057: one campaign, week A against week B (same machinery as
// Comparar campañas, with each side on its own range).
export function WeeksCompareMode({ catalog }: WeeksCompareModeProps) {
  const [values, setValues] = useState(() => defaultValues(catalog))
  if (values == null) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        Hace falta al menos una campaña con dos semanas de datos para comparar.
      </p>
    )
  }
  return <WeeksCompareView catalog={catalog} values={values} onChange={setValues} />
}

interface WeeksCompareViewProps {
  catalog: CampaignCatalogEntry[]
  values: WeeksCompareValues
  onChange: (values: WeeksCompareValues) => void
}

function WeeksCompareView({ catalog, values, onChange }: WeeksCompareViewProps) {
  const { campaign, weekA, weekB, minCalls } = values
  const params = useMemo(
    () => ({
      campaignA: campaign,
      campaignB: campaign,
      startDate: weekA.start,
      endDate: weekA.end,
      startDateB: weekB.start,
      endDateB: weekB.end,
      minCalls,
    }),
    [campaign, weekA.start, weekA.end, weekB.start, weekB.end, minCalls],
  )
  const { data, loading, refreshing, error, reload } = useCrossCampaignCompare(params)
  const diagnostics = useCrossCampaignDiagnostics(params)
  const recommendations = useCrossCampaignRecommendations(params)

  const labelA = shortLabel(weekA.label)
  const labelB = shortLabel(weekB.label)
  const prefix = `semanas_${campaign}_${weekA.start}_vs_${weekB.start}`
  const segment = segmentOf(catalog, campaign)
  const mismatch = weekMismatchNote(weekA, weekB)

  return (
    <div className="space-y-6">
      <div id="sec-filtros" className="scroll-mt-16">
        <FilterWeeksCompareBar
          initial={values}
          catalog={catalog}
          onApply={(next) => {
            const same =
              next.campaign === campaign &&
              next.weekA.start === weekA.start &&
              next.weekB.start === weekB.start &&
              next.minCalls === minCalls
            onChange(next)
            if (same) {
              reload()
              diagnostics.reload()
              recommendations.reload()
            }
          }}
        />
      </div>

      {loading && !refreshing && (
        <div className="space-y-4" aria-busy="true" aria-label="Cargando comparación de semanas">
          <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          No se pudo cargar la comparación de semanas: {error}. ¿Está corriendo el backend en el puerto 8000?
        </p>
      )}

      {(!loading || refreshing) && !error && data && (
        <div className={`space-y-6 ${dimWhile(refreshing)}`} aria-busy={refreshing || undefined}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {campaign}
              {segment && <> · {segment}</>} · {weekA.label} → {weekB.label} · min_calls {minCalls}
            </p>
            <PrintButton />
          </div>

          {mismatch && (
            <p
              data-testid="weeks-mismatch-warning"
              className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              {mismatch}
            </p>
          )}

          <ExecutiveSummary
            items={compareSummaryItems({
              summary: data.summary,
              dateA: labelA,
              dateB: labelB,
              rootCauses: diagnostics.data?.root_causes ?? [],
              positiveDrivers: diagnostics.data?.positive_drivers ?? [],
              recommendations: recommendations.data?.recommendations ?? [],
            })}
          />

          <SectionNav links={WEEKS_SECTIONS} />

          <section id="sec-kpis" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Indicadores: {labelA} → {labelB}</h2>
              <ExportCsvButton
                filename={`${prefix}_kpis.csv`}
                {...(data.summary ? kpiCompareRows(data.summary) : { headers: [], rows: [] })}
              />
            </div>
            <KpiGrid data={data} labelA="Semana" labelB="Semana" />
          </section>

          <section
            id="sec-diagnostico"
            aria-label="Diagnóstico entre semanas"
            className={`scroll-mt-16 ${dimWhile(diagnostics.refreshing && !refreshing)}`}
            aria-busy={(diagnostics.refreshing && !refreshing) || undefined}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Diagnóstico</h2>
              <ExportCsvButton
                filename={`${prefix}_diagnosticos.csv`}
                {...diagnosticRows(diagnostics.data?.root_causes ?? [], diagnostics.data?.positive_drivers ?? [])}
              />
            </div>
            {diagnostics.loading && !diagnostics.refreshing && (
              <div className="h-40 animate-pulse rounded-xl bg-slate-200" aria-busy="true" aria-label="Cargando diagnóstico" />
            )}
            {diagnostics.error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                No se pudo cargar el diagnóstico: {diagnostics.error}
              </p>
            )}
            {(!diagnostics.loading || diagnostics.refreshing) && !diagnostics.error && diagnostics.data && (
              <DiagnosticsFeed
                rootCauses={diagnostics.data.root_causes}
                positiveDrivers={diagnostics.data.positive_drivers}
              />
            )}
          </section>

          <section
            id="sec-recomendaciones"
            aria-label="Recomendaciones para la semana B"
            className={`scroll-mt-16 ${dimWhile(recommendations.refreshing && !refreshing)}`}
            aria-busy={(recommendations.refreshing && !refreshing) || undefined}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recomendaciones</h2>
                <p className="text-xs text-slate-500">Para la {labelB}</p>
              </div>
              <ExportCsvButton
                filename={`${prefix}_recomendaciones.csv`}
                {...recommendationRows(recommendations.data?.recommendations ?? [])}
              />
            </div>
            {recommendations.loading && !recommendations.refreshing && (
              <div className="h-32 animate-pulse rounded-xl bg-slate-200" aria-busy="true" aria-label="Cargando recomendaciones" />
            )}
            {recommendations.error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                No se pudieron cargar las recomendaciones: {recommendations.error}
              </p>
            )}
            {(!recommendations.loading || recommendations.refreshing) && !recommendations.error && (
              <RecommendationsPanel recommendations={recommendations.data?.recommendations ?? []} />
            )}
          </section>

          <section
            id="sec-temporal"
            aria-label="Horas y gateways"
            className="grid scroll-mt-16 grid-cols-[minmax(0,1fr)] gap-6"
          >
            <HourlyTrendChart
              pointsA={data.hourly_a}
              pointsB={data.hourly_b}
              labelA={labelA}
              labelB={labelB}
              headerAction={
                <ExportCsvButton
                  filename={`${prefix}_hourly.csv`}
                  {...hourlyCompareRows(data.hourly_a, data.hourly_b)}
                />
              }
            />
            <div>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="mb-1 text-base font-semibold text-slate-900">Comparativa de gateways</h2>
                  <p className="text-xs text-slate-500">
                    {labelA} vs {labelB} · troncales de las dos semanas con volumen mínimo
                  </p>
                </div>
                <ExportCsvButton
                  filename={`${prefix}_gateways.csv`}
                  {...gatewaysCompareRows(data.gateways_comparison ?? [])}
                />
              </div>
              <GatewaysTable rows={data.gateways_comparison} />
            </div>
          </section>

          <section id="sec-bases" aria-label="Bases comparadas" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="mb-1 text-base font-semibold text-slate-900">Comparativa de bases</h2>
                <p className="text-xs text-slate-500">Bases de las dos semanas con volumen mínimo</p>
              </div>
              <ExportCsvButton
                filename={`${prefix}_bases.csv`}
                {...basesCompareRows(data.bases_comparison ?? [])}
              />
            </div>
            <BasesCompareTable rows={data.bases_comparison} />
          </section>

          <section id="sec-diario" className="scroll-mt-16">
            <WeekdayCompareChart
              pointsA={data.daily_a}
              pointsB={data.daily_b}
              labelA={labelA}
              labelB={labelB}
              headerAction={
                <ExportCsvButton
                  filename={`${prefix}_daily.csv`}
                  {...weekdayCompareRows(mergeDailyByWeekday(data.daily_a, data.daily_b))}
                />
              }
            />
          </section>
        </div>
      )}
    </div>
  )
}
