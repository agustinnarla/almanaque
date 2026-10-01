from config import (
    ROUTING_ACTIVE_SHARE,
    ROUTING_AMD_NOTE_SHARE,
    ROUTING_CONCENTRATION_SHARE,
    ROUTING_MIN_DAY_CALLS,
)


def _summarize_day(fecha: str, devices: list[dict]) -> dict | None:
    total = sum(d["total_calls"] for d in devices)
    if total < ROUTING_MIN_DAY_CALLS:
        return None
    top = max(devices, key=lambda d: (d["total_calls"], d["device"]))
    top_share = top["total_calls"] / total
    return {
        "fecha": fecha,
        "total_calls": total,
        "top_device": top["device"],
        "top_share": top_share,
        "top_machine_share": top["machine_answers"] / top["total_calls"],
        "active_trunks": sum(
            1 for d in devices if d["total_calls"] / total >= ROUTING_ACTIVE_SHARE
        ),
        "concentrated": top_share >= ROUTING_CONCENTRATION_SHARE,
    }


def _smooth(days: list[dict]) -> None:
    # A day that differs from both neighbours takes theirs (one odd day is noise).
    for index in range(1, len(days) - 1):
        before, after = days[index - 1]["concentrated"], days[index + 1]["concentrated"]
        if before == after != days[index]["concentrated"]:
            days[index]["concentrated"] = before


def _change_message(start: dict, previous: list[dict]) -> str:
    if start["concentrated"]:
        trunks = max((d["active_trunks"] for d in previous), default=0)
        text = (
            f"Desde el {start['fecha']} el {start['top_share'] * 100:.0f}% del volumen "
            f"sale por {start['top_device']}; antes se repartía en hasta {trunks} troncales."
        )
        if start["top_machine_share"] >= ROUTING_AMD_NOTE_SHARE:
            text += (
                f" En {start['top_device']}, el {start['top_machine_share'] * 100:.0f}% "
                f"de las llamadas lo atiende un contestador."
            )
        return text
    return (
        f"Desde el {start['fecha']} el volumen deja de concentrarse en una sola troncal: "
        f"{start['top_device']} baja al {start['top_share'] * 100:.0f}% "
        f"({start['active_trunks']} troncales activas)."
    )


def detect_routing(day_rows: list[dict]) -> dict:
    """`day_rows`: one entry per (fecha, device) with total_calls and machine_answers."""
    by_day: dict[str, list[dict]] = {}
    for row in day_rows:
        by_day.setdefault(str(row["fecha"]), []).append(row)

    days = [
        summary
        for fecha in sorted(by_day)
        if (summary := _summarize_day(fecha, by_day[fecha])) is not None
    ]
    _smooth(days)

    changes = []
    for index in range(1, len(days)):
        if days[index]["concentrated"] != days[index - 1]["concentrated"]:
            start = days[index]
            changes.append(
                {
                    "type": "ROUTING_CHANGE",
                    "severity": "INFO",
                    "date": start["fecha"],
                    "entity": start["top_device"],
                    "message": _change_message(start, days[:index]),
                }
            )
    public_days = [
        {key: day[key] for key in ("fecha", "total_calls", "top_device", "top_share", "active_trunks", "concentrated")}
        for day in days
    ]
    return {"days": public_days, "changes": changes}
