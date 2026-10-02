"""Spec 054: /api/methodology mirrors backend/config.py."""
import config
from test_api import client, memory_conn  # noqa: F401  (fixtures)


def test_methodology_returns_config_values(client):  # noqa: F811
    data = client.get("/api/methodology").json()

    assert data["segments"] == config.CAMPAIGN_SEGMENTS
    assert data["health"] == {
        "busy_weight": config.HEALTH_WEIGHT_BUSY,
        "congestion_weight": config.HEALTH_WEIGHT_CONGESTION,
    }
    assert data["diagnostics"]["base_drop_critical"] == config.DIAG_BASE_DROP_THRESHOLD
    assert data["diagnostics"]["base_drop_warning"] == config.DIAG_BASE_DROP_WARNING
    assert data["diagnostics"]["congestion_recovery_success"] == config.DIAG_CONGESTION_RECOVERY_SUCCESS
    assert data["diagnostics"]["root_causes_limit"] == config.ROOT_CAUSES_LIMIT
    assert data["range_diagnostics"] == {
        "congestion": config.DIAG_CONGESTION_THRESHOLD,
        "busy": config.DIAG_BUSY_THRESHOLD,
        "peak": config.DIAG_PEAK_THRESHOLD,
    }
    assert data["recommendations"]["amd_ratio"] == config.REC_AMD_RATIO
    assert data["patterns"] == {
        "relative_factor": config.PATTERN_RELATIVE_FACTOR,
        "min_calls": config.PATTERN_MIN_CALLS,
    }
    assert data["routing"]["concentration_share"] == config.ROUTING_CONCENTRATION_SHARE


def test_methodology_follows_config_changes(client, monkeypatch):  # noqa: F811
    monkeypatch.setattr(config, "PATTERN_RELATIVE_FACTOR", 0.7)
    assert client.get("/api/methodology").json()["patterns"]["relative_factor"] == 0.7
