import { useMemo, useState } from 'react'
import { AlertTriangle, Trophy } from 'lucide-react'
import { ExportCsvButton } from '../components/common/ExportCsvButton'
import { PrintButton } from '../components/common/PrintButton'
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
import { HourlyAggregateChart } from '../components/overview/HourlyAggregateChart'
import { OverviewKpis } from '../components/overview/OverviewKpis'
import { SegmentRankingTable } from '../components/overview/SegmentRankingTable'
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
  hourlyRows,
  kpiRangeRows,
  patternComboRows,
  patternDailyRows,
  recommendationRows,
  segmentRankingRows,
} from '../lib/exporters'
import { summarizePatterns } from '../lib/patterns'
import { mapRangeDiagnostics } from '../lib/rangeDiagnostics'
import { findWeekByStart } from '../lib/weeks'
import {
  DEFAULT_MIN_CALLS,
  DEFAULT_RANGE,
  DEFAULT_WEEK_RANGE,
  RANKING_LIMIT,
} from './defaults'

export type RangeVariant = 'range' | 'week'

export function RangeMode({ variant = 'range' }: { variant?: RangeVariant }) {
  const isWeek = variant === 'week'
  const [range, setRange] = useState<RangeValues>(
    isWeek ? DEFAULT_WEEK_RANGE : DEFAULT_RANGE,
  )

  const params = useMemo(
    () => ({ campaign: range.campaign, from: range.from, to: range.to }),
    [range.campaign, range.from, range.to],
  )

  const overview = useCampaignOverview(params)
  const diagnostics = useRangeDiagnostics({ ...params, minCalls: DEFAULT_MIN_CALLS })
  const recommendations = useRangeRecommendations({
    ...params,
    minCalls: DEFAULT_MIN_CALLS,
  })
  const rankings = useRangeRankings({
    ...params,
    minCalls: DEFAULT_MIN_CALLS,
    limit: RANKING_LIMIT,
  })
  const patternAlerts = usePatternAlerts(params)

  const defaultRange = isWeek ? DEFAULT_WEEK_RANGE : DEFAULT_RANGE
  const same =
    range.campaign === defaultRange.campaign &&
    range.from === defaultRange.from &&
    range.to === defaultRange.to
  const filePrefix = isWeek ? 'semana' : 'rango'
  const week = isWeek ? findWeekByStart(range.from) : null

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
      {isWeek ? (
        <FilterWeekBar
          initial={{ campaign: range.campaign, weekStart: range.from }}
          onApply={(values) => {
            const unchanged =
              values.campaign === range.campaign &&
              values.from === range.from &&
              values.to === range.to
            setRange(values)
            if (unchanged) {
              reloadRange()
            }
          }}
        />
      ) : (
        <FilterRangeBar
          initial={range}
          onApply={(values) => {
            const unchanged =
              values.campaign === range.campaign &&
              values.from === range.from &&
              values.to === range.to
            setRange(values)
            if (unchanged) {
              reloadRange()
            }
          }}
        />
      )}

      {overview.loading && (
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

      {!overview.loading && !overview.error && overview.summary && (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              {overview.summary.campaign} · {range.from} → {range.to}
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
            </p>
            <PrintButton />
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
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

          <section aria-label="Diagnóstico del rango">
            <div className="mb-3 flex items-center justify-between gap-3">
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
            {diagnostics.loading && (
              <div className="h-40 animate-pulse rounded-xl bg-slate-200" aria-busy="true" aria-label="Cargando diagnóstico" />
            )}
            {diagnostics.error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                No se pudo cargar el diagnóstico: {diagnostics.error}
              </p>
            )}
            {!diagnostics.loading && !diagnostics.error && rangeDiag && (
              <DiagnosticsFeed
                rootCauses={rangeDiag.rootCauses}
                positiveDrivers={rangeDiag.positiveDrivers}
                positiveTitle="Puntos destacados"
                positiveDescription="Fortalezas y señales positivas del período"
              />
            )}
          </section>

          <section aria-label="Recomendaciones del rango">
            <div className="mb-3 flex items-center justify-between gap-3">
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
            {recommendations.loading && (
              <div className="h-32 animate-pulse rounded-xl bg-slate-200" aria-busy="true" aria-label="Cargando recomendaciones" />
            )}
            {recommendations.error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                No se pudieron cargar las recomendaciones: {recommendations.error}
              </p>
            )}
            {!recommendations.loading && !recommendations.error && (
              <RecommendationsPanel
                recommendations={recommendations.data?.recommendations ?? []}
              />
            )}
          </section>

          <section aria-label="Rankings del rango">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Trophy className="h-4 w-4 text-indigo-600" aria-hidden />
                  Rankings del rango
                </h2>
                <p className="text-xs text-slate-500">
                  Mejores y peores segmentos por health score · volumen mínimo{' '}
                  {rankings.devices?.min_calls_applied ?? DEFAULT_MIN_CALLS} llamadas · top{' '}
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
                    min_calls_applied: DEFAULT_MIN_CALLS,
                    limit_applied: RANKING_LIMIT,
                    best: [],
                    worst: [],
                  })}
                />
                <ExportCsvButton
                  label="Horas"
                  filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_hours_ranking.csv`}
                  {...segmentRankingRows('Horas', rankings.hours ?? {
                    min_calls_applied: DEFAULT_MIN_CALLS,
                    limit_applied: RANKING_LIMIT,
                    best: [],
                    worst: [],
                  })}
                />
              </div>
            </div>
            {rankings.loading && (
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
            {!rankings.loading && !rankings.error && (
              <div className="grid items-start gap-8">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      Bases por AA %
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Todas las bases ordenadas por Agent Answer
                    </p>
                  </div>
                  <BasesRankingTable rows={rankings.bases} />
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

          <section aria-label="Alertas de patrones">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                  Alertas de patrones
                </h2>
                <p className="text-xs text-slate-500">
                  Combinaciones que cayeron bajo el umbral de Agent Answer (5%)
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
              <PatternsPanel
                alerts={patternAlerts.alerts}
                campaign={range.campaign}
              />
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
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
            <div className="lg:col-span-5">
              <div className="mb-3 flex items-start justify-between gap-3">
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

          <section>
            <HourlyAggregateChart
              points={overview.hourly}
              headerAction={
                <ExportCsvButton
                  filename={`${filePrefix}_${range.campaign}_${range.from}_${range.to}_hourly.csv`}
                  {...hourlyRows(overview.hourly)}
                />
              }
            />
          </section>
        </>
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
