"""Spec 054: the thresholds the dashboard applies, read straight from config,
so the «¿Cómo se calcula?» modal never drifts from the real rules."""
from fastapi import APIRouter

import config

router = APIRouter(prefix="/api", tags=["methodology"])


@router.get("/methodology")
def methodology() -> dict:
    return {
        "segments": dict(config.CAMPAIGN_SEGMENTS),
        "health": {
            "busy_weight": config.HEALTH_WEIGHT_BUSY,
            "congestion_weight": config.HEALTH_WEIGHT_CONGESTION,
        },
        "diagnostics": {
            "base_drop_warning": config.DIAG_BASE_DROP_WARNING,
            "base_drop_critical": config.DIAG_BASE_DROP_THRESHOLD,
            "base_improvement_info": config.DIAG_BASE_IMPROVEMENT_WARNING,
            "base_improvement_success": config.DIAG_BASE_IMPROVEMENT_SUCCESS,
            "mix_share": config.DIAG_MIX_SHARE_THRESHOLD,
            "congestion_delta": config.DIAG_CONGESTION_DELTA_THRESHOLD,
            "congestion_critical": config.DIAG_CONGESTION_CRITICAL,
            "congestion_recovery_info": config.DIAG_CONGESTION_RECOVERY_WARNING,
            "congestion_recovery_success": config.DIAG_CONGESTION_RECOVERY_SUCCESS,
            "root_causes_limit": config.ROOT_CAUSES_LIMIT,
        },
        "range_diagnostics": {
            "congestion": config.DIAG_CONGESTION_THRESHOLD,
            "busy": config.DIAG_BUSY_THRESHOLD,
            "peak": config.DIAG_PEAK_THRESHOLD,
        },
        "recommendations": {
            "volume_drop_pct": config.REC_VOLUME_DROP_PCT,
            "amd_ratio": config.REC_AMD_RATIO,
            "min_volume_share": config.REC_MIN_VOLUME_SHARE,
            "limit": config.RECOMMENDATIONS_LIMIT,
        },
        "patterns": {
            "relative_factor": config.PATTERN_RELATIVE_FACTOR,
            "min_calls": config.PATTERN_MIN_CALLS,
        },
        "routing": {
            "concentration_share": config.ROUTING_CONCENTRATION_SHARE,
            "active_share": config.ROUTING_ACTIVE_SHARE,
            "min_day_calls": config.ROUTING_MIN_DAY_CALLS,
            "amd_note_share": config.ROUTING_AMD_NOTE_SHARE,
        },
    }
