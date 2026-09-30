from config import (
    DIAG_BUSY_THRESHOLD,
    REC_AMD_RATIO,
    REC_MIN_VOLUME_SHARE,
    REC_VOLUME_DROP_PCT,
    RECOMMENDATIONS_LIMIT,
)

_SEVERITY_ORDER = {"CRITICAL": 0, "WARNING": 1, "SUCCESS": 2, "INFO": 3}
_RULE_ORDER = {
    "ROUTING": 0,
    "PACING": 1,
    "SCHEDULE": 2,
    "AMD_DIVERGENCE": 3,
    "VOLUME_DELTA": 4,
}


def _rec(
    rec_id: str,
    rec_type: str,
    category: str,
    entity: str,
    text: str,
) -> dict:
    return {
        "id": rec_id,
        "type": rec_type,
        "category": category,
        "entity": entity,
        "text": text,
    }


def _eligible_devices(
    devices: list[dict] | None,
    min_calls: int,
) -> list[dict]:
    if not devices:
        return []
    return [
        row
        for row in devices
        if row.get("total_calls", 0) >= min_calls
    ]


def _is_amd_hit(device: dict) -> bool:
    machines = int(device.get("machine_answers", 0))
    agents = int(device.get("agent_answers", 0))
    if machines == 0 and agents == 0:
        return False
    return machines >= REC_AMD_RATIO * agents


def _routing_rec(devices: list[dict], total_campaign: int) -> dict | None:
    if total_campaign <= 0:
        return None
    pre = [
        d
        for d in devices
        if d.get("agent_answer_rate") is not None
        and d.get("total_calls", 0) / total_campaign >= REC_MIN_VOLUME_SHARE
    ]
    excluded = [d for d in pre if _is_amd_hit(d)]
    candidates = [d for d in pre if not _is_amd_hit(d)]
    if not candidates:
        return None
    best = max(
        candidates,
        key=lambda d: (d["agent_answer_rate"], d["total_calls"]),
    )
    rate_pct = best["agent_answer_rate"] * 100
    share_pct = best["total_calls"] / total_campaign * 100
    item = _rec(
        "rec_gw_routing",
        "ROUTING",
        "SUCCESS",
        str(best["device"]),
        (
            f"{best['device']} tiene la mejor tasa de Answer Agent "
            f"({rate_pct:.2f}%) del período consolidado y concentra el "
            f"{share_pct:.1f}% del volumen de intentos. Si hay margen para "
            f"redistribuir marcado, priorizarlo en las franjas de mayor "
            f"volumen debería subir la contactación general."
        ),
    )
    if excluded:
        excluded_sorted = sorted(
            excluded, key=lambda d: -d.get("total_calls", 0)
        )
        item["excluded_amd"] = [str(d["device"]) for d in excluded_sorted]
    return item


def _pacing_rec(devices: list[dict]) -> dict | None:
    candidates = [
        d
        for d in devices
        if d.get("busy_rate") is not None and d["busy_rate"] >= DIAG_BUSY_THRESHOLD
    ]
    if not candidates:
        return None
    worst = max(candidates, key=lambda d: d["busy_rate"])
    busy_pct = worst["busy_rate"] * 100
    rate = worst.get("agent_answer_rate")
    rate_text = f"{rate * 100:.2f}%" if rate is not None else "—"
    return _rec(
        "rec_gw_pacing",
        "PACING",
        "WARNING",
        str(worst["device"]),
        (
            f"{worst['device']} combina una tasa de Answer Agent de "
            f"{rate_text} con línea ocupada del {busy_pct:.2f}%: la "
            f"saturación de línea es el principal factor de esa pérdida "
            f"de contacto humano. Recomendación: revisar el volumen de "
            f"marcado simultáneo asignado a ese dispositivo."
        ),
    )


def _peak_hour_rec(hourly: list[dict] | None, min_calls: int, total_agents: int) -> dict | None:
    if not hourly:
        return None
    eligible = [h for h in hourly if h.get("total_calls", 0) >= min_calls]
    if not eligible:
        return None
    peak = max(eligible, key=lambda h: (h.get("agent_answers", 0), -h["hora"]))
    present = {h["hora"] for h in eligible}
    peak_hora = int(peak["hora"])
    neighbors = [h for h in (peak_hora - 1, peak_hora + 1) if h in present]
    neighbor_clause = (
        f"; vecinas: {', '.join(f'{h}h' for h in neighbors)}" if neighbors else ""
    )
    return _rec(
        "rec_peak_hour",
        "SCHEDULE",
        "SUCCESS",
        str(peak_hora),
        (
            f"La franja con más intentos atendidos por un agente es la "
            f"{peak_hora}h ({peak.get('agent_answers', 0)} de "
            f"{total_agents} en total{neighbor_clause}). Concentrar el "
            f"marcado en esa hora y las adyacentes puede mejorar el "
            f"rendimiento sin sumar más volumen total."
        ),
    )


def _amd_rec(device: dict) -> dict:
    machines = int(device.get("machine_answers", 0))
    agents = int(device.get("agent_answers", 0))
    name = str(device["device"])
    return _rec(
        f"rec_amd_divergence_{name.lower()}",
        "AMD_DIVERGENCE",
        "WARNING",
        name,
        (
            f"{name} descolga con frecuencia, pero la mayoría de sus "
            f"contestaciones son automáticas ({machines}) frente a solo "
            f"{agents} respuestas humanas. No sobreestimar la calidad de "
            f"esa troncal: evaluarla por Answer Agent."
        ),
    )


def _amd_ratio_key(device: dict) -> tuple:
    machines = int(device.get("machine_answers", 0))
    agents = int(device.get("agent_answers", 0))
    if agents == 0 and machines > 0:
        ratio = float("inf")
    elif agents > 0:
        ratio = machines / agents
    else:
        ratio = 0.0
    return (-ratio, -int(device.get("total_calls", 0)))


def _amd_recs(devices: list[dict]) -> list[dict]:
    hits = [d for d in devices if _is_amd_hit(d)]
    hits.sort(key=_amd_ratio_key)
    return [_amd_rec(d) for d in hits[:1]]


def _volume_drop_rec(
    day_a: dict | None,
    day_b: dict | None,
    campaign_name: str,
) -> dict | None:
    if day_a is None or day_b is None:
        return None
    a = day_a.get("agent_answers")
    b = day_b.get("agent_answers")
    if a is None or b is None or a <= 0:
        return None
    drop_pct = (b - a) / a * 100.0
    if drop_pct > REC_VOLUME_DROP_PCT:
        return None
    return _rec(
        "rec_volume_drop",
        "VOLUME_DELTA",
        "WARNING",
        str(campaign_name),
        (
            f"El volumen de Answer Agent bajó de {a} a {b} "
            f"({drop_pct:.2f}%) entre el Día A y el Día B. Vale la pena "
            f"auditar cambios en la operación: dispositivos, horarios o "
            f"calidad de la base."
        ),
    )


def build_recommendations(
    day_a: dict | None,
    day_b: dict | None,
    devices: list[dict] | None,
    hourly: list[dict] | None,
    min_calls: int,
    campaign_name: str,
) -> list[dict]:
    total_campaign = sum(int(d.get("total_calls", 0)) for d in (devices or []))
    eligible = _eligible_devices(devices, min_calls)
    items: list[dict] = []

    routing = _routing_rec(eligible, total_campaign)
    if routing:
        items.append(routing)

    pacing = _pacing_rec(eligible)
    if pacing:
        items.append(pacing)

    total_agents = sum(int(h.get("agent_answers", 0)) for h in (hourly or []))
    peak = _peak_hour_rec(hourly, min_calls, total_agents)
    if peak:
        items.append(peak)

    items.extend(_amd_recs(eligible))

    volume = _volume_drop_rec(day_a, day_b, campaign_name)
    if volume:
        items.append(volume)

    items.sort(key=lambda r: (_SEVERITY_ORDER[r["category"]], _RULE_ORDER[r["type"]]))
    return items[:RECOMMENDATIONS_LIMIT]
