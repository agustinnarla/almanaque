"""Smoke test against the running API (uvicorn on :8000, optionally the Vite proxy on :5173).

Usage:
    .venv/Scripts/python .claude/skills/smoke/scripts/smoke.py --campaign 35 --start 2026-09-01 --end 2026-09-15
        [--date-a 2026-09-01 --date-b 2026-09-02]   # "Comparar 2 días" endpoints
        [--campaign-b 38]                           # "Comparar campañas" endpoints
        [--min-calls 50] [--base-url http://localhost:8000] [--proxy-url http://localhost:5173]

Prints the key numbers of each endpoint so they can be checked against the
values stated in the spec. Exit code 1 if any request fails.
"""

import argparse
import json
import sys
import urllib.error
import urllib.parse
import urllib.request

MIN_SEGMENT_CALLS = 50
failures: list[str] = []


def _get(base_url: str, path: str, params: dict) -> object | None:
    url = f"{base_url}{path}?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=60) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        failures.append(f"{path} -> HTTP {error.code}")
    except urllib.error.URLError as error:
        failures.append(f"{path} -> sin conexión ({error.reason})")
    print(f"  FALLA {path}")
    return None


def _pct(value: float | None) -> str:
    return "—" if value is None else f"{value * 100:.2f}%"


def _extremes(rows: list[dict], key: str) -> str:
    candidates = [
        row for row in rows if row.get("agent_answer_rate") is not None and row["total_calls"] >= MIN_SEGMENT_CALLS
    ]
    if not candidates:
        return "sin candidatos"
    best = sorted(candidates, key=lambda r: (-r["agent_answer_rate"], -r["agent_answers"], str(r[key])))[0]
    worst = sorted(candidates, key=lambda r: (r["agent_answer_rate"], r["agent_answers"], str(r[key])))[0]
    return (
        f"mejor {best[key]} {_pct(best['agent_answer_rate'])} ({best['agent_answers']}/{best['total_calls']}) · "
        f"peor {worst[key]} {_pct(worst['agent_answer_rate'])} ({worst['agent_answers']}/{worst['total_calls']})"
    )


def _recs(payload: dict | None) -> None:
    if payload is None:
        return
    items = payload.get("recommendations", [])
    print(f"  recomendaciones: {len(items)}")
    for rec in items:
        excluded = f" · excluidos AMD: {', '.join(rec['excluded_amd'])}" if rec.get("excluded_amd") else ""
        print(f"    - {rec['category']:<9}{rec['type']:<15}{rec['entity']}{excluded}")


def _causes(payload: dict | None) -> None:
    if payload is None:
        return
    for label, key in (("causas", "root_causes"), ("positivos", "positive_drivers")):
        items = payload.get(key) or []
        print(f"  {label}: {len(items)}")
        for event in items:
            print(f"    - {event['severity']:<9}{event['type']:<20}{event['entity']}")


def range_mode(base: str, campaign: str, start: str, end: str, min_calls: int) -> None:
    prefix = f"/api/campaigns/{urllib.parse.quote(campaign)}"
    window = {"start_date": start, "end_date": end}
    print(f"\n== Campaña completa: {campaign} · {start} → {end} ==")

    summary = _get(base, f"{prefix}/summary", window)
    if summary:
        print(
            f"  summary: {summary['total_calls']} llamadas · {summary['agent_answers']} agentes · "
            f"AA {_pct(summary['agent_answer_rate'])}"
        )
    daily = _get(base, f"{prefix}/daily", window)
    if daily is not None:
        print(f"  daily: {len(daily)} días · {_extremes(daily, 'fecha')}")
    hourly = _get(base, f"{prefix}/hourly-trend", window)
    if hourly is not None:
        print(f"  hourly: {len(hourly)} horas · {_extremes(hourly, 'hora')}")
    devices = _get(base, f"{prefix}/devices", window)
    if devices is not None:
        print(f"  devices: {len(devices)} · {_extremes(devices, 'device')}")

    diag = _get(base, f"{prefix}/diagnostics", {**window, "min_calls": min_calls})
    if diag:
        congested = ", ".join(f"{g['device']} {_pct(g['congestion_rate'])}" for g in diag["congested_gateways"])
        burn = ", ".join(f"{h['hora']}h {_pct(h['busy_rate'])}" for h in diag["burn_hours"])
        peaks = ", ".join(f"{h['hora']}h {_pct(h['agent_answer_rate'])}" for h in diag["peak_hours"])
        print(f"  diagnostics: congestión [{congested}] · burn [{burn}] · pico [{peaks}]")
    _recs(_get(base, f"{prefix}/recommendations", {**window, "min_calls": min_calls}))

    bases = _get(base, f"{prefix}/bases-ranking", window)
    if bases is not None:
        top = ", ".join(f"{b['base']} {_pct(b['agent_answer_rate'])}" for b in bases[:3])
        print(f"  bases-ranking: {len(bases)} bases · top3 [{top}]")
    for kind, key in (("devices", "device"), ("hours", "hora")):
        ranking = _get(base, f"{prefix}/{kind}/ranking", {**window, "min_calls": min_calls, "limit": 5})
        if ranking:
            best = ", ".join(f"{r[key]} {r['health_score']}" for r in ranking["best"])
            worst = ", ".join(f"{r[key]} {r['health_score']}" for r in ranking["worst"])
            print(f"  {kind}/ranking: mejores [{best}] · peores [{worst}]")

    patterns = _get(base, "/api/patterns", window)
    if patterns is not None:
        own = [p for p in patterns if p["campaign"] == campaign]
        print(f"  patterns: {len(own)} alertas de la campaña (umbral AA < 5%) · {len(patterns)} en total")


def compare_mode(base: str, campaign: str, date_a: str, date_b: str, min_calls: int) -> None:
    prefix = f"/api/campaigns/{urllib.parse.quote(campaign)}"
    params = {"date_a": date_a, "date_b": date_b, "min_calls": min_calls}
    print(f"\n== Comparar 2 días: {campaign} · {date_a} vs {date_b} ==")
    diag = _get(base, f"{prefix}/compare/diagnostics", params)
    if diag and diag.get("summary"):
        s = diag["summary"]
        print(
            f"  summary: AA {_pct(s['agent_answer_rate_a'])} → {_pct(s['agent_answer_rate_b'])} "
            f"(delta {s['delta_percentage']}% rel.) · llamadas {s['total_calls_a']} → {s['total_calls_b']} "
            f"· health B {s['health_score']}"
        )
    elif diag is not None:
        print("  summary: null (falta alguno de los dos días)")
    _causes(diag)
    _recs(_get(base, f"{prefix}/compare/recommendations", params))


def cross_mode(base: str, campaign_a: str, campaign_b: str, start: str, end: str, min_calls: int) -> None:
    params = {
        "campaign_a": campaign_a,
        "campaign_b": campaign_b,
        "start_date": start,
        "end_date": end,
        "min_calls": min_calls,
    }
    print(f"\n== Comparar campañas: {campaign_a} vs {campaign_b} · {start} → {end} ==")
    data = _get(base, "/api/campaigns/compare-campaigns", params)
    if data and data.get("summary"):
        s = data["summary"]
        print(
            f"  summary: AA {_pct(s['agent_answer_rate_a'])} vs {_pct(s['agent_answer_rate_b'])} · "
            f"gateways comunes {len(data['gateways_comparison'] or [])} · "
            f"bases comunes {len(data['bases_comparison'] or [])}"
        )
    _causes(_get(base, "/api/campaigns/compare-campaigns/diagnostics", params))
    _recs(_get(base, "/api/campaigns/compare-campaigns/recommendations", params))


def proxy_check(base: str, proxy: str, campaign: str, start: str, end: str) -> None:
    print(f"\n== Proxy Vite: {proxy} ==")
    path = f"/api/campaigns/{urllib.parse.quote(campaign)}/summary"
    window = {"start_date": start, "end_date": end}
    direct = _get(base, path, window)
    proxied = _get(proxy, path, window)
    if direct is not None and proxied is not None:
        print("  OK: el proxy devuelve lo mismo que el backend." if direct == proxied else "  DIFERENCIA entre proxy y backend.")
        if direct != proxied:
            failures.append("proxy distinto del backend")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--campaign", required=True)
    parser.add_argument("--start", required=True)
    parser.add_argument("--end", required=True)
    parser.add_argument("--date-a")
    parser.add_argument("--date-b")
    parser.add_argument("--campaign-b")
    parser.add_argument("--min-calls", type=int, default=50)
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--proxy-url")
    args = parser.parse_args()

    range_mode(args.base_url, args.campaign, args.start, args.end, args.min_calls)
    if args.date_a and args.date_b:
        compare_mode(args.base_url, args.campaign, args.date_a, args.date_b, args.min_calls)
    if args.campaign_b:
        cross_mode(args.base_url, args.campaign, args.campaign_b, args.start, args.end, args.min_calls)
    if args.proxy_url:
        proxy_check(args.base_url, args.proxy_url, args.campaign, args.start, args.end)

    if failures:
        print("\nFALLAS:")
        for failure in failures:
            print(f"  {failure}")
        return 1
    print("\nSmoke OK: todos los endpoints respondieron.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
