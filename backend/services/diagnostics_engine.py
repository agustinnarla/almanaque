from config import (
    DIAG_BASE_DROP_THRESHOLD,
    DIAG_BASE_DROP_WARNING,
    DIAG_BASE_IMPROVEMENT_SUCCESS,
    DIAG_BASE_IMPROVEMENT_WARNING,
    DIAG_CONGESTION_CRITICAL,
    DIAG_CONGESTION_DELTA_THRESHOLD,
    DIAG_CONGESTION_RECOVERY_SUCCESS,
    DIAG_CONGESTION_RECOVERY_WARNING,
    DIAG_MIX_SHARE_THRESHOLD,
    ROOT_CAUSES_LIMIT,
)

_SEVERITY_ORDER = {"CRITICAL": 0, "WARNING": 1, "SUCCESS": 2, "INFO": 3}
_NEGATIVE_SEVERITIES = frozenset({"CRITICAL", "WARNING"})


def compute_delta_percentage(rate_a: float | None, rate_b: float | None) -> float | None:
    if rate_a is None or rate_b is None or rate_a == 0:
        return None
    return round((rate_b - rate_a) / rate_a * 100.0, 2)


def _cause(
    severity: str,
    cause_type: str,
    entity: str,
    message: str,
    impact: float,
    polarity: str,
) -> dict:
    return {
        "severity": severity,
        "type": cause_type,
        "entity": entity,
        "message": message,
        "_impact": impact,
        "_polarity": polarity,
    }


def _base_message(row: dict, delta: float) -> str:
    rel = row.get("relative_change_pct")
    rel_text = f" ({rel:+.1f}% relativo)" if rel is not None else ""
    return (
        f"La Base {row['base']} {'redujo' if delta < 0 else 'aumentó'} su tasa de "
        f"contacto en {delta * 100:+.1f} puntos porcentuales"
        f"{rel_text} (de {row['agent_answer_rate_a']:.4f} "
        f"a {row['agent_answer_rate_b']:.4f})."
    )


def evaluate_causes(
    summary_a: dict | None,
    summary_b: dict | None,
    bases_rows: list[dict],
    gateway_rows: list[dict],
) -> dict:
    events: list[dict] = []

    avg_b = None
    if summary_b is not None:
        avg_b = summary_b.get("agent_answer_rate")

    for row in bases_rows:
        delta = row["delta_rate"]
        if delta is not None and delta <= DIAG_BASE_DROP_THRESHOLD:
            severity = "CRITICAL"
        elif delta is not None and delta <= DIAG_BASE_DROP_WARNING:
            severity = "WARNING"
        else:
            severity = None
        if severity is not None and delta is not None:
            events.append(
                _cause(
                    severity,
                    "BASE_DEGRADATION",
                    f"Base {row['base']}",
                    _base_message(row, delta),
                    impact=abs(delta),
                    polarity="NEGATIVE",
                )
            )

        if delta is not None and delta >= DIAG_BASE_IMPROVEMENT_SUCCESS:
            imp_severity = "SUCCESS"
        elif delta is not None and delta >= DIAG_BASE_IMPROVEMENT_WARNING:
            imp_severity = "INFO"
        else:
            imp_severity = None
        if imp_severity is not None and delta is not None:
            events.append(
                _cause(
                    imp_severity,
                    "BASE_IMPROVEMENT",
                    f"Base {row['base']}",
                    _base_message(row, delta),
                    impact=abs(delta),
                    polarity="POSITIVE",
                )
            )

        share_delta = row.get("share_delta")
        if share_delta is not None and share_delta >= DIAG_MIX_SHARE_THRESHOLD:
            aa_b = row.get("agent_answer_rate_b")
            below_avg = (
                avg_b is not None
                and aa_b is not None
                and aa_b < avg_b
            )
            if below_avg:
                events.append(
                    _cause(
                        "WARNING",
                        "TRAFFIC_MIX",
                        f"Base {row['base']}",
                        (
                            f"La Base {row['base']} aumentó su participación en el "
                            f"disco en {share_delta * 100:.1f} puntos porcentuales "
                            f"con AA por debajo del promedio "
                            f"(share {row['share_a'] * 100:.1f}% → "
                            f"{row['share_b'] * 100:.1f}%)."
                        ),
                        impact=share_delta,
                        polarity="NEGATIVE",
                    )
                )
            else:
                events.append(
                    _cause(
                        "INFO",
                        "TRAFFIC_MIX",
                        f"Base {row['base']}",
                        (
                            f"La Base {row['base']} aumentó su participación en el "
                            f"disco en {share_delta * 100:.1f} puntos porcentuales "
                            f"con AA en línea o sobre el promedio "
                            f"(share {row['share_a'] * 100:.1f}% → "
                            f"{row['share_b'] * 100:.1f}%)."
                        ),
                        impact=share_delta,
                        polarity="POSITIVE",
                    )
                )

    if summary_a is not None and summary_b is not None and gateway_rows:
        worst_gw = None
        worst_delta = 0.0
        for row in gateway_rows:
            delta = row["delta_congestion"]
            if delta is not None and delta > worst_delta:
                worst_delta = delta
                worst_gw = row

        if worst_gw is not None:
            global_delta = (
                (summary_b.get("congestion_rate") or 0.0)
                - (summary_a.get("congestion_rate") or 0.0)
            )
            if global_delta >= DIAG_CONGESTION_DELTA_THRESHOLD:
                severity = (
                    "CRITICAL"
                    if worst_delta >= DIAG_CONGESTION_CRITICAL
                    else "WARNING"
                )
                events.append(
                    _cause(
                        severity,
                        "NETWORK_CONGESTION",
                        str(worst_gw["device"]),
                        (
                            f"Aumento de congestión de red en "
                            f"{global_delta * 100:+.1f} puntos porcentuales "
                            f"globales, concentrado en el troncal "
                            f"{worst_gw['device']} ({worst_delta * 100:+.1f} pp)."
                        ),
                        impact=global_delta,
                        polarity="NEGATIVE",
                    )
                )

        best_gw = None
        best_delta = 0.0
        for row in gateway_rows:
            delta = row["delta_congestion"]
            if delta is not None and delta < best_delta:
                best_delta = delta
                best_gw = row

        if best_gw is not None:
            if best_delta <= DIAG_CONGESTION_RECOVERY_SUCCESS:
                rec_severity = "SUCCESS"
            elif best_delta <= DIAG_CONGESTION_RECOVERY_WARNING:
                rec_severity = "INFO"
            else:
                rec_severity = None
            if rec_severity is not None:
                events.append(
                    _cause(
                        rec_severity,
                        "NETWORK_RECOVERY",
                        str(best_gw["device"]),
                        (
                            f"Recuperación de congestión en el troncal "
                            f"{best_gw['device']} "
                            f"({best_delta * 100:+.1f} pp de congestión)."
                        ),
                        impact=abs(best_delta),
                        polarity="POSITIVE",
                    )
                )

    def sort_key(item: dict) -> tuple:
        return (_SEVERITY_ORDER[item["severity"]], -item["_impact"])

    negatives = sorted(
        (e for e in events if e["_polarity"] == "NEGATIVE"),
        key=sort_key,
    )
    positives = sorted(
        (e for e in events if e["_polarity"] == "POSITIVE"),
        key=sort_key,
    )
    all_sorted = sorted(events, key=sort_key)

    def strip(items: list[dict], with_polarity: bool) -> list[dict]:
        limited = items[:ROOT_CAUSES_LIMIT]
        result = []
        for item in limited:
            entry = {
                "severity": item["severity"],
                "type": item["type"],
                "entity": item["entity"],
                "message": item["message"],
            }
            if with_polarity:
                entry["polarity"] = item["_polarity"]
            result.append(entry)
        return result

    return {
        "root_causes": strip(negatives, with_polarity=False),
        "positive_drivers": strip(positives, with_polarity=False),
        "insights": strip(all_sorted, with_polarity=True),
    }
