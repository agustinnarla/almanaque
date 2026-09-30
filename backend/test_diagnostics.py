from config import ROOT_CAUSES_LIMIT
from services.diagnostics_engine import compute_delta_percentage, evaluate_causes


def test_compute_delta_percentage():
    assert compute_delta_percentage(0.10, 0.08) == -20.0
    assert compute_delta_percentage(0.0, 0.1) is None
    assert compute_delta_percentage(None, 0.1) is None
    assert compute_delta_percentage(0.1, None) is None


def _base_row(
    base="80",
    delta=-0.04,
    share_delta=0.01,
    aa_b=None,
    **extra,
):
    rate_a = 0.10
    rate_b = rate_a + delta if delta is not None else None
    if aa_b is not None:
        rate_b = aa_b
        delta = None if rate_a is None else round(rate_b - rate_a, 6)
    row = {
        "base": base,
        "total_calls_a": 1000,
        "total_calls_b": 900,
        "agent_answer_rate_a": rate_a,
        "agent_answer_rate_b": rate_b,
        "delta_rate": delta,
        "share_a": 0.4,
        "share_b": 0.41,
        "share_delta": share_delta,
        "relative_change_pct": (
            None
            if rate_a is None or rate_b is None or rate_a == 0
            else round((rate_b - rate_a) / rate_a * 100, 2)
        ),
    }
    row.update(extra)
    return row


def _split(result: dict):
    return result["root_causes"], result["positive_drivers"], result["insights"]


def test_base_degradation_critical():
    causes, positives, insights = _split(
        evaluate_causes(None, None, [_base_row(delta=-0.02)], [])
    )
    assert len(causes) == 1
    assert causes[0]["type"] == "BASE_DEGRADATION"
    assert causes[0]["severity"] == "CRITICAL"
    assert positives == []
    assert insights[0]["polarity"] == "NEGATIVE"


def test_base_degradation_warning_between_thresholds():
    causes, positives, _ = _split(
        evaluate_causes(None, None, [_base_row(delta=-0.01)], [])
    )
    assert len(causes) == 1
    assert causes[0]["severity"] == "WARNING"
    assert positives == []


def test_base_degradation_warning_at_warning_threshold():
    causes, _, _ = _split(
        evaluate_causes(None, None, [_base_row(delta=-0.006)], [])
    )
    assert causes[0]["severity"] == "WARNING"


def test_base_drop_below_warning_ignored():
    causes, positives, insights = _split(
        evaluate_causes(None, None, [_base_row(delta=-0.005)], [])
    )
    assert causes == []
    assert positives == []
    assert insights == []


def test_base_improvement_info():
    causes, positives, insights = _split(
        evaluate_causes(None, None, [_base_row(delta=0.007)], [])
    )
    assert causes == []
    assert len(positives) == 1
    assert positives[0]["type"] == "BASE_IMPROVEMENT"
    assert positives[0]["severity"] == "INFO"
    assert insights[0]["polarity"] == "POSITIVE"


def test_base_improvement_success():
    _, positives, _ = _split(
        evaluate_causes(None, None, [_base_row(delta=0.02)], [])
    )
    assert positives[0]["severity"] == "SUCCESS"


def test_base_improvement_below_threshold_ignored():
    causes, positives, _ = _split(
        evaluate_causes(None, None, [_base_row(delta=0.004)], [])
    )
    assert causes == [] and positives == []


def test_traffic_mix_negative_when_aa_below_average():
    summary_a = {"congestion_rate": 0.05, "agent_answer_rate": 0.12}
    summary_b = {
        "congestion_rate": 0.05,
        "agent_answer_rate": 0.10,
    }
    row = _base_row(delta=0.0, share_delta=0.06)
    row["agent_answer_rate_a"] = 0.05
    row["agent_answer_rate_b"] = 0.05
    row["delta_rate"] = 0.0
    row["relative_change_pct"] = 0.0
    causes, positives, insights = _split(
        evaluate_causes(summary_a, summary_b, [row], [])
    )
    assert len(causes) == 1
    assert causes[0]["type"] == "TRAFFIC_MIX"
    assert causes[0]["severity"] == "WARNING"
    assert positives == []
    assert insights[0]["polarity"] == "NEGATIVE"


def test_traffic_mix_positive_when_aa_at_or_above_average():
    summary_a = {"congestion_rate": 0.05, "agent_answer_rate": 0.12}
    summary_b = {"congestion_rate": 0.05, "agent_answer_rate": 0.10}
    causes, positives, insights = _split(
        evaluate_causes(
            summary_a,
            summary_b,
            [_base_row(delta=0.0, share_delta=0.06, aa_b=0.10)],
            [],
        )
    )
    assert causes == []
    assert positives[0]["type"] == "TRAFFIC_MIX"
    assert positives[0]["severity"] == "INFO"
    assert insights[0]["polarity"] == "POSITIVE"


def test_network_congestion_warning():
    summary_a = {"congestion_rate": 0.07}
    summary_b = {"congestion_rate": 0.10}
    gws = [{"device": "GW37", "delta_congestion": 0.03}]
    causes, positives, _ = _split(evaluate_causes(summary_a, summary_b, [], gws))
    assert causes[0]["type"] == "NETWORK_CONGESTION"
    assert causes[0]["severity"] == "WARNING"
    assert positives == []


def test_network_congestion_critical():
    summary_a = {"congestion_rate": 0.07}
    summary_b = {"congestion_rate": 0.13}
    gws = [{"device": "GW37", "delta_congestion": 0.06}]
    causes, _, _ = _split(evaluate_causes(summary_a, summary_b, [], gws))
    assert causes[0]["severity"] == "CRITICAL"


def test_network_congestion_not_fired_below_global_threshold():
    summary_a = {"congestion_rate": 0.07}
    summary_b = {"congestion_rate": 0.075}
    gws = [{"device": "GW37", "delta_congestion": 0.01}]
    causes, _, _ = _split(evaluate_causes(summary_a, summary_b, [], gws))
    assert causes == []


def test_network_recovery_info():
    summary_a = {"congestion_rate": 0.10}
    summary_b = {"congestion_rate": 0.07}
    gws = [{"device": "GW37", "delta_congestion": -0.025}]
    causes, positives, insights = _split(
        evaluate_causes(summary_a, summary_b, [], gws)
    )
    assert causes == []
    assert positives[0]["type"] == "NETWORK_RECOVERY"
    assert positives[0]["severity"] == "INFO"
    assert positives[0]["entity"] == "GW37"
    assert insights[0]["polarity"] == "POSITIVE"


def test_network_recovery_success():
    summary_a = {"congestion_rate": 0.15}
    summary_b = {"congestion_rate": 0.10}
    gws = [{"device": "GW37", "delta_congestion": -0.048}]
    _, positives, _ = _split(evaluate_causes(summary_a, summary_b, [], gws))
    assert positives[0]["severity"] == "SUCCESS"


def test_network_recovery_not_fired_above_threshold():
    summary_a = {"congestion_rate": 0.10}
    summary_b = {"congestion_rate": 0.095}
    gws = [{"device": "GW37", "delta_congestion": -0.01}]
    _, positives, _ = _split(evaluate_causes(summary_a, summary_b, [], gws))
    assert positives == []


def test_severity_order_and_impact():
    bases = [
        _base_row(base="A", delta=-0.02, share_delta=0.10),
        _base_row(base="B", delta=-0.03, share_delta=0.0),
        _base_row(base="C", delta=0.02, share_delta=0.0),
    ]
    summary_a = {"congestion_rate": 0.07, "agent_answer_rate": 0.1}
    summary_b = {"congestion_rate": 0.12, "agent_answer_rate": 0.1}
    gws = [{"device": "GWX", "delta_congestion": 0.03}]
    result = evaluate_causes(summary_a, summary_b, bases, gws)
    causes = result["root_causes"]
    severities = [c["severity"] for c in causes]
    order = {"CRITICAL": 0, "WARNING": 1, "SUCCESS": 2, "INFO": 3}
    assert severities == sorted(severities, key=lambda s: order[s])
    assert causes[0]["entity"] == "Base B"
    positives = result["positive_drivers"]
    assert all(p["severity"] in {"SUCCESS", "INFO"} for p in positives)
    insights = result["insights"]
    assert all("polarity" in i for i in insights)
    insight_order = [order[i["severity"]] for i in insights]
    assert insight_order == sorted(insight_order)


def test_root_causes_capped_at_five():
    bases = [_base_row(base=str(i), delta=-0.03, share_delta=0.0) for i in range(10)]
    result = evaluate_causes(None, None, bases, [])
    assert len(result["root_causes"]) == ROOT_CAUSES_LIMIT
    assert len(result["insights"]) == ROOT_CAUSES_LIMIT
    assert all("_impact" not in c for c in result["root_causes"])


def test_positive_drivers_capped_at_five():
    bases = [_base_row(base=str(i), delta=0.03, share_delta=0.0) for i in range(10)]
    result = evaluate_causes(None, None, bases, [])
    assert len(result["positive_drivers"]) == ROOT_CAUSES_LIMIT
    assert len(result["insights"]) == ROOT_CAUSES_LIMIT


def test_collections_are_exclusive_by_polarity():
    bases = [
        _base_row(base="neg", delta=-0.03, share_delta=0.0),
        _base_row(base="pos", delta=0.03, share_delta=0.0),
    ]
    result = evaluate_causes(None, None, bases, [])
    assert all(c["severity"] in {"CRITICAL", "WARNING"} for c in result["root_causes"])
    assert all(
        p["severity"] in {"SUCCESS", "INFO"} for p in result["positive_drivers"]
    )
    types_neg = {c["type"] for c in result["root_causes"]}
    types_pos = {p["type"] for p in result["positive_drivers"]}
    assert types_neg == {"BASE_DEGRADATION"}
    assert types_pos == {"BASE_IMPROVEMENT"}
    polarities = {i["polarity"] for i in result["insights"]}
    assert polarities == {"NEGATIVE", "POSITIVE"}


def test_no_causes():
    result = evaluate_causes(None, None, [], [])
    assert result["root_causes"] == []
    assert result["positive_drivers"] == []
    assert result["insights"] == []
