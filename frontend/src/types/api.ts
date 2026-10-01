export type Severity = 'CRITICAL' | 'WARNING' | 'SUCCESS' | 'INFO'

export interface DiagnosticEvent {
  severity: Severity
  type: string
  entity: string
  message: string
}

export interface SummaryKpi {
  total_calls_a: number
  total_calls_b: number
  delta_total_pct: number | null
  agent_answer_rate_a: number | null
  agent_answer_rate_b: number | null
  delta_rate: number | null
  delta_percentage: number | null
  busy_rate_a: number | null
  busy_rate_b: number | null
  congestion_rate_a: number | null
  congestion_rate_b: number | null
  congestion_rate: number | null
  health_score: number | null
}

export interface BaseComparison {
  base: string
  total_calls_a: number
  total_calls_b: number
  agent_answer_rate_a: number | null
  agent_answer_rate_b: number | null
  delta_rate: number | null
  share_a: number | null
  share_b: number | null
  share_delta: number | null
  relative_change_pct: number | null
}

export interface GatewayComparison {
  device: string
  congestion_rate_a: number | null
  congestion_rate_b: number | null
  delta_congestion: number | null
}

export interface HourlyTrendPoint {
  hora: number
  total_calls: number
  agent_answers: number
  machine_answers: number
  agent_answer_rate: number | null
}

export interface CompareDiagnosticsResponse {
  campaign: string
  date_a: string
  date_b: string
  min_calls_applied: number
  summary: SummaryKpi | null
  root_causes: DiagnosticEvent[]
  positive_drivers: DiagnosticEvent[]
  insights: Array<DiagnosticEvent & { polarity: 'POSITIVE' | 'NEGATIVE' }>
  bases_comparison: BaseComparison[] | null
  gateways_comparison: GatewayComparison[] | null
}

export interface CrossCampaignCompareResponse {
  campaign_a: string
  campaign_b: string
  start_date: string
  end_date: string
  min_calls_applied: number
  summary: SummaryKpi | null
  gateways_comparison: GatewayComparison[] | null
  bases_comparison: BaseComparison[] | null
  hourly_a: HourlyTrendPoint[]
  hourly_b: HourlyTrendPoint[]
  daily_a: DailyTrendPoint[]
  daily_b: DailyTrendPoint[]
  devices_a: DeviceRangeRow[]
  devices_b: DeviceRangeRow[]
}

export interface CrossCampaignDiagnosticsResponse {
  campaign_a: string
  campaign_b: string
  start_date: string
  end_date: string
  min_calls_applied: number
  summary: SummaryKpi | null
  root_causes: DiagnosticEvent[]
  positive_drivers: DiagnosticEvent[]
  insights: Array<DiagnosticEvent & { polarity: 'POSITIVE' | 'NEGATIVE' }>
  bases_comparison: BaseComparison[] | null
  gateways_comparison: GatewayComparison[] | null
}

export interface Recommendation {
  id: string
  type: string
  category: Severity
  entity: string
  text: string
  excluded_amd?: string[]
}

export interface RecommendationsResponse {
  campaign: string
  date_a: string
  date_b: string
  min_calls_applied: number
  recommendations: Recommendation[]
}

export interface CrossCampaignRecommendationsResponse {
  campaign_a: string
  campaign_b: string
  start_date: string
  end_date: string
  min_calls_applied: number
  recommendations: Recommendation[]
}

export interface CampaignSummary {
  campaign: string
  total_calls: number
  agent_answers: number
  machine_answers: number
  rejected_calls: number
  agent_answer_rate: number | null
}

export interface DailyTrendPoint {
  fecha: string
  total_calls: number
  agent_answers: number
  machine_answers: number
  agent_answer_rate: number | null
}

export interface DeviceRangeRow {
  device: string
  total_calls: number
  agent_answers: number
  machine_answers: number
  busy_calls: number
  congestion_calls: number
  agent_answer_rate: number | null
  busy_rate: number | null
  congestion_rate: number | null
}

export interface RangeRecommendationsResponse {
  campaign: string
  start_date: string
  end_date: string
  min_calls_applied: number
  recommendations: Recommendation[]
}

export interface CongestedGateway {
  device: string
  total_calls: number
  congestion_rate: number | null
  health_score: number | null
  message: string
}

export interface BusyHour {
  hora: number
  total_calls: number
  busy_rate: number | null
  health_score: number | null
  message: string
}

export interface PeakHour {
  hora: number
  total_calls: number
  agent_answer_rate: number | null
  health_score: number | null
  message: string
}

export interface RangeDiagnosticsResponse {
  min_calls_applied: number
  congested_gateways: CongestedGateway[]
  burn_hours: BusyHour[]
  peak_hours: PeakHour[]
}

export interface BaseRankingRow {
  base: string
  agent_answer_rate: number | null
  total_calls: number
}

export interface SegmentRankingItem {
  total_calls: number
  agent_answer_rate: number | null
  busy_rate: number | null
  congestion_rate: number | null
  health_score: number | null
  device?: string
  hora?: number
}

export interface SegmentRankingResponse {
  min_calls_applied: number
  limit_applied: number
  best: SegmentRankingItem[]
  worst: SegmentRankingItem[]
}

export interface CrossRankingRow {
  key: string
  rateA: number | null
  rateB: number | null
  delta: number | null
  healthA: number | null
  healthB: number | null
  attemptsA: number | null
  attemptsB: number | null
}

export interface CampaignCatalogEntry {
  campaign: string
  segment: string
  first_day: string
  last_day: string
  days: number
  total_calls: number
  dates: string[]
}

export interface PatternAlert {
  fecha: string
  hora: number
  campaign: string
  base: string
  device: string
  agent_answer_rate: number | null
  total_calls?: number
  campaign_rate?: number
  threshold_rate?: number
  pattern_alert: boolean
}
