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
  start_date_b: string
  end_date_b: string
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
  start_date_b: string
  end_date_b: string
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
  start_date_b: string
  end_date_b: string
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
  // Spec 051: agent_answers / (total_calls − machine_answers).
  attendable_answer_rate: number | null
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
  attendable_answer_rate: number | null
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
  // false when the base is below the minimum volume (missing = ranked)
  ranked?: boolean
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
  ranked?: boolean
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

export interface RoutingChange {
  type: string
  severity: Severity
  date: string
  entity: string
  message: string
}

export interface RoutingResponse {
  days: Array<{
    fecha: string
    total_calls: number
    top_device: string
    top_share: number
    active_trunks: number
    concentrated: boolean
  }>
  changes: RoutingChange[]
  volume: TrunkVolumeRow[]
}

export interface TrunkVolumeRow {
  fecha: string
  device: string
  total_calls: number
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

// Spec 054: thresholds from backend/config.py, for the methodology modal.
export interface Methodology {
  segments: Record<string, string>
  health: { busy_weight: number; congestion_weight: number }
  diagnostics: {
    base_drop_warning: number
    base_drop_critical: number
    base_improvement_info: number
    base_improvement_success: number
    mix_share: number
    congestion_delta: number
    congestion_critical: number
    congestion_recovery_info: number
    congestion_recovery_success: number
    root_causes_limit: number
  }
  range_diagnostics: { congestion: number; busy: number; peak: number }
  recommendations: { volume_drop_pct: number; amd_ratio: number; min_volume_share: number; limit: number }
  patterns: { relative_factor: number; min_calls: number }
  routing: { concentration_share: number; active_share: number; min_day_calls: number; amd_note_share: number }
}

// Spec 058: GET /api/campaigns/{c}/heatmap.
export interface HourDeviceRow {
  device: string
  hora: number
  total_calls: number
  agent_answers: number
  machine_answers: number
}
