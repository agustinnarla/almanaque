import sqlite3
from datetime import date

from config import (
    CAMPAIGN_SEGMENTS,
    DEFAULT_SEGMENT,
    DIAG_BUSY_THRESHOLD,
    DIAG_CONGESTION_THRESHOLD,
    DIAG_PEAK_THRESHOLD,
)
from services.health import compute_health_score

AGG_COLUMNS = """
    SUM(total_calls) AS total_calls,
    SUM(agent_answers) AS agent_answers,
    SUM(machine_answers) AS machine_answers
"""

FULL_AGG_COLUMNS = f"""
    {AGG_COLUMNS},
    SUM(busy_calls) AS busy_calls,
    SUM(congestion_calls) AS congestion_calls
"""

DAY_COLUMNS = """
    total_calls,
    agent_answers,
    machine_answers
"""

SENTINEL_DAY = "1970-01-01"


def _campaign_sort_key(name: str) -> tuple:
    return (0, int(name), "") if name.isdigit() else (1, 0, name)


def list_campaigns(conn: sqlite3.Connection) -> list[dict]:
    cursor = conn.execute(
        """
        SELECT campaign, fecha, SUM(total_calls) AS total_calls
        FROM daily_campaign_metrics
        WHERE fecha != ?
        GROUP BY campaign, fecha
        ORDER BY campaign, fecha
        """,
        (SENTINEL_DAY,),
    )
    grouped: dict[str, dict] = {}
    for row in cursor.fetchall():
        name = str(row["campaign"])
        entry = grouped.setdefault(name, {"dates": [], "total_calls": 0})
        entry["dates"].append(str(row["fecha"]))
        entry["total_calls"] += int(row["total_calls"])

    catalog = []
    for name in sorted(grouped, key=_campaign_sort_key):
        dates = grouped[name]["dates"]
        catalog.append(
            {
                "campaign": name,
                "segment": CAMPAIGN_SEGMENTS.get(name, DEFAULT_SEGMENT),
                "first_day": dates[0],
                "last_day": dates[-1],
                "days": len(dates),
                "total_calls": grouped[name]["total_calls"],
                "dates": dates,
            }
        )
    return catalog


def _rate(agent_answers: int, total_calls: int, machine_answers: int) -> float | None:
    denominator = total_calls
    if denominator <= 0:
        return None
    return agent_answers / denominator


def _row_to_day(row: sqlite3.Row | dict, fecha: str | None = None) -> dict:
    total = int(row["total_calls"])
    agents = int(row["agent_answers"])
    machines = int(row["machine_answers"])
    keys = row.keys() if hasattr(row, "keys") else row
    day_fecha = fecha
    if day_fecha is None and "fecha" in keys:
        day_fecha = str(row["fecha"])
    return {
        "fecha": day_fecha,
        "total_calls": total,
        "agent_answers": agents,
        "machine_answers": machines,
        "rejected_calls": max(total - agents - machines, 0),
        "agent_answer_rate": _rate(agents, total, machines),
    }


def get_summary(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
) -> dict:
    cursor = conn.execute(
        f"""
        SELECT {AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat()),
    )
    row = cursor.fetchone()
    if row is None or row["total_calls"] is None:
        return {
            "campaign": campaign_name,
            "total_calls": 0,
            "agent_answers": 0,
            "machine_answers": 0,
            "rejected_calls": 0,
            "agent_answer_rate": None,
        }
    day = _row_to_day(row, fecha=None)
    day.pop("fecha", None)
    return {"campaign": campaign_name, **day}


def get_day_metrics(
    conn: sqlite3.Connection,
    campaign_name: str,
    day: date,
) -> dict | None:
    cursor = conn.execute(
        f"""
        SELECT {AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha = ?
        """,
        (campaign_name, day.isoformat()),
    )
    row = cursor.fetchone()
    if row is None or row["total_calls"] is None:
        return None
    return _row_to_day(row, fecha=day.isoformat())


def compute_deltas(day_a: dict | None, day_b: dict | None) -> dict | None:
    if day_a is None or day_b is None:
        return None
    deltas: dict[str, float | None] = {}
    for key in ("total_calls", "agent_answers", "machine_answers", "rejected_calls", "agent_answer_rate"):
        base = day_a[key]
        target = day_b[key]
        if base is None or target is None or base == 0:
            deltas[key] = None
        else:
            deltas[key] = (target - base) / base * 100.0
    return deltas


def get_ranking(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
    min_calls: int = 1,
) -> list[dict]:
    cursor = conn.execute(
        f"""
        SELECT base, {AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY base
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat()),
    )
    ranking = []
    for row in cursor.fetchall():
        rate = _rate(int(row["agent_answers"]), int(row["total_calls"]), int(row["machine_answers"]))
        if rate is None:
            continue
        ranking.append(
            {
                "base": str(row["base"]),
                "agent_answer_rate": float(rate),
                "total_calls": int(row["total_calls"]),
                "ranked": int(row["total_calls"]) >= min_calls,
            }
        )
    # Representative bases first, biggest volume on top (AA breaks ties);
    # bases below the minimum volume go last.
    ranking.sort(
        key=lambda item: (
            not item["ranked"],
            -item["total_calls"],
            -item["agent_answer_rate"],
            item["base"],
        )
    )
    return ranking


def get_hourly_trend(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
) -> list[dict]:
    cursor = conn.execute(
        f"""
        SELECT hora, {AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY hora
        ORDER BY hora ASC
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat()),
    )
    trend = []
    for row in cursor.fetchall():
        trend.append(
            {
                "hora": int(row["hora"]),
                "total_calls": int(row["total_calls"]),
                "agent_answers": int(row["agent_answers"]),
                "machine_answers": int(row["machine_answers"]),
                "agent_answer_rate": _rate(
                    int(row["agent_answers"]),
                    int(row["total_calls"]),
                    int(row["machine_answers"]),
                ),
            }
        )
    return trend


def get_daily_trend(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
) -> list[dict]:
    cursor = conn.execute(
        f"""
        SELECT fecha, {AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY fecha
        ORDER BY fecha ASC
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat()),
    )
    trend = []
    for row in cursor.fetchall():
        trend.append(
            {
                "fecha": str(row["fecha"]),
                "total_calls": int(row["total_calls"]),
                "agent_answers": int(row["agent_answers"]),
                "machine_answers": int(row["machine_answers"]),
                "agent_answer_rate": _rate(
                    int(row["agent_answers"]),
                    int(row["total_calls"]),
                    int(row["machine_answers"]),
                ),
            }
        )
    return trend


def _fraction(numerator: int, denominator: int) -> float | None:
    if denominator <= 0:
        return None
    return numerator / denominator


def get_device_metrics(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
) -> list[dict]:
    cursor = conn.execute(
        f"""
        SELECT device, {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY device
        ORDER BY total_calls DESC
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat()),
    )
    devices = []
    for row in cursor.fetchall():
        total = int(row["total_calls"])
        agents = int(row["agent_answers"])
        machines = int(row["machine_answers"])
        busy = int(row["busy_calls"])
        congestion = int(row["congestion_calls"])
        devices.append(
            {
                "device": str(row["device"]),
                "total_calls": total,
                "agent_answers": agents,
                "machine_answers": machines,
                "busy_calls": busy,
                "congestion_calls": congestion,
                "agent_answer_rate": _rate(agents, total, machines),
                "busy_rate": _fraction(busy, total),
                "congestion_rate": _fraction(congestion, total),
            }
        )
    return devices


def _segment_rates(row: sqlite3.Row) -> dict:
    total = int(row["total_calls"])
    agents = int(row["agent_answers"])
    machines = int(row["machine_answers"])
    busy = int(row["busy_calls"])
    congestion = int(row["congestion_calls"])
    agent_rate = _rate(agents, total, machines)
    busy_rate = _fraction(busy, total)
    congestion_rate = _fraction(congestion, total)
    return {
        "total_calls": total,
        "agent_answer_rate": agent_rate,
        "busy_rate": busy_rate,
        "congestion_rate": congestion_rate,
        "health_score": compute_health_score(agent_rate, busy_rate, congestion_rate),
    }


def _rank_segments(items: list[dict], limit: int, key_field: str) -> dict:
    scoreable = [item for item in items if item["health_score"] is not None]
    if key_field == "hora":
        best_sorted = sorted(
            scoreable,
            key=lambda item: (-item["health_score"], -item["total_calls"], item["hora"]),
        )
        worst_sorted = sorted(
            scoreable,
            key=lambda item: (item["health_score"], item["hora"]),
        )
    else:
        best_sorted = sorted(
            scoreable,
            key=lambda item: (-item["health_score"], -item["total_calls"], item[key_field]),
        )
        worst_sorted = sorted(
            scoreable,
            key=lambda item: (item["health_score"], -item["total_calls"], item[key_field]),
        )
    return {
        "best": best_sorted[:limit],
        "worst": worst_sorted[:limit],
    }


def get_device_rankings(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
    min_calls: int,
    limit: int,
) -> dict:
    cursor = conn.execute(
        f"""
        SELECT device, {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY device
        HAVING SUM(total_calls) >= ?
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat(), min_calls),
    )
    items = []
    for row in cursor.fetchall():
        items.append({"device": str(row["device"]), **_segment_rates(row)})
    ranked = _rank_segments(items, limit, "device")
    return {
        "min_calls_applied": min_calls,
        "limit_applied": limit,
        **ranked,
    }


def get_hourly_rankings(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
    min_calls: int,
    limit: int,
) -> dict:
    cursor = conn.execute(
        f"""
        SELECT hora, {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY hora
        HAVING SUM(total_calls) >= ?
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat(), min_calls),
    )
    items = []
    for row in cursor.fetchall():
        items.append({"hora": int(row["hora"]), **_segment_rates(row)})
    ranked = _rank_segments(items, limit, "hora")
    return {
        "min_calls_applied": min_calls,
        "limit_applied": limit,
        **ranked,
    }


def get_campaign_diagnostics(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
    min_calls: int,
) -> dict:
    empty = {
        "min_calls_applied": min_calls,
        "congested_gateways": [],
        "burn_hours": [],
        "peak_hours": [],
    }

    cursor = conn.execute(
        f"""
        SELECT device, {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY device
        HAVING SUM(total_calls) >= ?
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat(), min_calls),
    )
    congested = []
    for row in cursor.fetchall():
        rates = _segment_rates(row)
        congestion_rate = rates["congestion_rate"]
        if congestion_rate is None or congestion_rate < DIAG_CONGESTION_THRESHOLD:
            continue
        congested.append(
            {
                "device": str(row["device"]),
                "total_calls": rates["total_calls"],
                "congestion_rate": congestion_rate,
                "health_score": rates["health_score"],
                "message": (
                    f"{row['device']} en saturación de red "
                    f"(congestión {congestion_rate * 100:.1f}%)."
                ),
            }
        )

    cursor = conn.execute(
        f"""
        SELECT hora, {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY hora
        HAVING SUM(total_calls) >= ?
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat(), min_calls),
    )
    burn_hours = []
    peak_hours = []
    for row in cursor.fetchall():
        rates = _segment_rates(row)
        hora = int(row["hora"])
        busy_rate = rates["busy_rate"]
        if busy_rate is not None and busy_rate >= DIAG_BUSY_THRESHOLD:
            burn_hours.append(
                {
                    "hora": hora,
                    "total_calls": rates["total_calls"],
                    "busy_rate": busy_rate,
                    "health_score": rates["health_score"],
                    "message": (
                        f"Hora {hora} con alta quema de base "
                        f"(ocupado {busy_rate * 100:.1f}%)."
                    ),
                }
            )
        agent_rate = rates["agent_answer_rate"]
        if agent_rate is not None and agent_rate >= DIAG_PEAK_THRESHOLD:
            peak_hours.append(
                {
                    "hora": hora,
                    "total_calls": rates["total_calls"],
                    "agent_answer_rate": agent_rate,
                    "health_score": rates["health_score"],
                    "message": (
                        f"Hora {hora} de pico de contacto efectivo "
                        f"({agent_rate * 100:.1f}%)."
                    ),
                }
            )

    if not congested and not burn_hours and not peak_hours:
        return empty
    return {
        "min_calls_applied": min_calls,
        "congested_gateways": congested,
        "burn_hours": burn_hours,
        "peak_hours": peak_hours,
    }


def get_day_totals(
    conn: sqlite3.Connection,
    campaign_name: str,
    day: date,
) -> dict | None:
    cursor = conn.execute(
        f"""
        SELECT {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha = ?
        """,
        (campaign_name, day.isoformat()),
    )
    row = cursor.fetchone()
    if row is None or row["total_calls"] is None:
        return None
    total = int(row["total_calls"])
    agents = int(row["agent_answers"])
    machines = int(row["machine_answers"])
    congestion = int(row["congestion_calls"])
    return {
        "total_calls": total,
        "agent_answer_rate": _rate(agents, total, machines),
        "congestion_rate": _fraction(congestion, total),
        "busy_rate": _fraction(int(row["busy_calls"]), total),
    }


def get_range_totals(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
) -> dict | None:
    cursor = conn.execute(
        f"""
        SELECT {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat()),
    )
    row = cursor.fetchone()
    if row is None or row["total_calls"] is None:
        return None
    total = int(row["total_calls"])
    agents = int(row["agent_answers"])
    machines = int(row["machine_answers"])
    congestion = int(row["congestion_calls"])
    return {
        "total_calls": total,
        "agent_answer_rate": _rate(agents, total, machines),
        "congestion_rate": _fraction(congestion, total),
        "busy_rate": _fraction(int(row["busy_calls"]), total),
    }


def get_breakdown_by_base(
    conn: sqlite3.Connection,
    campaign_name: str,
    day: date,
    min_calls: int,
) -> dict[str, dict]:
    cursor = conn.execute(
        f"""
        SELECT base, {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha = ?
        GROUP BY base
        HAVING SUM(total_calls) >= ?
        """,
        (campaign_name, day.isoformat(), min_calls),
    )
    result: dict[str, dict] = {}
    for row in cursor.fetchall():
        total = int(row["total_calls"])
        result[str(row["base"])] = {
            "base": str(row["base"]),
            "total_calls": total,
            "agent_answer_rate": _rate(
                int(row["agent_answers"]), total, int(row["machine_answers"])
            ),
        }
    return result


def get_breakdown_by_base_range(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
    min_calls: int,
) -> dict[str, dict]:
    cursor = conn.execute(
        f"""
        SELECT base, {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY base
        HAVING SUM(total_calls) >= ?
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat(), min_calls),
    )
    result: dict[str, dict] = {}
    for row in cursor.fetchall():
        total = int(row["total_calls"])
        result[str(row["base"])] = {
            "base": str(row["base"]),
            "total_calls": total,
            "agent_answer_rate": _rate(
                int(row["agent_answers"]), total, int(row["machine_answers"])
            ),
        }
    return result


def get_breakdown_by_device(
    conn: sqlite3.Connection,
    campaign_name: str,
    day: date,
    min_calls: int,
) -> dict[str, dict]:
    cursor = conn.execute(
        f"""
        SELECT device, {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha = ?
        GROUP BY device
        HAVING SUM(total_calls) >= ?
        """,
        (campaign_name, day.isoformat(), min_calls),
    )
    result: dict[str, dict] = {}
    for row in cursor.fetchall():
        total = int(row["total_calls"])
        result[str(row["device"])] = {
            "device": str(row["device"]),
            "total_calls": total,
            "congestion_rate": _fraction(int(row["congestion_calls"]), total),
        }
    return result


def get_breakdown_by_device_range(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
    min_calls: int,
) -> dict[str, dict]:
    cursor = conn.execute(
        f"""
        SELECT device, {FULL_AGG_COLUMNS}
        FROM daily_campaign_metrics
        WHERE campaign = ? AND fecha BETWEEN ? AND ?
        GROUP BY device
        HAVING SUM(total_calls) >= ?
        """,
        (campaign_name, start_date.isoformat(), end_date.isoformat(), min_calls),
    )
    result: dict[str, dict] = {}
    for row in cursor.fetchall():
        total = int(row["total_calls"])
        result[str(row["device"])] = {
            "device": str(row["device"]),
            "total_calls": total,
            "congestion_rate": _fraction(int(row["congestion_calls"]), total),
        }
    return result


def build_compare_diagnostics(
    conn: sqlite3.Connection,
    campaign_name: str,
    date_a: date,
    date_b: date,
    min_calls: int,
) -> dict:
    from services.diagnostics_engine import compute_delta_percentage, evaluate_causes

    summary_a = get_day_totals(conn, campaign_name, date_a)
    summary_b = get_day_totals(conn, campaign_name, date_b)

    if summary_a is None or summary_b is None:
        return {
            "campaign": campaign_name,
            "date_a": date_a.isoformat(),
            "date_b": date_b.isoformat(),
            "min_calls_applied": min_calls,
            "summary": None,
            "root_causes": [],
            "positive_drivers": [],
            "insights": [],
            "bases_comparison": None,
            "gateways_comparison": None,
        }

    total_a = summary_a["total_calls"] or 0
    total_b = summary_b["total_calls"] or 0
    rate_a = summary_a["agent_answer_rate"]
    rate_b = summary_b["agent_answer_rate"]
    from services.health import compute_health_score

    summary = {
        "total_calls_a": total_a,
        "total_calls_b": total_b,
        "delta_total_pct": compute_delta_percentage(
            total_a if total_a else None, total_b
        ),
        "agent_answer_rate_a": rate_a,
        "agent_answer_rate_b": rate_b,
        "delta_rate": (
            None
            if rate_a is None or rate_b is None
            else round(rate_b - rate_a, 6)
        ),
        "delta_percentage": compute_delta_percentage(rate_a, rate_b),
        "busy_rate_a": summary_a["busy_rate"],
        "busy_rate_b": summary_b["busy_rate"],
        "congestion_rate_a": summary_a["congestion_rate"],
        "congestion_rate_b": summary_b["congestion_rate"],
        "congestion_rate": summary_b["congestion_rate"],
        "health_score": compute_health_score(
            rate_b, summary_b["busy_rate"], summary_b["congestion_rate"]
        ),
    }

    bases_a = get_breakdown_by_base(conn, campaign_name, date_a, min_calls)
    bases_b = get_breakdown_by_base(conn, campaign_name, date_b, min_calls)
    common_bases = sorted(set(bases_a) & set(bases_b))

    bases_comparison = []
    engine_bases = []
    for base in common_bases:
        row_a = bases_a[base]
        row_b = bases_b[base]
        share_a = (row_a["total_calls"] / total_a) if total_a else None
        share_b = (row_b["total_calls"] / total_b) if total_b else None
        ra = row_a["agent_answer_rate"]
        rb = row_b["agent_answer_rate"]
        delta = None if ra is None or rb is None else round(rb - ra, 6)
        share_delta = (
            None if share_a is None or share_b is None else share_b - share_a
        )
        rel = compute_delta_percentage(ra, rb)
        entry = {
            "base": base,
            "total_calls_a": row_a["total_calls"],
            "total_calls_b": row_b["total_calls"],
            "agent_answer_rate_a": ra,
            "agent_answer_rate_b": rb,
            "delta_rate": delta,
            "share_a": share_a,
            "share_b": share_b,
            "share_delta": share_delta,
            "relative_change_pct": rel,
        }
        bases_comparison.append(entry)
        engine_bases.append(entry)

    devices_a = get_breakdown_by_device(conn, campaign_name, date_a, min_calls)
    devices_b = get_breakdown_by_device(conn, campaign_name, date_b, min_calls)
    common_devices = sorted(set(devices_a) & set(devices_b))

    gateways_comparison = []
    for device in common_devices:
        ca = devices_a[device]["congestion_rate"]
        cb = devices_b[device]["congestion_rate"]
        delta_c = (
            None if ca is None or cb is None else round(cb - ca, 6)
        )
        gateways_comparison.append(
            {
                "device": device,
                "congestion_rate_a": ca,
                "congestion_rate_b": cb,
                "delta_congestion": delta_c,
            }
        )

    causes = evaluate_causes(summary_a, summary_b, engine_bases, gateways_comparison)

    return {
        "campaign": campaign_name,
        "date_a": date_a.isoformat(),
        "date_b": date_b.isoformat(),
        "min_calls_applied": min_calls,
        "summary": summary,
        "root_causes": causes["root_causes"],
        "positive_drivers": causes["positive_drivers"],
        "insights": causes["insights"],
        "bases_comparison": bases_comparison,
        "gateways_comparison": gateways_comparison,
    }


def build_compare_recommendations(
    conn: sqlite3.Connection,
    campaign_name: str,
    date_a: date,
    date_b: date,
    min_calls: int,
) -> dict:
    from services.recommendations_engine import build_recommendations

    payload = {
        "campaign": campaign_name,
        "date_a": date_a.isoformat(),
        "date_b": date_b.isoformat(),
        "min_calls_applied": min_calls,
        "recommendations": [],
    }

    day_a = get_day_metrics(conn, campaign_name, date_a)
    day_b = get_day_metrics(conn, campaign_name, date_b)
    if day_a is None or day_b is None:
        return payload

    devices = get_device_metrics(conn, campaign_name, date_a, date_b)
    hourly = get_hourly_trend(conn, campaign_name, date_a, date_b)

    payload["recommendations"] = build_recommendations(
        day_a,
        day_b,
        devices,
        hourly,
        min_calls,
        campaign_name,
    )
    return payload


def build_range_recommendations(
    conn: sqlite3.Connection,
    campaign_name: str,
    start_date: date,
    end_date: date,
    min_calls: int,
) -> dict:
    from services.recommendations_engine import build_recommendations

    payload = {
        "campaign": campaign_name,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "min_calls_applied": min_calls,
        "recommendations": [],
    }

    devices = get_device_metrics(conn, campaign_name, start_date, end_date)
    hourly = get_hourly_trend(conn, campaign_name, start_date, end_date)
    if not devices and not hourly:
        return payload

    payload["recommendations"] = build_recommendations(
        None,
        None,
        devices,
        hourly,
        min_calls,
        campaign_name,
    )
    return payload


def _cross_gateway_intersection(
    conn: sqlite3.Connection,
    campaign_a: str,
    campaign_b: str,
    start_date: date,
    end_date: date,
    min_calls: int,
) -> list[dict]:
    devices_a = get_breakdown_by_device_range(
        conn, campaign_a, start_date, end_date, min_calls
    )
    devices_b = get_breakdown_by_device_range(
        conn, campaign_b, start_date, end_date, min_calls
    )
    common_devices = sorted(set(devices_a) & set(devices_b))
    return [
        {
            "device": device,
            "congestion_rate_a": devices_a[device]["congestion_rate"],
            "congestion_rate_b": devices_b[device]["congestion_rate"],
            "delta_congestion": (
                None
                if devices_a[device]["congestion_rate"] is None
                or devices_b[device]["congestion_rate"] is None
                else round(
                    devices_b[device]["congestion_rate"]
                    - devices_a[device]["congestion_rate"],
                    6,
                )
            ),
        }
        for device in common_devices
    ]


def _cross_base_intersection(
    conn: sqlite3.Connection,
    campaign_a: str,
    campaign_b: str,
    start_date: date,
    end_date: date,
    min_calls: int,
    total_a: int,
    total_b: int,
) -> list[dict]:
    from services.diagnostics_engine import compute_delta_percentage

    bases_a = get_breakdown_by_base_range(
        conn, campaign_a, start_date, end_date, min_calls
    )
    bases_b = get_breakdown_by_base_range(
        conn, campaign_b, start_date, end_date, min_calls
    )
    common_bases = sorted(set(bases_a) & set(bases_b))
    bases_comparison = []
    for base in common_bases:
        row_a = bases_a[base]
        row_b = bases_b[base]
        share_a = (row_a["total_calls"] / total_a) if total_a else None
        share_b = (row_b["total_calls"] / total_b) if total_b else None
        ra = row_a["agent_answer_rate"]
        rb = row_b["agent_answer_rate"]
        delta = None if ra is None or rb is None else round(rb - ra, 6)
        share_delta = (
            None if share_a is None or share_b is None else share_b - share_a
        )
        bases_comparison.append(
            {
                "base": base,
                "total_calls_a": row_a["total_calls"],
                "total_calls_b": row_b["total_calls"],
                "agent_answer_rate_a": ra,
                "agent_answer_rate_b": rb,
                "delta_rate": delta,
                "share_a": share_a,
                "share_b": share_b,
                "share_delta": share_delta,
                "relative_change_pct": compute_delta_percentage(ra, rb),
            }
        )
    return bases_comparison


def _cross_summary(totals_a: dict, totals_b: dict) -> dict:
    from services.diagnostics_engine import compute_delta_percentage
    from services.health import compute_health_score

    total_a = totals_a["total_calls"] or 0
    total_b = totals_b["total_calls"] or 0
    rate_a = totals_a["agent_answer_rate"]
    rate_b = totals_b["agent_answer_rate"]
    return {
        "total_calls_a": total_a,
        "total_calls_b": total_b,
        "delta_total_pct": compute_delta_percentage(
            total_a if total_a else None, total_b
        ),
        "agent_answer_rate_a": rate_a,
        "agent_answer_rate_b": rate_b,
        "delta_rate": (
            None if rate_a is None or rate_b is None
            else round(rate_b - rate_a, 6)
        ),
        "delta_percentage": compute_delta_percentage(rate_a, rate_b),
        "busy_rate_a": totals_a["busy_rate"],
        "busy_rate_b": totals_b["busy_rate"],
        "congestion_rate_a": totals_a["congestion_rate"],
        "congestion_rate_b": totals_b["congestion_rate"],
        "congestion_rate": totals_b["congestion_rate"],
        "health_score": compute_health_score(
            rate_b, totals_b["busy_rate"], totals_b["congestion_rate"]
        ),
    }


def build_cross_campaign_compare(
    conn: sqlite3.Connection,
    campaign_a: str,
    campaign_b: str,
    start_date: date,
    end_date: date,
    min_calls: int,
) -> dict:
    envelope = {
        "campaign_a": campaign_a,
        "campaign_b": campaign_b,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "min_calls_applied": min_calls,
        "summary": None,
        "gateways_comparison": None,
        "bases_comparison": None,
        "hourly_a": [],
        "hourly_b": [],
        "daily_a": [],
        "daily_b": [],
        "devices_a": [],
        "devices_b": [],
    }

    totals_a = get_range_totals(conn, campaign_a, start_date, end_date)
    totals_b = get_range_totals(conn, campaign_b, start_date, end_date)
    if totals_a is None or totals_b is None:
        return envelope

    envelope["summary"] = _cross_summary(totals_a, totals_b)
    envelope["gateways_comparison"] = _cross_gateway_intersection(
        conn, campaign_a, campaign_b, start_date, end_date, min_calls
    )
    envelope["bases_comparison"] = _cross_base_intersection(
        conn,
        campaign_a,
        campaign_b,
        start_date,
        end_date,
        min_calls,
        totals_a["total_calls"] or 0,
        totals_b["total_calls"] or 0,
    )

    envelope["hourly_a"] = get_hourly_trend(conn, campaign_a, start_date, end_date)
    envelope["hourly_b"] = get_hourly_trend(conn, campaign_b, start_date, end_date)
    envelope["daily_a"] = get_daily_trend(conn, campaign_a, start_date, end_date)
    envelope["daily_b"] = get_daily_trend(conn, campaign_b, start_date, end_date)
    envelope["devices_a"] = get_device_metrics(conn, campaign_a, start_date, end_date)
    envelope["devices_b"] = get_device_metrics(conn, campaign_b, start_date, end_date)
    return envelope


def build_cross_campaign_diagnostics(
    conn: sqlite3.Connection,
    campaign_a: str,
    campaign_b: str,
    start_date: date,
    end_date: date,
    min_calls: int,
) -> dict:
    from services.diagnostics_engine import evaluate_causes

    envelope = {
        "campaign_a": campaign_a,
        "campaign_b": campaign_b,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "min_calls_applied": min_calls,
        "summary": None,
        "root_causes": [],
        "positive_drivers": [],
        "insights": [],
        "bases_comparison": None,
        "gateways_comparison": None,
    }

    totals_a = get_range_totals(conn, campaign_a, start_date, end_date)
    totals_b = get_range_totals(conn, campaign_b, start_date, end_date)
    if totals_a is None or totals_b is None:
        return envelope

    bases_comparison = _cross_base_intersection(
        conn,
        campaign_a,
        campaign_b,
        start_date,
        end_date,
        min_calls,
        totals_a["total_calls"] or 0,
        totals_b["total_calls"] or 0,
    )
    gateways_comparison = _cross_gateway_intersection(
        conn, campaign_a, campaign_b, start_date, end_date, min_calls
    )
    causes = evaluate_causes(
        totals_a, totals_b, bases_comparison, gateways_comparison
    )

    envelope["summary"] = _cross_summary(totals_a, totals_b)
    envelope["root_causes"] = causes["root_causes"]
    envelope["positive_drivers"] = causes["positive_drivers"]
    envelope["insights"] = causes["insights"]
    envelope["bases_comparison"] = bases_comparison
    envelope["gateways_comparison"] = gateways_comparison
    return envelope


def build_cross_campaign_recommendations(
    conn: sqlite3.Connection,
    campaign_a: str,
    campaign_b: str,
    start_date: date,
    end_date: date,
    min_calls: int,
) -> dict:
    from services.recommendations_engine import build_recommendations

    payload = {
        "campaign_a": campaign_a,
        "campaign_b": campaign_b,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "min_calls_applied": min_calls,
        "recommendations": [],
    }

    if get_range_totals(conn, campaign_b, start_date, end_date) is None:
        return payload

    devices = get_device_metrics(conn, campaign_b, start_date, end_date)
    hourly = get_hourly_trend(conn, campaign_b, start_date, end_date)
    if not devices and not hourly:
        return payload

    payload["recommendations"] = build_recommendations(
        None,
        None,
        devices,
        hourly,
        min_calls,
        campaign_b,
    )
    return payload
