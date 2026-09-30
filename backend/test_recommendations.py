from config import RECOMMENDATIONS_LIMIT
from services.recommendations_engine import build_recommendations


def _device(
    device="GW1",
    total_calls=200,
    agent_answers=30,
    machine_answers=10,
    busy_calls=20,
    congestion_calls=5,
):
    rate = None
    denom = total_calls
    if denom > 0:
        rate = agent_answers / denom
    return {
        "device": device,
        "total_calls": total_calls,
        "agent_answers": agent_answers,
        "machine_answers": machine_answers,
        "busy_calls": busy_calls,
        "congestion_calls": congestion_calls,
        "agent_answer_rate": rate,
        "busy_rate": busy_calls / total_calls if total_calls else None,
        "congestion_rate": congestion_calls / total_calls if total_calls else None,
    }


def _hour(hora, total_calls=100, agent_answers=10):
    return {
        "hora": hora,
        "total_calls": total_calls,
        "agent_answers": agent_answers,
        "machine_answers": 5,
        "agent_answer_rate": None,
    }


def _types(items):
    return [i["type"] for i in items]


def _by_type(items, rec_type):
    return next(i for i in items if i["type"] == rec_type)


def test_routing_picks_best_aa_rate():
    devices = [
        _device("GWLOW", agent_answers=10, machine_answers=0),
        _device("GWHIGH", agent_answers=50, machine_answers=0),
    ]
    result = build_recommendations(
        {"agent_answers": 100},
        {"agent_answers": 100},
        devices,
        None,
        min_calls=50,
        campaign_name="35",
    )
    routing = _by_type(result, "ROUTING")
    assert routing["entity"] == "GWHIGH"
    assert routing["category"] == "SUCCESS"
    assert "Answer Agent" in routing["text"]


def test_routing_excludes_device_below_min_volume_share():
    devices = [
        _device("GWBIG", total_calls=9000, agent_answers=90),
        _device("GWSMALL", total_calls=500, agent_answers=90),
    ]
    result = build_recommendations(None, None, devices, None, 50, "35")
    routing = _by_type(result, "ROUTING")
    assert routing["entity"] == "GWBIG"


def test_routing_absent_when_no_device_reaches_share():
    devices = [
        _device(f"GW{i:02d}", total_calls=100, agent_answers=10)
        for i in range(12)
    ]
    result = build_recommendations(None, None, devices, None, 50, "35")
    assert "ROUTING" not in _types(result)


def test_routing_absent_without_candidates():
    result = build_recommendations(None, None, [], None, 50, "35")
    assert result == []


def test_routing_excludes_amd_device_picks_second():
    devices = [
        _device("GWAMD", total_calls=5000, agent_answers=350, machine_answers=1400),
        _device("GWOK", total_calls=4000, agent_answers=240, machine_answers=100),
    ]
    result = build_recommendations(None, None, devices, None, 50, "35")
    routing = _by_type(result, "ROUTING")
    assert routing["entity"] == "GWOK"
    amd = _by_type(result, "AMD_DIVERGENCE")
    assert amd["entity"] == "GWAMD"


def test_routing_absent_when_only_amd_candidate_has_share():
    devices = [
        _device("GWAMD", total_calls=9000, agent_answers=100, machine_answers=400),
        _device("GWSMALL", total_calls=200, agent_answers=90, machine_answers=0),
    ]
    result = build_recommendations(None, None, devices, None, 50, "35")
    assert "ROUTING" not in _types(result)
    assert "AMD_DIVERGENCE" in _types(result)


def test_routing_excludes_amd_even_without_emitted_amd_rec():
    devices = [
        _device("GWSEVERE", total_calls=200, agent_answers=5, machine_answers=50),
        _device("GWMILD", total_calls=5000, agent_answers=250, machine_answers=1000),
        _device("GWSANE", total_calls=4000, agent_answers=160, machine_answers=0),
    ]
    result = build_recommendations(None, None, devices, None, 50, "35")
    amd_items = [i for i in result if i["type"] == "AMD_DIVERGENCE"]
    assert len(amd_items) == 1
    assert amd_items[0]["entity"] == "GWSEVERE"
    routing = _by_type(result, "ROUTING")
    assert routing["entity"] == "GWSANE"


def test_routing_reports_excluded_amd_with_share():
    devices = [
        _device("GWAMD", total_calls=5000, agent_answers=350, machine_answers=1400),
        _device("GWOK", total_calls=4000, agent_answers=240, machine_answers=100),
    ]
    result = build_recommendations(None, None, devices, None, 50, "35")
    routing = _by_type(result, "ROUTING")
    assert routing["entity"] == "GWOK"
    assert routing["excluded_amd"] == ["GWAMD"]


def test_routing_omits_excluded_amd_key_when_none():
    devices = [
        _device("GWLOW", agent_answers=10, machine_answers=0),
        _device("GWHIGH", agent_answers=50, machine_answers=0),
    ]
    result = build_recommendations(None, None, devices, None, 50, "35")
    routing = _by_type(result, "ROUTING")
    assert "excluded_amd" not in routing


def test_routing_excluded_amd_ignores_device_below_share():
    devices = [
        _device("GWAMDSMALL", total_calls=300, agent_answers=5, machine_answers=50),
        _device("GWBIG", total_calls=9000, agent_answers=90, machine_answers=0),
        _device("GWMID", total_calls=700, agent_answers=70, machine_answers=0),
    ]
    result = build_recommendations(None, None, devices, None, 50, "35")
    routing = _by_type(result, "ROUTING")
    assert routing["entity"] == "GWBIG"
    assert "excluded_amd" not in routing


def test_pacing_fires_on_high_busy():
    devices = [_device("GWBUSY", busy_calls=100, total_calls=200)]
    result = build_recommendations(
        None, None, devices, None, min_calls=50, campaign_name="35"
    )
    pacing = _by_type(result, "PACING")
    assert pacing["category"] == "WARNING"
    assert pacing["entity"] == "GWBUSY"
    assert "línea ocupada" in pacing["text"]


def test_pacing_absent_below_threshold():
    devices = [_device("GWOK", busy_calls=10, total_calls=200)]
    result = build_recommendations(
        None, None, devices, None, min_calls=50, campaign_name="35"
    )
    assert "PACING" not in _types(result)


def test_pacing_picks_worst_busy_rate():
    devices = [
        _device("GWA", busy_calls=80, total_calls=200),
        _device("GWB", busy_calls=150, total_calls=200),
    ]
    result = build_recommendations(
        None, None, devices, None, min_calls=50, campaign_name="35"
    )
    assert _by_type(result, "PACING")["entity"] == "GWB"


def test_peak_hour_uses_agent_answers_and_neighbors():
    hourly = [
        _hour(9, agent_answers=5),
        _hour(10, agent_answers=90),
        _hour(11, agent_answers=40),
        _hour(15, agent_answers=1),
    ]
    result = build_recommendations(
        None, None, None, hourly, min_calls=50, campaign_name="35"
    )
    peak = _by_type(result, "SCHEDULE")
    assert peak["entity"] == "10"
    assert peak["category"] == "SUCCESS"
    assert "vecinas: 9h, 11h" in peak["text"]
    assert "15h" not in peak["text"]


def test_peak_hour_respects_min_calls():
    hourly = [_hour(10, total_calls=10, agent_answers=90)]
    result = build_recommendations(
        None, None, None, hourly, min_calls=50, campaign_name="35"
    )
    assert "SCHEDULE" not in _types(result)


def test_amd_fires_when_machines_meet_ratio():
    devices = [_device("GWAMD", agent_answers=10, machine_answers=40)]
    result = build_recommendations(
        None, None, devices, None, min_calls=50, campaign_name="35"
    )
    amd = _by_type(result, "AMD_DIVERGENCE")
    assert amd["category"] == "WARNING"
    assert amd["entity"] == "GWAMD"
    assert amd["id"] == "rec_amd_divergence_gwamd"


def test_amd_fires_when_zero_agents_with_machines():
    devices = [_device("GWZERO", agent_answers=0, machine_answers=50)]
    result = build_recommendations(
        None, None, devices, None, min_calls=50, campaign_name="35"
    )
    assert "AMD_DIVERGENCE" in _types(result)


def test_amd_absent_when_no_traffic():
    devices = [_device("GWEMPTY", agent_answers=0, machine_answers=0, total_calls=100)]
    result = build_recommendations(
        None, None, devices, None, min_calls=50, campaign_name="35"
    )
    assert "AMD_DIVERGENCE" not in _types(result)


def test_amd_absent_below_ratio():
    devices = [_device("GWHUM", agent_answers=50, machine_answers=20)]
    result = build_recommendations(
        None, None, devices, None, min_calls=50, campaign_name="35"
    )
    assert "AMD_DIVERGENCE" not in _types(result)


def test_amd_emits_single_worst_ratio():
    devices = [
        _device("GWMILD", agent_answers=20, machine_answers=80, total_calls=300),
        _device("GWSEVERE", agent_answers=5, machine_answers=50, total_calls=100),
        _device("GWOK", agent_answers=50, machine_answers=100, total_calls=400),
    ]
    result = build_recommendations(
        None, None, devices, None, min_calls=50, campaign_name="35"
    )
    amd_items = [i for i in result if i["type"] == "AMD_DIVERGENCE"]
    assert len(amd_items) == 1
    assert amd_items[0]["entity"] == "GWSEVERE"


def test_volume_drop_fires_at_threshold():
    result = build_recommendations(
        {"agent_answers": 100},
        {"agent_answers": 85},
        None,
        None,
        min_calls=50,
        campaign_name="35",
    )
    drop = _by_type(result, "VOLUME_DELTA")
    assert drop["category"] == "WARNING"
    assert "15.00%" in drop["text"]


def test_volume_drop_absent_when_small_change():
    result = build_recommendations(
        {"agent_answers": 100},
        {"agent_answers": 95},
        None,
        None,
        min_calls=50,
        campaign_name="35",
    )
    assert "VOLUME_DELTA" not in _types(result)


def test_volume_drop_absent_when_a_is_zero():
    result = build_recommendations(
        {"agent_answers": 0},
        {"agent_answers": 0},
        None,
        None,
        min_calls=50,
        campaign_name="35",
    )
    assert "VOLUME_DELTA" not in _types(result)


def test_no_volume_delta_without_days():
    devices = [
        _device("GW1", agent_answers=50, machine_answers=0),
        _device("GW2", agent_answers=10, machine_answers=0, busy_calls=150),
    ]
    hourly = [_hour(10, agent_answers=80)]
    result = build_recommendations(None, None, devices, hourly, 50, "35")
    assert result
    assert "VOLUME_DELTA" not in _types(result)


def test_order_warnings_before_success_then_rule_order():
    devices = [
        _device("GWBUSY", agent_answers=10, machine_answers=5, busy_calls=150),
        _device("GWHIGH", agent_answers=80, machine_answers=0, busy_calls=5),
    ]
    hourly = [_hour(10, agent_answers=70)]
    result = build_recommendations(
        {"agent_answers": 100},
        {"agent_answers": 50},
        devices,
        hourly,
        min_calls=50,
        campaign_name="35",
    )
    types = _types(result)
    assert types == ["PACING", "VOLUME_DELTA", "ROUTING", "SCHEDULE"]
    categories = [r["category"] for r in result]
    order = {"CRITICAL": 0, "WARNING": 1, "SUCCESS": 2, "INFO": 3}
    assert categories == sorted(categories, key=lambda c: order[c])


def test_min_calls_filters_devices():
    devices = [_device("GWTINY", total_calls=10)]
    result = build_recommendations(
        None, None, devices, None, min_calls=50, campaign_name="35"
    )
    assert result == []


def test_cap_respected():
    devices = [
        _device(f"AMDI{i}", agent_answers=1, machine_answers=100, total_calls=500)
        for i in range(10)
    ]
    result = build_recommendations(
        {"agent_answers": 100},
        {"agent_answers": 10},
        devices,
        [_hour(10, agent_answers=99)],
        min_calls=50,
        campaign_name="35",
    )
    assert len(result) <= RECOMMENDATIONS_LIMIT


def test_item_shape():
    result = build_recommendations(
        None,
        None,
        [_device("GW1")],
        None,
        min_calls=50,
        campaign_name="35",
    )
    item = result[0]
    base = {"id", "type", "category", "entity", "text"}
    assert base <= set(item) <= base | {"excluded_amd"}
    if "excluded_amd" in item:
        assert item["type"] == "ROUTING"
        assert isinstance(item["excluded_amd"], list)
    assert item["category"] in {"CRITICAL", "WARNING", "SUCCESS", "INFO"}
