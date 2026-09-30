from config import PATTERN_MIN_CALLS, PATTERN_RELATIVE_FACTOR


def _campaign_rates(rows: list[dict]) -> dict[str, float]:
    totals: dict[str, list[int]] = {}
    for row in rows:
        calls = int(row["total_calls"])
        if calls <= 0:
            continue
        campaign = str(row.get("campaign", ""))
        bucket = totals.setdefault(campaign, [0, 0])
        bucket[0] += int(row["agent_answers"])
        bucket[1] += calls
    return {campaign: agents / calls for campaign, (agents, calls) in totals.items()}


def evaluate_campaigns(
    rows: list[dict],
    factor: float = PATTERN_RELATIVE_FACTOR,
    min_calls: int = PATTERN_MIN_CALLS,
) -> list[dict]:
    averages = _campaign_rates(rows)
    alerts = []
    for row in rows:
        calls = int(row["total_calls"])
        if calls <= 0 or calls < min_calls:
            continue
        campaign = str(row.get("campaign", ""))
        average = averages[campaign]
        threshold = average * factor
        rate = int(row["agent_answers"]) / calls
        if rate < threshold:
            alerts.append(
                {
                    "fecha": str(row["fecha"]),
                    "hora": int(row.get("hora", 0)),
                    "campaign": campaign,
                    "base": str(row["base"]),
                    "device": str(row.get("device", "")),
                    "total_calls": calls,
                    "agent_answer_rate": float(rate),
                    "campaign_rate": float(average),
                    "threshold_rate": float(threshold),
                    "pattern_alert": True,
                }
            )
    return alerts
