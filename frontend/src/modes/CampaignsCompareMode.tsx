import { useMemo, useState } from 'react'
import { AlertTriangle, Trophy } from 'lucide-react'
import { ExportCsvButton } from '../components/common/ExportCsvButton'
import { PrintButton } from '../components/common/PrintButton'
import { ExecutiveSummary } from '../components/Insights/ExecutiveSummary'
import { crossSummaryItems } from '../lib/executiveSummary'
import {
  SectionNav,
  type SectionLink,
} from '../components/common/SectionNav'
import { BasesCompareTable } from '../components/dashboard/BasesCompareTable'
import { GatewaysTable } from '../components/dashboard/GatewaysTable'
import { HourlyTrendChart } from '../components/dashboard/HourlyTrendChart'
import { KpiGrid } from '../components/dashboard/KpiGrid'
import {
  FilterCrossCampaignBar,
  type CrossCampaignValues,
} from '../components/Filters/FilterCrossCampaignBar'
import { DiagnosticsFeed } from '../components/Insights/DiagnosticsFeed'
import { PatternsComparePanel } from '../components/Insights/PatternsComparePanel'
import { RecommendationsPanel } from '../components/Insights/RecommendationsPanel'
import { CrossRankingTable } from '../components/overview/CrossRankingTable'
import { DailyCompareChart } from '../components/overview/DailyCompareChart'
import { useCrossCampaignCompare } from '../hooks/useCrossCampaignCompare'
import { useCrossCampaignDiagnostics } from '../hooks/useCrossCampaignDiagnostics'
import { useCrossCampaignRecommendations } from '../hooks/useCrossCampaignRecommendations'
import { usePatternAlerts } from '../hooks/usePatternAlerts'
import { useRangeRankings } from '../hooks/useRangeRankings'
import {
  composeCrossNegatives,
  composeCrossPositives,
} from '../lib/crossDiagnostics'
import {
  basesCompareRows,
  crossRankingRows,
  dailyCompareRows,
  diagnosticRows,
  gatewaysCompareRows,
  hourlyCompareRows,
  kpiCompareRows,
  patternCompareComboRows,
  patternCompareDailyRows,
  recommendationRows,
} from '../lib/exporters'
import { comparePatternSummaries } from '../lib/patterns'
import {
  buildBestDevice,
  buildBestHour,
  buildWorstDevice,
  buildWorstHour,
} from '../lib/rangeDiagnostics'
import { mergeBaseRankings, mergeSegmentRankings } from '../lib/rankings'
import { defaultCrossValues, segmentOf } from '../lib/catalog'
import type { CampaignCatalogEntry } from '../types/api'
import { DEFAULT_MIN_CALLS, RANKING_LIMIT } from './defaults'

interface CampaignsCompareModeProps {
  catalog: CampaignCatalogEntry[]
}

const CAMPAIGNS_SECTIONS: SectionLink[] = [
  { id: 'sec-filtros', label: 'Filtros' },
  { id: 'sec-resumen', label: 'Resumen' },
  { id: 'sec-kpis', label: 'Indicadores' },
  { id: 'sec-diagnostico', label: 'Diagnóstico' },
  { id: 'sec-recomendaciones', label: 'Recomendaciones' },
  { id: 'sec-rankings', label: 'Rankings' },
  { id: 'sec-alertas', label: 'Alertas' },
  { id: 'sec-temporal', label: 'Horas y gateways' },
  { id: 'sec-bases', label: 'Bases' },
  { id: 'sec-diario', label: 'Tendencia diaria' },
]

export function CampaignsCompareMode({ catalog }: CampaignsCompareModeProps) {
  const [cross, setCross] = useState<CrossCampaignValues>(() =>
    defaultCrossValues(catalog, DEFAULT_MIN_CALLS),
  )

  const params = useMemo(
    () => ({
      campaignA: cross.campaignA,
      campaignB: cross.campaignB,
      startDate: cross.from,
      endDate: cross.to,
      minCalls: cross.minCalls,
    }),
    [cross.campaignA, cross.campaignB, cross.from, cross.to, cross.minCalls],
  )

  const { data, loading, error, reload } = useCrossCampaignCompare(params)
  const diagnostics = useCrossCampaignDiagnostics(params)
  const recommendations = useCrossCampaignRecommendations(params)
  const rankingsA = useRangeRankings({
    campaign: cross.campaignA,
    from: cross.from,
    to: cross.to,
    minCalls: cross.minCalls,
    limit: RANKING_LIMIT,
  })
  const rankingsB = useRangeRankings({
    campaign: cross.campaignB,
    from: cross.from,
    to: cross.to,
    minCalls: cross.minCalls,
    limit: RANKING_LIMIT,
  })
  const patternAlerts = usePatternAlerts({
    from: cross.from,
    to: cross.to,
    minCalls: cross.minCalls,
  })

  const baseRows = mergeBaseRankings(
    rankingsA.bases ?? [],
    rankingsB.bases ?? [],
  )
  const deviceRows = mergeSegmentRankings(
    rankingsA.devices,
    rankingsB.devices,
    'device',
  )
  const hourRows = mergeSegmentRankings(rankingsA.hours, rankingsB.hours, 'hour')
  const patternCompare =
    patternAlerts.alerts != null
      ? comparePatternSummaries(
          patternAlerts.alerts,
          cross.campaignA,
          cross.campaignB,
        )
      : null

  const rankingsLoading = rankingsA.loading || rankingsB.loading
  const rankingsError = rankingsA.error ?? rankingsB.error

  const crossPositives = diagnostics.data
    ? composeCrossPositives(
        diagnostics.data.positive_drivers ?? [],
        data
          ? [
              buildBestHour(data.hourly_a, data.campaign_a),
              buildBestDevice(data.devices_a, data.campaign_a),
              buildBestHour(data.hourly_b, data.campaign_b),
              buildBestDevice(data.devices_b, data.campaign_b),
            ]
          : [],
      )
    : []
  const crossNegatives = diagnostics.data
    ? composeCrossNegatives(
        diagnostics.data.root_causes ?? [],
        data
          ? [
              buildWorstHour(data.hourly_a, data.campaign_a),
              buildWorstDevice(data.devices_a, data.campaign_a),
              buildWorstHour(data.hourly_b, data.campaign_b),
              buildWorstDevice(data.devices_b, data.campaign_b),
            ]
          : [],
      )
    : []

  const reloadAll = () => {
    reload()
    diagnostics.reload()
    recommendations.reload()
    rankingsA.reload()
    rankingsB.reload()
    patternAlerts.reload()
  }

  return (
    <div className="space-y-6">
      <div id="sec-filtros" className="scroll-mt-16">
        <FilterCrossCampaignBar
          initial={cross}
          catalog={catalog}
          onCompare={(values) => {
            const same =
              values.campaignA === cross.campaignA &&
              values.campaignB === cross.campaignB &&
              values.from === cross.from &&
              values.to === cross.to &&
              values.minCalls === cross.minCalls
            setCross(values)
            if (same) {
              reloadAll()
            }
          }}
        />
      </div>

      {loading && (
        <div className="space-y-4" aria-busy="true" aria-label="Cargando campañas">
          <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-80 animate-pulse rounded-xl bg-slate-200" />
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          No se pudo cargar la comparación de campañas: {error}. ¿Está corriendo
          el backend en el puerto 8000?
        </p>
      )}

      {!loading && !error && data && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {data.campaign_a} vs {data.campaign_b} · {data.start_date} →{' '}
              {data.end_date} · min_calls {data.min_calls_applied}
            </p>
            <PrintButton />
          </div>

          <ExecutiveSummary
            items={crossSummaryItems({
              summary: data.summary,
              campaignA: data.campaign_a,
              campaignB: data.campaign_b,
              segment: segmentOf(catalog, data.campaign_a),
              rootCauses: crossNegatives,
              positiveDrivers: crossPositives,
              recommendations: recommendations.data?.recommendations ?? [],
            })}
          />

          <SectionNav links={CAMPAIGNS_SECTIONS} />

          <section id="sec-kpis" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Indicadores clave
              </h2>
              <ExportCsvButton
                filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_kpis.csv`}
                {...(data.summary
                  ? kpiCompareRows(data.summary)
                  : { headers: [], rows: [] })}
              />
            </div>
            <KpiGrid data={data} labelA="Campaña" labelB="Campaña" />
          </section>

          <section id="sec-diagnostico" aria-label="Diagnóstico entre campañas" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Diagnóstico
              </h2>
              <ExportCsvButton
                filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_diagnosticos.csv`}
                {...diagnosticRows(crossNegatives, crossPositives)}
              />
            </div>
            {diagnostics.loading && (
              <div
                className="h-40 animate-pulse rounded-xl bg-slate-200"
                aria-busy="true"
                aria-label="Cargando diagnóstico entre campañas"
              />
            )}
            {diagnostics.error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                No se pudo cargar el diagnóstico: {diagnostics.error}
              </p>
            )}
            {!diagnostics.loading && !diagnostics.error && diagnostics.data && (
              <DiagnosticsFeed
                rootCauses={crossNegatives}
                positiveDrivers={crossPositives}
                positiveTitle="Puntos destacados"
                positiveDescription="Fortalezas y señales positivas del período"
              />
            )}
          </section>

          <section id="sec-recomendaciones" aria-label="Recomendaciones entre campañas" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Recomendaciones
              </h2>
              <ExportCsvButton
                filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_recomendaciones.csv`}
                {...recommendationRows(
                  recommendations.data?.recommendations ?? [],
                )}
              />
            </div>
            {recommendations.loading && (
              <div
                className="h-32 animate-pulse rounded-xl bg-slate-200"
                aria-busy="true"
                aria-label="Cargando recomendaciones entre campañas"
              />
            )}
            {recommendations.error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                No se pudieron cargar las recomendaciones: {recommendations.error}
              </p>
            )}
            {!recommendations.loading && !recommendations.error && (
              <RecommendationsPanel
                recommendations={recommendations.data?.recommendations ?? []}
              />
            )}
          </section>

          <section id="sec-rankings" aria-label="Rankings comparados" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Trophy className="h-4 w-4 text-indigo-600" aria-hidden />
                  Rankings comparados
                </h2>
                <p className="text-xs text-slate-500">
                  Ranking de cada campaña por health score · volumen mínimo{' '}
                  {cross.minCalls} llamadas · top {RANKING_LIMIT}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <ExportCsvButton
                  label="Bases"
                  filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_rank_bases.csv`}
                  {...crossRankingRows('base', baseRows)}
                />
                <ExportCsvButton
                  label="Dispositivos"
                  filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_rank_devices.csv`}
                  {...crossRankingRows('device', deviceRows)}
                />
                <ExportCsvButton
                  label="Horas"
                  filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_rank_hours.csv`}
                  {...crossRankingRows('hour', hourRows)}
                />
              </div>
            </div>
            {rankingsLoading && (
              <div
                className="h-40 animate-pulse rounded-xl bg-slate-200"
                aria-busy="true"
                aria-label="Cargando rankings comparados"
              />
            )}
            {rankingsError && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                No se pudieron cargar los rankings: {rankingsError}
              </p>
            )}
            {!rankingsLoading && !rankingsError && (
              <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      Bases por intentos
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Unión de bases de ambas campañas con intentos y tasa
                      (faltantes → —) · las de menos de {cross.minCalls} llamadas
                      van al final, atenuadas
                    </p>
                  </div>
                  <CrossRankingTable kind="base" rows={baseRows} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      Dispositivos
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Unión de los rankings de cada campaña por health score ·
                      volumen mínimo {cross.minCalls} llamadas · top{' '}
                      {RANKING_LIMIT}
                    </p>
                  </div>
                  <CrossRankingTable kind="device" rows={deviceRows} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Horas</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Unión de los rankings de cada campaña por health score ·
                      volumen mínimo {cross.minCalls} llamadas · top{' '}
                      {RANKING_LIMIT}
                    </p>
                  </div>
                  <CrossRankingTable kind="hour" rows={hourRows} />
                </div>
              </div>
            )}
          </section>

          <section id="sec-alertas" aria-label="Alertas de patrones comparadas" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                  Alertas de patrones
                </h2>
                <p className="text-xs text-slate-500">
                  Combinaciones con Agent Answer muy por debajo del promedio de
                  cada campaña · volumen mínimo {cross.minCalls} llamadas
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ExportCsvButton
                  label="Por día"
                  filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_patterns_daily.csv`}
                  {...patternCompareDailyRows(patternCompare?.byDay ?? [])}
                />
                <ExportCsvButton
                  label="Combinaciones"
                  filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_patterns_combos.csv`}
                  {...patternCompareComboRows(patternCompare?.combos ?? [])}
                />
              </div>
            </div>
            {patternAlerts.loading && (
              <div
                className="h-40 animate-pulse rounded-xl bg-slate-200"
                aria-busy="true"
                aria-label="Cargando alertas de patrones"
              />
            )}
            {patternAlerts.error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                No se pudieron cargar las alertas: {patternAlerts.error}
              </p>
            )}
            {!patternAlerts.loading && !patternAlerts.error && (
              <PatternsComparePanel
                alerts={patternAlerts.alerts}
                campaignA={cross.campaignA}
                campaignB={cross.campaignB}
              />
            )}
          </section>

          <section
            id="sec-temporal"
            aria-label="Análisis temporal e infraestructura"
            className="grid scroll-mt-16 grid-cols-[minmax(0,1fr)] gap-6"
          >
            <div>
              <HourlyTrendChart
                pointsA={data.hourly_a}
                pointsB={data.hourly_b}
                labelA={`Campaña ${data.campaign_a}`}
                labelB={`Campaña ${data.campaign_b}`}
                headerAction={
                  <ExportCsvButton
                    filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_hourly.csv`}
                    {...hourlyCompareRows(data.hourly_a, data.hourly_b)}
                  />
                }
              />
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="mb-1 text-base font-semibold text-slate-900">
                    Comparativa de gateways
                  </h2>
                  <p className="text-xs text-slate-500">
                    Campaña {data.campaign_a} vs {data.campaign_b} ·
                    intersección con volumen mínimo
                  </p>
                </div>
                <ExportCsvButton
                  filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_gateways.csv`}
                  {...gatewaysCompareRows(data.gateways_comparison ?? [])}
                />
              </div>
              <GatewaysTable rows={data.gateways_comparison} />
            </div>
          </section>

          <section id="sec-bases" aria-label="Bases comparadas" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="mb-1 text-base font-semibold text-slate-900">
                  Comparativa de bases
                </h2>
                <p className="text-xs text-slate-500">
                  Bases comunes a ambas campañas con volumen mínimo
                </p>
              </div>
              <ExportCsvButton
                filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_bases.csv`}
                {...basesCompareRows(data.bases_comparison ?? [])}
              />
            </div>
            <BasesCompareTable rows={data.bases_comparison} />
          </section>

          <section id="sec-diario" className="scroll-mt-16">
            <DailyCompareChart
              pointsA={data.daily_a}
              pointsB={data.daily_b}
              labelA={`Campaña ${data.campaign_a}`}
              labelB={`Campaña ${data.campaign_b}`}
              headerAction={
                <ExportCsvButton
                  filename={`campanas_${cross.campaignA}_vs_${cross.campaignB}_daily.csv`}
                  {...dailyCompareRows(data.daily_a, data.daily_b)}
                />
              }
            />
          </section>
        </>
      )}

      {!loading && !error && !data && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Elegí dos campañas y presioná «Comparar» para ver la comparativa.
        </p>
      )}
    </div>
  )
}
