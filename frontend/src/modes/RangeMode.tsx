import { useMemo, useState } from 'react'
import { AlertTriangle, Trophy } from 'lucide-react'
import { ExportCsvButton } from '../components/common/ExportCsvButton'
import { PrintButton } from '../components/common/PrintButton'
import { ExecutiveSummary } from '../components/Insights/ExecutiveSummary'
import { useHeatmap } from '../hooks/useHeatmap'
import { useRoutingChanges } from '../hooks/useRoutingChanges'
import { useSegmentPeers } from '../hooks/useSegmentPeers'
import { rangeSummaryItems } from '../lib/executiveSummary'
import {
  SectionNav,
  type SectionLink,
} from '../components/common/SectionNav'
import {
  FilterRangeBar,
  type RangeValues,
} from '../components/Filters/FilterRangeBar'
import { FilterWeekBar } from '../components/Filters/FilterWeekBar'
import { DiagnosticsFeed } from '../components/Insights/DiagnosticsFeed'
import { PatternsPanel } from '../components/Insights/PatternsPanel'
import { RecommendationsPanel } from '../components/Insights/RecommendationsPanel'
import { BasesRankingTable } from '../components/overview/BasesRankingTable'
import { DailyTrendChart } from '../components/overview/DailyTrendChart'
import { GatewaysRangeTable } from '../components/overview/GatewaysRangeTable'
import { HourDeviceHeatmap } from '../components/overview/HourDeviceHeatmap'
import { HourlyAggregateChart } from '../components/overview/HourlyAggregateChart'
import { OverviewKpis } from '../components/overview/OverviewKpis'
import { SegmentRankingTable } from '../components/overview/SegmentRankingTable'
import { TrunkVolumeChart } from '../components/overview/TrunkVolumeChart'
import { useCampaignOverview } from '../hooks/useCampaignOverview'
import { usePatternAlerts } from '../hooks/usePatternAlerts'
import { useRangeDiagnostics } from '../hooks/useRangeDiagnostics'
import { useRangeRankings } from '../hooks/useRangeRankings'
import { useRangeRecommendations } from '../hooks/useRangeRecommendations'
import {
  basesRankingRows,
  dailyRows,
  diagnosticRows,
  gatewaysRangeRows,
  heatmapRows,
  hourlyRows,
  kpiRangeRows,
  patternComboRows,
  patternDailyRows,
  recommendationRows,
  segmentRankingRows,
  trunkVolumeRows,
} from '../lib/exporters'
import { summarizePatterns } from '../lib/patterns'
import { mapRangeDiagnostics } from '../lib/rangeDiagnostics'
import {
  campaignDates,
  campaignEntry,
  segmentOf,
  defaultRangeValues,
  defaultWeekValues,
} from '../lib/catalog'
import { buildWeekOptions, findWeekByStart } from '../lib/weeks'
import { describeDays, rangeMissingDays } from '../lib/coverage'
import { dimWhile } from '../lib/refreshing'
import type { CampaignCatalogEntry } from '../types/api'
import { DEFAULT_MIN_CALLS, RANKING_LIMIT } from './defaults'

const RANGE_SECTIONS: SectionLink[] = [
  { id: 'sec-filtros', label: 'Filtros' },
  { id: 'sec-resumen', label: 'Resumen' },
  { id: 'sec-kpis', label: 'Indicadores' },
  { id: 'sec-diagnostico', label: 'Diagnóstico' },
  { id: 'sec-recomendaciones', label: 'Recomendaciones' },
  { id: 'sec-rankings', label: 'Rankings' },
  { id: 'sec-alertas', label: 'Alertas' },
  { id: 'sec-tendencias', label: 'Tendencia diaria' },
  { id: 'sec-horaria', label: 'Por hora' },
]

export type RangeVariant = 'range' | 'week'

interface RangeModeProps {
  catalog: CampaignCatalogEntry[]
  variant?: RangeVariant
}

export function RangeMode({ catalog, variant = 'range' }: RangeModeProps) {
  const isWeek = variant === 'week'
  const [range, setRange] = useState<RangeValues>(() =>
    isWeek
      ? defaultWeekValues(catalog, DEFAULT_MIN_CALLS)
      : defaultRangeValues(catalog, DEFAULT_MIN_CALLS),
  )

  const params = useMemo(
    () => ({ campaign: range.campaign, from: range.from, to: range.to }),
    [range.campaign, range.from, range.to],
  )

  const overview = useCampaignOverview(params)
  const diagnostics = useRangeDiagnostics({ ...params, minCalls: range.minCalls })
  const recommendations = useRangeRecommendations({
    ...params,
    minCalls: range.minCalls,
  })
  const rankings = useRangeRankings({
    ...params,
    minCalls: range.minCalls,
    limit: RANKING_LIMIT,
  })
  const segmentPeers = useSegmentPeers({ catalog, ...params })
  const routing = useRoutingChanges(params)
  const heatmap = useHeatmap(range.campaign, range.from, range.to)
  const segment = segmentOf(catalog, range.campaign)
  const entry = campaignEntry(catalog, range.campaign)
  const missingDays = entry ? rangeMissingDays(entry, range.from, range.to) : []
  const patternAlerts = usePatternAlerts({
    from: range.from,
    to: range.to,
    minCalls: range.minCalls,
  })

  const defaultRange = isWeek
    ? defaultWeekValues(catalog, DEFAULT_MIN_CALLS)
    : defaultRangeValues(catalog, DEFAULT_MIN_CALLS)
  const same =
    range.campaign === defaultRange.campaign &&
    range.from === defaultRange.from &&
    range.to === defaultRange.to &&
    range.minCalls === defaultRange.minCalls
  const filePrefix = isWeek ? 'semana' : 'rango'
  const week = isWeek
    ? findWeekByStart(
        buildWeekOptions(campaignDates(catalog, range.campaign)),
        range.from,
      )
    : null

  const rangeDiag =
    diagnostics.data != null
      ? mapRangeDiagnostics(
          diagnostics.data,
          overview.devices,
          overview.daily,
          overview.hourly,
        )
      : null

  const patternSummary =
    patternAlerts.alerts != null
      ? summarizePatterns(patternAlerts.alerts, range.campaign)
      : null

  const reloadRange = () => {
    overview.reload()
    diagnostics.reload()
    recommendations.reload()
    rankings.reload()
    patternAlerts.reload()
  }

  return (
    <div className="space-y-6">
      <div id="sec-filtros" className="scroll-mt-16">
        {isWeek ? (
          <FilterWeekBar
            initial={{
              campaign: range.campaign,
              weekStart: range.from,
              minCalls: range.minCalls,
            }}
            catalog={catalog}
            onApply={(values) => {
              const unchanged =
                values.campaign === range.campaign &&
                values.from === range.from &&
                values.to === range.to &&
                values.minCalls === range.minCalls
              setRange(values)
              if (unchanged) {
                reloadRange()
              }
            }}
          />
        ) : (
          <FilterRangeBar
            initial={range}
            catalog={catalog}
            onApply={(values) => {
              const unchanged =
                values.campaign === range.campaign &&
                values.from === range.from &&
                values.to === range.to &&
                values.minCalls === range.minCalls
              setRange(values)
              if (unchanged) {
                reloadRange()
              }
            }}
          />
        )}
      </div>

      {overview.loading && !overview.refreshing && (
        <div className="space-y-4" aria-busy="true" aria-label="Cargando campaña">
          <div className="h-28 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-80 animate-pulse rounded-xl bg-slate-200" />
        </div>
      )}

      {overview.error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          No se pudo cargar la campaña: {overview.error}. ¿Está corriendo el
          backend en el puerto 8000?
        </p>
      )}

      {(!overview.loading || overview.refreshing) && !overview.error && overview.summary && (
        <div className={`space-y-6 ${dimWhile(overview.refreshing)}`} aria-busy={overview.refreshing || undefined}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {overview.summary.campaign}
              {segment && <> · {segment}</>} · {range.from} → {range.to} · min_calls{' '}
              {range.minCalls}
              {week && <> · {week.label}</>}
              {week && <> · {week.dataDays} días con datos</>}
              {week?.partial && (
                <span
                  data-testid="week-partial-badge"
                  className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                >
                  Parcial
                </span>
              )}
              {missingDays.length > 0 && (
                <span
                  data-testid="missing-days-badge"
                  title="Días hábiles del rango sin datos de esta campaña (pueden ser feriados)"
                  className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                >
                  Faltan {missingDays.length} {missingDays.length === 1 ? 'día' : 'días'}: {describeDays(missingDays)}
                </span>
              )}
            </p>
            <PrintButton />
          </div>

          <ExecutiveSummary
            items={rangeSummaryItems({
              summary: overview.summary,
              segment,
              peers: segmentPeers.peers,
              routingChange: routing.changes.at(-1)?.message ?? null,
              rootCauses: rangeDiag?.rootCauses ?? [],
              positiveDrivers: rangeDiag?.positiveDrivers ?? [],
              recommendations: recommendations.data?.recommendations ?? [],
            })}
          />

          <SectionNav links={RANGE_SECTIONS} />

          <section id="sec-kpis" className="scroll-mt-16">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Indicadores acumulados
              </h2>
              <ExportCsvButton
                filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_kpis.csv`}
                {...kpiRangeRows(overview.summary)}
              />
            </div>
            <OverviewKpis summary={overview.summary} />
          </section>

          <section id="sec-diagnostico" aria-label="Diagnóstico del rango" className={`scroll-mt-16 ${dimWhile(diagnostics.refreshing && !overview.refreshing)}`} aria-busy={diagnostics.refreshing && !overview.refreshing || undefined}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Diagnóstico del rango
              </h2>
              {rangeDiag && (
                <ExportCsvButton
                  filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_diagnosticos.csv`}
                  {...diagnosticRows(rangeDiag.rootCauses, rangeDiag.positiveDrivers)}
                />
              )}
            </div>
            {diagnostics.loading && !diagnostics.refreshing && (
              <div className="h-40 animate-pulse rounded-xl bg-slate-200" aria-busy="true" aria-label="Cargando diagnóstico" />
            )}
            {diagnostics.error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                No se pudo cargar el diagnóstico: {diagnostics.error}
              </p>
            )}
            {(!diagnostics.loading || diagnostics.refreshing) && !diagnostics.error && rangeDiag && (
              <DiagnosticsFeed
                rootCauses={rangeDiag.rootCauses}
                positiveDrivers={rangeDiag.positiveDrivers}
                positiveTitle="Puntos destacados"
                positiveDescription="Fortalezas y señales positivas del período"
              />
            )}
          </section>

          <section id="sec-recomendaciones" aria-label="Recomendaciones del rango" className={`scroll-mt-16 ${dimWhile(recommendations.refreshing && !overview.refreshing)}`} aria-busy={recommendations.refreshing && !overview.refreshing || undefined}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">
                Recomendaciones del rango
              </h2>
              <ExportCsvButton
                filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_recomendaciones.csv`}
                {...recommendationRows(
                  recommendations.data?.recommendations ?? [],
                )}
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
              <RecommendationsPanel
                recommendations={recommendations.data?.recommendations ?? []}
              />
            )}
          </section>

          <section id="sec-rankings" aria-label="Rankings del rango" className={`scroll-mt-16 ${dimWhile(rankings.refreshing && !overview.refreshing)}`} aria-busy={rankings.refreshing && !overview.refreshing || undefined}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Trophy className="h-4 w-4 text-indigo-600" aria-hidden />
                  Rankings del rango
                </h2>
                <p className="text-xs text-slate-500">
                  Mejores y peores segmentos por health score · volumen mínimo{' '}
                  {rankings.devices?.min_calls_applied ?? range.minCalls} llamadas · top{' '}
                  {rankings.devices?.limit_applied ?? RANKING_LIMIT}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <ExportCsvButton
                  label="Bases"
                  filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_bases_ranking.csv`}
                  {...basesRankingRows(rankings.bases ?? [])}
                />
                <ExportCsvButton
                  label="Dispositivos"
                  filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_devices_ranking.csv`}
                  {...segmentRankingRows('Dispositivos', rankings.devices ?? {
                    min_calls_applied: range.minCalls,
                    limit_applied: RANKING_LIMIT,
                    best: [],
                    worst: [],
                  })}
                />
                <ExportCsvButton
                  label="Horas"
                  filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_hours_ranking.csv`}
                  {...segmentRankingRows('Horas', rankings.hours ?? {
                    min_calls_applied: range.minCalls,
                    limit_applied: RANKING_LIMIT,
                    best: [],
                    worst: [],
                  })}
                />
              </div>
            </div>
            {rankings.loading && !rankings.refreshing && (
              <div
                className="h-40 animate-pulse rounded-xl bg-slate-200"
                aria-busy="true"
                aria-label="Cargando rankings"
              />
            )}
            {rankings.error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                No se pudieron cargar los rankings: {rankings.error}
              </p>
            )}
            {(!rankings.loading || rankings.refreshing) && !rankings.error && (
              <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      Bases por intentos
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Las de más intentos primero, entre las bases con al menos{' '}
                      {range.minCalls} llamadas · en verde, la de mejor AA
                    </p>
                  </div>
                  <BasesRankingTable rows={rankings.bases} minCalls={range.minCalls} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      Dispositivos
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Mejores y peores por health score
                    </p>
                  </div>
                  <SegmentRankingTable data={rankings.devices} kind="device" />
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Horas</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Mejores y peores por health score
                    </p>
                  </div>
                  <SegmentRankingTable data={rankings.hours} kind="hour" />
                </div>
              </div>
            )}
          </section>

          <section id="sec-alertas" aria-label="Alertas de patrones" className={`scroll-mt-16 ${dimWhile(patternAlerts.refreshing && !overview.refreshing)}`} aria-busy={patternAlerts.refreshing && !overview.refreshing || undefined}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                  Alertas de patrones
                </h2>
                <p className="text-xs text-slate-500">
                  Combinaciones con Agent Answer muy por debajo del promedio de
                  la campaña · volumen mínimo {range.minCalls} llamadas
                </p>
              </div>
              {patternSummary && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <ExportCsvButton
                    label="Por día"
                    filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_patterns_daily.csv`}
                    {...patternDailyRows(patternSummary.byDay)}
                  />
                  <ExportCsvButton
                    label="Combinaciones"
                    filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_patterns_combos.csv`}
                    {...patternComboRows(patternSummary.topCombos)}
                  />
                </div>
              )}
            </div>
            {patternAlerts.loading && !patternAlerts.refreshing && (
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
            {(!patternAlerts.loading || patternAlerts.refreshing) && !patternAlerts.error && (
              <PatternsPanel
                alerts={patternAlerts.alerts}
                campaign={range.campaign}
              />
            )}
          </section>

          <section id="sec-tendencias" className="grid scroll-mt-16 grid-cols-[minmax(0,1fr)] gap-6">
            <div>
              <DailyTrendChart
                points={overview.daily}
                headerAction={
                  <ExportCsvButton
                    filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_daily.csv`}
                    {...dailyRows(overview.daily)}
                  />
                }
              />
            </div>
            <div>
              <TrunkVolumeChart
                rows={routing.volume}
                headerAction={
                  <ExportCsvButton
                    filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_troncales.csv`}
                    {...trunkVolumeRows(routing.volume)}
                  />
                }
              />
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="mb-1 text-base font-semibold text-slate-900">
                    Gateways del rango
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ordenados por volumen de intentos
                  </p>
                </div>
                <ExportCsvButton
                  filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_gateways.csv`}
                  {...gatewaysRangeRows(overview.devices)}
                />
              </div>
              <GatewaysRangeTable rows={overview.devices} />
            </div>
          </section>

          <section id="sec-horaria" className="grid scroll-mt-16 grid-cols-[minmax(0,1fr)] gap-6">
            <HourlyAggregateChart
              points={overview.hourly}
              headerAction={
                <ExportCsvButton
                  filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_hourly.csv`}
                  {...hourlyRows(overview.hourly)}
                />
              }
            />
            {heatmap.loading && !heatmap.refreshing && (
              <div className="h-48 animate-pulse rounded-xl bg-slate-200" aria-busy="true" aria-label="Cargando mapa de calor" />
            )}
            {heatmap.error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                No se pudo cargar el mapa de calor: {heatmap.error}
              </p>
            )}
            {(!heatmap.loading || heatmap.refreshing) && !heatmap.error && (
              <div className={dimWhile(heatmap.refreshing && !overview.refreshing)}>
                <HourDeviceHeatmap
                  rows={heatmap.data ?? []}
                  headerAction={
                    <ExportCsvButton
                      filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_heatmap.csv`}
                      {...heatmapRows(heatmap.data ?? [])}
                    />
                  }
                />
              </div>
            )}
          </section>
        </div>
      )}

      {!overview.loading && !overview.error && !overview.summary && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {same
            ? isWeek
              ? 'Elegí una semana y presioná «Analizar» para ver la campaña.'
              : 'Elegí un rango y presioná «Analizar» para ver la campaña.'
            : isWeek
              ? 'Sin datos para la semana seleccionada.'
              : 'Sin datos para el rango seleccionado.'}
        </p>
      )}
    </div>
  )
}
