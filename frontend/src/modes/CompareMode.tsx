import { useMemo, useState } from 'react'
import { ExportCsvButton } from '../components/common/ExportCsvButton'
import { PrintButton } from '../components/common/PrintButton'
import { ExecutiveSummary } from '../components/Insights/ExecutiveSummary'
import { compareSummaryItems } from '../lib/executiveSummary'
import {
  SectionNav,
  type SectionLink,
} from '../components/common/SectionNav'
import { GatewaysTable } from '../components/dashboard/GatewaysTable'
import { HourlyTrendChart } from '../components/dashboard/HourlyTrendChart'
import { KpiGrid } from '../components/dashboard/KpiGrid'
import { FilterBar, type FilterValues } from '../components/Filters/FilterBar'
import { DiagnosticsFeed } from '../components/Insights/DiagnosticsFeed'
import { RecommendationsPanel } from '../components/Insights/RecommendationsPanel'
import { useCompareDiagnostics } from '../hooks/useCompareDiagnostics'
import { useHourlyTrend } from '../hooks/useHourlyTrend'
import { useRecommendations } from '../hooks/useRecommendations'
import {
  diagnosticRows,
  gatewaysCompareRows,
  hourlyCompareRows,
  kpiCompareRows,
  recommendationRows,
} from '../lib/exporters'
import { defaultCompareValues } from '../lib/catalog'
import type { CampaignCatalogEntry } from '../types/api'
import { DEFAULT_MIN_CALLS } from './defaults'

interface CompareModeProps {
  catalog: CampaignCatalogEntry[]
}

const COMPARE_SECTIONS: SectionLink[] = [
  { id: 'sec-filtros', label: 'Filtros' },
  { id: 'sec-resumen', label: 'Resumen' },
  { id: 'sec-kpis', label: 'Indicadores' },
  { id: 'sec-diagnostico', label: 'Diagnóstico' },
  { id: 'sec-recomendaciones', label: 'Recomendaciones' },
  { id: 'sec-temporal', label: 'Horas y gateways' },
]

export function CompareMode({ catalog }: CompareModeProps) {
  const [filters, setFilters] = useState<FilterValues>(() =>
    defaultCompareValues(catalog, DEFAULT_MIN_CALLS),
  )

  const params = useMemo(
    () => ({
      campaign: filters.campaign,
      dateA: filters.dateA,
      dateB: filters.dateB,
      minCalls: filters.minCalls,
    }),
    [
      filters.campaign,
      filters.dateA,
      filters.dateB,
      filters.minCalls,
    ],
  )

  const { data, loading, error, reload } = useCompareDiagnostics(params)
  const hourly = useHourlyTrend(filters.campaign, filters.dateA, filters.dateB)
  const recommendations = useRecommendations(params)

  return (
    <div className="space-y-6">
      <div id="sec-filtros" className="scroll-mt-16">
        <FilterBar
          initial={filters}
          catalog={catalog}
          onCompare={(values) => {
            const same =
              values.campaign === filters.campaign &&
              values.dateA === filters.dateA &&
              values.dateB === filters.dateB &&
              values.minCalls === filters.minCalls
            setFilters(values)
            if (same) {
              reload()
            }
          }}
        />
      </div>

      {loading && (
        <div className="space-y-4" aria-busy="true" aria-label="Cargando">
          <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-40 animate-pulse rounded-xl bg-slate-200" />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          No se pudo cargar el diagnóstico: {error}. ¿Está corriendo el
          backend en el puerto 8000?
        </p>
      )}

      {!loading && !error && data && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {data.campaign} · {data.date_a} → {data.date_b} · min_calls{' '}
              {data.min_calls_applied}
            </p>
            <PrintButton />
          </div>

          <ExecutiveSummary
            items={compareSummaryItems({
              summary: data.summary,
              dateA: data.date_a,
              dateB: data.date_b,
              rootCauses: data.root_causes,
              positiveDrivers: data.positive_drivers,
              recommendations: recommendations.data?.recommendations ?? [],
            })}
          />

          <SectionNav links={COMPARE_SECTIONS} />

          <section id="sec-kpis" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Indicadores clave
              </h2>
              <ExportCsvButton
                filename={`comparar_${filters.campaign}_${filters.dateA}_${filters.dateB}_kpis.csv`}
                {...(data.summary
                  ? kpiCompareRows(data.summary)
                  : { headers: [], rows: [] })}
              />
            </div>
            <KpiGrid data={data} labelA="Día" labelB="Día" />
          </section>

          <section id="sec-diagnostico" aria-label="Diagnóstico" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Diagnóstico
              </h2>
              <ExportCsvButton
                filename={`comparar_${filters.campaign}_${filters.dateA}_${filters.dateB}_diagnosticos.csv`}
                {...diagnosticRows(data.root_causes, data.positive_drivers)}
              />
            </div>
            <DiagnosticsFeed
              rootCauses={data.root_causes}
              positiveDrivers={data.positive_drivers}
            />
          </section>

          <section id="sec-recomendaciones" aria-label="Recomendaciones" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Recomendaciones
              </h2>
              <ExportCsvButton
                filename={`comparar_${filters.campaign}_${filters.dateA}_${filters.dateB}_recomendaciones.csv`}
                {...recommendationRows(
                  recommendations.data?.recommendations ?? [],
                )}
              />
            </div>
            {recommendations.loading && !recommendations.error && (
              <div
                className="h-32 animate-pulse rounded-xl bg-slate-200"
                aria-busy="true"
                aria-label="Cargando recomendaciones"
              />
            )}
            {recommendations.error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                No se pudieron cargar las recomendaciones:{' '}
                {recommendations.error}
              </p>
            )}
            {!recommendations.loading && !recommendations.error && (
              <RecommendationsPanel
                recommendations={recommendations.data?.recommendations ?? []}
              />
            )}
          </section>

          <section
            id="sec-temporal"
            aria-label="Análisis temporal e infraestructura"
            className="grid scroll-mt-16 grid-cols-[minmax(0,1fr)] gap-6"
          >
            <div>
              {hourly.loading && !hourly.error && (
                <div
                  className="h-80 animate-pulse rounded-xl bg-slate-200"
                  aria-busy="true"
                  aria-label="Cargando tendencia horaria"
                />
              )}
              {hourly.error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  No se pudo cargar la tendencia horaria: {hourly.error}
                </p>
              )}
              {!hourly.loading && !hourly.error && (
                <HourlyTrendChart
                  pointsA={hourly.pointsA}
                  pointsB={hourly.pointsB}
                  labelA="Día A"
                  labelB="Día B"
                  headerAction={
                    <ExportCsvButton
                      filename={`comparar_${filters.campaign}_${filters.dateA}_${filters.dateB}_hourly.csv`}
                      {...hourlyCompareRows(hourly.pointsA, hourly.pointsB)}
                    />
                  }
                />
              )}
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="mb-1 text-base font-semibold text-slate-900">
                    Comparativa de gateways
                  </h2>
                  <p className="text-xs text-slate-500">
                    Congestión día a día y estado con precedencia Saturado →
                    Aliviado → Normal
                  </p>
                </div>
                <ExportCsvButton
                  filename={`comparar_${filters.campaign}_${filters.dateA}_${filters.dateB}_gateways.csv`}
                  {...gatewaysCompareRows(data.gateways_comparison ?? [])}
                />
              </div>
              <GatewaysTable rows={data.gateways_comparison} />
            </div>
          </section>
        </>
      )}

      {!loading && !error && !data && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Elegí filtros y presioná «Comparar» para ver el diagnóstico.
        </p>
      )}
    </div>
  )
}
