import { useMemo, useState } from 'react'
import { AlertTriangle, Trophy } from 'lucide-react'
import {
  FilterBar,
  type FilterValues,
} from './components/Filters/FilterBar'
import {
  FilterCrossCampaignBar,
  type CrossCampaignValues,
} from './components/Filters/FilterCrossCampaignBar'
import {
  FilterRangeBar,
  type RangeValues,
} from './components/Filters/FilterRangeBar'
import { FilterWeekBar } from './components/Filters/FilterWeekBar'
import { DiagnosticsFeed } from './components/Insights/DiagnosticsFeed'
import { RecommendationsPanel } from './components/Insights/RecommendationsPanel'
import { BasesCompareTable } from './components/dashboard/BasesCompareTable'
import { KpiGrid } from './components/dashboard/KpiGrid'
import { GatewaysTable } from './components/dashboard/GatewaysTable'
import { HourlyTrendChart } from './components/dashboard/HourlyTrendChart'
import { DailyCompareChart } from './components/overview/DailyCompareChart'
import { DailyTrendChart } from './components/overview/DailyTrendChart'
import { GatewaysRangeTable } from './components/overview/GatewaysRangeTable'
import { HourlyAggregateChart } from './components/overview/HourlyAggregateChart'
import { OverviewKpis } from './components/overview/OverviewKpis'
import { useCampaignOverview } from './hooks/useCampaignOverview'
import { useCompareDiagnostics } from './hooks/useCompareDiagnostics'
import { useCrossCampaignCompare } from './hooks/useCrossCampaignCompare'
import { useCrossCampaignDiagnostics } from './hooks/useCrossCampaignDiagnostics'
import { useCrossCampaignRecommendations } from './hooks/useCrossCampaignRecommendations'
import { useHourlyTrend } from './hooks/useHourlyTrend'
import { useRangeDiagnostics } from './hooks/useRangeDiagnostics'
import { useRangeRecommendations } from './hooks/useRangeRecommendations'
import { useRecommendations } from './hooks/useRecommendations'
import {
  buildBestDay,
  buildBestDevice,
  buildBestHour,
  buildReliableTrunk,
  buildWorstDevice,
  buildWorstHour,
  mergePeakWindows,
  rankPositiveDrivers,
} from './lib/rangeDiagnostics'
import {
  composeCrossNegatives,
  composeCrossPositives,
} from './lib/crossDiagnostics'
import {
  basesCompareRows,
  basesRankingRows,
  crossRankingRows,
  dailyCompareRows,
  dailyRows,
  diagnosticRows,
  gatewaysCompareRows,
  gatewaysRangeRows,
  hourlyCompareRows,
  hourlyRows,
  kpiCompareRows,
  kpiRangeRows,
  patternComboRows,
  patternCompareComboRows,
  patternCompareDailyRows,
  patternDailyRows,
  recommendationRows,
  segmentRankingRows,
} from './lib/exporters'
import { ExportCsvButton } from './components/common/ExportCsvButton'
import { PrintButton } from './components/common/PrintButton'
import { BasesRankingTable } from './components/overview/BasesRankingTable'
import { CrossRankingTable } from './components/overview/CrossRankingTable'
import { SegmentRankingTable } from './components/overview/SegmentRankingTable'
import { PatternsPanel } from './components/Insights/PatternsPanel'
import { PatternsComparePanel } from './components/Insights/PatternsComparePanel'
import { useRangeRankings } from './hooks/useRangeRankings'
import { usePatternAlerts } from './hooks/usePatternAlerts'
import { summarizePatterns, comparePatternSummaries } from './lib/patterns'
import { mergeBaseRankings, mergeSegmentRankings } from './lib/rankings'
import { DEFAULT_WEEK, findWeekByStart } from './lib/weeks'
import type {
  DailyTrendPoint,
  DiagnosticEvent,
  DeviceRangeRow,
  HourlyTrendPoint,
  RangeDiagnosticsResponse,
} from './types/api'

type ViewMode = 'range' | 'compare' | 'campaigns' | 'week'

const DEFAULT_MIN_CALLS = 50
const RANKING_LIMIT = 5

const CROSS_START_DATE = '2026-09-01'
const CROSS_END_DATE = '2026-09-15'

const DEFAULT_FILTERS: FilterValues = {
  campaign: '35',
  dateA: '2026-09-01',
  dateB: '2026-09-02',
  minCalls: 50,
}

const DEFAULT_RANGE: RangeValues = {
  campaign: '35',
  from: '2026-09-01',
  to: '2026-09-15',
}

const DEFAULT_CROSS: CrossCampaignValues = {
  campaignA: '35',
  campaignB: '38',
  minCalls: 50,
}

const DEFAULT_WEEK_RANGE: RangeValues = {
  campaign: '35',
  from: DEFAULT_WEEK.start,
  to: DEFAULT_WEEK.end,
}

type RangeVariant = 'range' | 'week'

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

function mapRangeDiagnostics(
  data: RangeDiagnosticsResponse,
  devices: DeviceRangeRow[],
  daily: DailyTrendPoint[],
  hourly: HourlyTrendPoint[],
): {
  rootCauses: DiagnosticEvent[]
  positiveDrivers: DiagnosticEvent[]
} {
  const backendCauses: DiagnosticEvent[] = [
    ...data.congested_gateways.map((gateway) => ({
      severity: 'WARNING' as const,
      type: 'NETWORK_CONGESTION',
      entity: String(gateway.device),
      message: gateway.message,
    })),
    ...data.burn_hours.map((hour) => ({
      severity: 'WARNING' as const,
      type: 'BUSY_HOUR',
      entity: String(hour.hora),
      message: hour.message,
    })),
  ]
  const worstHour = buildWorstHour(hourly)
  const worstDevice = buildWorstDevice(devices)
  const rootCauses = composeCrossNegatives(backendCauses, [
    worstHour,
    worstDevice,
  ])
  const totalCalls = devices.reduce((sum, row) => sum + row.total_calls, 0)
  const trunk = buildReliableTrunk(devices, totalCalls)
  const bestDay = buildBestDay(daily)
  const bestHour = buildBestHour(hourly)
  const bestDevice = buildBestDevice(devices)
  const positiveDrivers = rankPositiveDrivers([
    ...mergePeakWindows(data.peak_hours),
    ...(trunk ? [trunk] : []),
    ...(bestDay ? [bestDay] : []),
    ...(bestHour ? [bestHour] : []),
    ...(bestDevice ? [bestDevice] : []),
  ])
  return { rootCauses, positiveDrivers }
}

function RangeMode({ variant = 'range' }: { variant?: RangeVariant }) {
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

function CompareMode() {
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS)

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
      <FilterBar
        initial={filters}
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

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
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

          <section aria-label="Diagnóstico">
            <div className="mb-3 flex items-center justify-between gap-3">
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

          <section aria-label="Recomendaciones">
            <div className="mb-3 flex items-center justify-between gap-3">
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
            aria-label="Análisis temporal e infraestructura"
            className="grid gap-6 lg:grid-cols-12"
          >
            <div className="lg:col-span-7">
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
            <div className="lg:col-span-5">
              <div className="mb-3 flex items-start justify-between gap-3">
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

function CampaignsCompareMode() {
  const [cross, setCross] = useState<CrossCampaignValues>(DEFAULT_CROSS)

  const params = useMemo(
    () => ({
      campaignA: cross.campaignA,
      campaignB: cross.campaignB,
      startDate: CROSS_START_DATE,
      endDate: CROSS_END_DATE,
      minCalls: cross.minCalls,
    }),
    [cross.campaignA, cross.campaignB, cross.minCalls],
  )

  const { data, loading, error, reload } = useCrossCampaignCompare(params)
  const diagnostics = useCrossCampaignDiagnostics(params)
  const recommendations = useCrossCampaignRecommendations(params)
  const rankingsA = useRangeRankings({
    campaign: cross.campaignA,
    from: CROSS_START_DATE,
    to: CROSS_END_DATE,
    minCalls: cross.minCalls,
    limit: RANKING_LIMIT,
  })
  const rankingsB = useRangeRankings({
    campaign: cross.campaignB,
    from: CROSS_START_DATE,
    to: CROSS_END_DATE,
    minCalls: cross.minCalls,
    limit: RANKING_LIMIT,
  })
  const patternAlerts = usePatternAlerts({
    from: CROSS_START_DATE,
    to: CROSS_END_DATE,
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
      <FilterCrossCampaignBar
        initial={cross}
        startDate={CROSS_START_DATE}
        endDate={CROSS_END_DATE}
        onCompare={(values) => {
          const same =
            values.campaignA === cross.campaignA &&
            values.campaignB === cross.campaignB &&
            values.minCalls === cross.minCalls
          setCross(values)
          if (same) {
            reloadAll()
          }
        }}
      />

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

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
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

          <section aria-label="Diagnóstico entre campañas">
            <div className="mb-3 flex items-center justify-between gap-3">
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

          <section aria-label="Recomendaciones entre campañas">
            <div className="mb-3 flex items-center justify-between gap-3">
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

          <section aria-label="Rankings comparados">
            <div className="mb-3 flex items-start justify-between gap-3">
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
              <div className="grid items-start gap-8">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      Bases por AA %
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Unión de bases de ambas campañas con intentos y tasa
                      (faltantes → —)
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

          <section aria-label="Alertas de patrones comparadas">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                  <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
                  Alertas de patrones
                </h2>
                <p className="text-xs text-slate-500">
                  Combinaciones que cayeron bajo el umbral de Agent Answer (5%) en
                  cada campaña
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
            aria-label="Análisis temporal e infraestructura"
            className="grid gap-6 lg:grid-cols-12"
          >
            <div className="lg:col-span-7">
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
            <div className="lg:col-span-5">
              <div className="mb-3 flex items-start justify-between gap-3">
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

          <section aria-label="Bases comparadas">
            <div className="mb-3 flex items-start justify-between gap-3">
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

          <section>
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

function App() {
  const [mode, setMode] = useState<ViewMode>('range')

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

      {mode === 'range' && <RangeMode />}
      {mode === 'compare' && <CompareMode />}
      {mode === 'campaigns' && <CampaignsCompareMode />}
      {mode === 'week' && <RangeMode variant="week" />}
    </div>
  )
}

export default App
