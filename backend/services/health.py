from config import HEALTH_WEIGHT_BUSY, HEALTH_WEIGHT_CONGESTION


def compute_health_score(
    agent_answer_rate: float | None,
    busy_rate: float | None,
    congestion_rate: float | None,
) -> float | None:
    if agent_answer_rate is None or busy_rate is None or congestion_rate is None:
        return None
    score = (
        agent_answer_rate
        - busy_rate * HEALTH_WEIGHT_BUSY
        - congestion_rate * HEALTH_WEIGHT_CONGESTION
    ) * 100
    return round(score, 2)
