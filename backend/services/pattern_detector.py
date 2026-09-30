from config import AGENT_ANSWER_THRESHOLD


def evaluate_campaigns(
    rows: list[dict],
    threshold: float = AGENT_ANSWER_THRESHOLD,
) -> list[dict]:
    alerts = []
    for row in rows:
        denominator = int(row["total_calls"])
        if denominator <= 0:
            continue
        rate = int(row["agent_answers"]) / denominator
        if rate < threshold:
            alerts.append(
                {
                    "fecha": str(row["fecha"]),
                    "hora": int(row.get("hora", 0)),
                    "campaign": str(row.get("campaign", "")),
                    "base": str(row["base"]),
                    "device": str(row.get("device", "")),
                    "agent_answer_rate": float(rate),
                    "pattern_alert": True,
                }
            )
    return alerts
