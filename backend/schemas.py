"""Spec 061: response models of every endpoint (validated contracts).

`extra="forbid"`: a field the endpoint returns but the model does not declare
fails loudly in the tests instead of being dropped silently from the JSON.
Rates are `float | None`: None when there are no calls to divide by.
"""
from pydantic import BaseModel, ConfigDict


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


Rate = float | None


# --- Catalog and range series ---------------------------------------------

class CatalogEntry(ApiModel):
    campaign: str
    segment: str
    first_day: str
    last_day: str
    days: int
    total_calls: int
    dates: list[str]


class Summary(ApiModel):
    campaign: str
    total_calls: int
    agent_answers: int
    machine_answers: int
    rejected_calls: int
    agent_answer_rate: Rate
    attendable_answer_rate: Rate


class DailyPoint(ApiModel):
    fecha: str
    total_calls: int
    agent_answers: int
    machine_answers: int
    agent_answer_rate: Rate


class HourlyPoint(ApiModel):
    hora: int
    total_calls: int
    agent_answers: int
    machine_answers: int
    agent_answer_rate: Rate


class DeviceRow(ApiModel):
    device: str
    total_calls: int
    agent_answers: int
    machine_answers: int
    busy_calls: int
    congestion_calls: int
    agent_answer_rate: Rate
    attendable_answer_rate: Rate
    busy_rate: Rate
    congestion_rate: Rate


class HourDeviceRow(ApiModel):
    device: str
    hora: int
    total_calls: int
    agent_answers: int
    machine_answers: int


class BaseRankingRow(ApiModel):
    base: str
    total_calls: int
    agent_answer_rate: Rate
    ranked: bool


class DeviceRankingItem(ApiModel):
    device: str
    total_calls: int
    agent_answer_rate: Rate
    busy_rate: Rate
    congestion_rate: Rate
    health_score: float | None


class HourRankingItem(ApiModel):
    hora: int
    total_calls: int
    agent_answer_rate: Rate
    busy_rate: Rate
    congestion_rate: Rate
    health_score: float | None


class DeviceRanking(ApiModel):
    min_calls_applied: int
    limit_applied: int
    best: list[DeviceRankingItem]
    worst: list[DeviceRankingItem]


class HourRanking(ApiModel):
    min_calls_applied: int
    limit_applied: int
    best: list[HourRankingItem]
    worst: list[HourRankingItem]


# --- Routing (Spec 044 / 046) ----------------------------------------------

class RoutingDay(ApiModel):
    fecha: str
    total_calls: int
    top_device: str
    top_share: float
    active_trunks: int
    concentrated: bool


class RoutingChange(ApiModel):
    type: str
    severity: str
    date: str
    entity: str
    message: str


class TrunkVolumeRow(ApiModel):
    fecha: str
    device: str
    total_calls: int


class Routing(ApiModel):
    days: list[RoutingDay]
    changes: list[RoutingChange]
    volume: list[TrunkVolumeRow]


# --- Range diagnostics ------------------------------------------------------

class CongestedGateway(ApiModel):
    device: str
    total_calls: int
    congestion_rate: Rate
    health_score: float | None
    message: str


class BurnHour(ApiModel):
    hora: int
    total_calls: int
    busy_rate: Rate
    health_score: float | None
    message: str


class PeakHour(ApiModel):
    hora: int
    total_calls: int
    agent_answer_rate: Rate
    health_score: float | None
    message: str


class RangeDiagnostics(ApiModel):
    min_calls_applied: int
    congested_gateways: list[CongestedGateway]
    burn_hours: list[BurnHour]
    peak_hours: list[PeakHour]


# --- A vs B comparisons -----------------------------------------------------

class CompareSummary(ApiModel):
    total_calls_a: int
    total_calls_b: int
    delta_total_pct: float | None
    agent_answer_rate_a: Rate
    agent_answer_rate_b: Rate
    delta_rate: float | None
    delta_percentage: float | None
    busy_rate_a: Rate
    busy_rate_b: Rate
    congestion_rate_a: Rate
    congestion_rate_b: Rate
    congestion_rate: Rate
    health_score: float | None


class BaseComparison(ApiModel):
    base: str
    total_calls_a: int
    total_calls_b: int
    agent_answer_rate_a: Rate
    agent_answer_rate_b: Rate
    delta_rate: float | None
    share_a: float | None
    share_b: float | None
    share_delta: float | None
    relative_change_pct: float | None


class GatewayComparison(ApiModel):
    device: str
    congestion_rate_a: Rate
    congestion_rate_b: Rate
    delta_congestion: float | None


class DiagnosticEvent(ApiModel):
    severity: str
    type: str
    entity: str
    message: str


class Insight(DiagnosticEvent):
    polarity: str


class CompareDiagnostics(ApiModel):
    campaign: str
    date_a: str
    date_b: str
    min_calls_applied: int
    summary: CompareSummary | None
    root_causes: list[DiagnosticEvent]
    positive_drivers: list[DiagnosticEvent]
    insights: list[Insight]
    bases_comparison: list[BaseComparison] | None
    gateways_comparison: list[GatewayComparison] | None


class DayMetrics(ApiModel):
    fecha: str
    total_calls: int
    agent_answers: int
    machine_answers: int
    rejected_calls: int
    agent_answer_rate: Rate


class DayDeltas(ApiModel):
    total_calls: float | None
    agent_answers: float | None
    machine_answers: float | None
    rejected_calls: float | None
    agent_answer_rate: float | None


class DaysCompare(ApiModel):
    campaign: str
    date_a: DayMetrics | None
    date_b: DayMetrics | None
    deltas: DayDeltas | None


class CrossCompare(ApiModel):
    campaign_a: str
    campaign_b: str
    start_date: str
    end_date: str
    start_date_b: str
    end_date_b: str
    min_calls_applied: int
    summary: CompareSummary | None
    gateways_comparison: list[GatewayComparison] | None
    bases_comparison: list[BaseComparison] | None
    hourly_a: list[HourlyPoint]
    hourly_b: list[HourlyPoint]
    daily_a: list[DailyPoint]
    daily_b: list[DailyPoint]
    devices_a: list[DeviceRow]
    devices_b: list[DeviceRow]


class CrossDiagnostics(ApiModel):
    campaign_a: str
    campaign_b: str
    start_date: str
    end_date: str
    start_date_b: str
    end_date_b: str
    min_calls_applied: int
    summary: CompareSummary | None
    root_causes: list[DiagnosticEvent]
    positive_drivers: list[DiagnosticEvent]
    insights: list[Insight]
    bases_comparison: list[BaseComparison] | None
    gateways_comparison: list[GatewayComparison] | None


# --- Recommendations --------------------------------------------------------

class Recommendation(ApiModel):
    id: str
    type: str
    category: str
    entity: str
    text: str
    # Only on routing recommendations: trunks left out for answering machines.
    # Routes use response_model_exclude_unset so other items keep no such key.
    excluded_amd: list[str] | None = None


class CompareRecommendations(ApiModel):
    campaign: str
    date_a: str
    date_b: str
    min_calls_applied: int
    recommendations: list[Recommendation]


class RangeRecommendations(ApiModel):
    campaign: str
    start_date: str
    end_date: str
    min_calls_applied: int
    recommendations: list[Recommendation]


class CrossRecommendations(ApiModel):
    campaign_a: str
    campaign_b: str
    start_date: str
    end_date: str
    start_date_b: str
    end_date_b: str
    min_calls_applied: int
    recommendations: list[Recommendation]


# --- Patterns, raw metrics, methodology --------------------------------------

class PatternAlert(ApiModel):
    fecha: str
    hora: int
    campaign: str
    base: str
    device: str
    total_calls: int
    agent_answer_rate: float
    campaign_rate: float
    threshold_rate: float
    pattern_alert: bool


class MetricRow(ApiModel):
    fecha: str
    hora: int
    campaign: str
    base: str
    device: str
    total_calls: int
    agent_answers: int
    machine_answers: int
    busy_calls: int
    congestion_calls: int
    avg_wait_time_sec: float | None
    avg_abandon_time_sec: float | None


class MethodologyHealth(ApiModel):
    busy_weight: float
    congestion_weight: float


class MethodologyDiagnostics(ApiModel):
    base_drop_warning: float
    base_drop_critical: float
    base_improvement_info: float
    base_improvement_success: float
    mix_share: float
    congestion_delta: float
    congestion_critical: float
    congestion_recovery_info: float
    congestion_recovery_success: float
    root_causes_limit: int


class MethodologyRangeDiagnostics(ApiModel):
    congestion: float
    busy: float
    peak: float


class MethodologyRecommendations(ApiModel):
    volume_drop_pct: float
    amd_ratio: float
    min_volume_share: float
    limit: int


class MethodologyPatterns(ApiModel):
    relative_factor: float
    min_calls: int


class MethodologyRouting(ApiModel):
    concentration_share: float
    active_share: float
    min_day_calls: int
    amd_note_share: float


class Methodology(ApiModel):
    segments: dict[str, str]
    health: MethodologyHealth
    diagnostics: MethodologyDiagnostics
    range_diagnostics: MethodologyRangeDiagnostics
    recommendations: MethodologyRecommendations
    patterns: MethodologyPatterns
    routing: MethodologyRouting
