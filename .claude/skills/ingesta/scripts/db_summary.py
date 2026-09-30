"""Read-only summary of callcenter_metrics.db, per campaign and optionally per day.

Usage:
    .venv/Scripts/python .claude/skills/ingesta/scripts/db_summary.py
    ... db_summary.py --out <file.json>          # also store the summary (pre-pipeline)
    ... db_summary.py --compare <file.json>      # diff against a stored summary
    ... db_summary.py --campaign 92              # per-day breakdown of one campaign
"""

import argparse
import json
import sqlite3
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[4]
DB_PATH = PROJECT_DIR / "callcenter_metrics.db"
DEFAULT_CAMPAIGN = "Sin Campaña"
SENTINEL_DATE = "1970-01-01"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _campaigns(conn: sqlite3.Connection) -> dict[str, dict]:
    rows = conn.execute(
        """
        SELECT campaign, COUNT(*) AS rows_count, COUNT(DISTINCT fecha) AS days,
               MIN(fecha) AS first_day, MAX(fecha) AS last_day,
               SUM(total_calls) AS total_calls, SUM(agent_answers) AS agent_answers,
               SUM(machine_answers) AS machine_answers
        FROM daily_campaign_metrics
        GROUP BY campaign
        ORDER BY campaign
        """
    ).fetchall()
    return {
        str(row["campaign"]): {
            "rows": row["rows_count"],
            "days": row["days"],
            "first_day": row["first_day"],
            "last_day": row["last_day"],
            "total_calls": row["total_calls"],
            "agent_answers": row["agent_answers"],
            "machine_answers": row["machine_answers"],
            "aa_rate": round(row["agent_answers"] / row["total_calls"], 4) if row["total_calls"] else None,
        }
        for row in rows
    }


def _print_campaigns(summary: dict[str, dict]) -> None:
    print(f"{'Campaña':<14}{'Filas':>7}{'Días':>6}  {'Desde':<11}{'Hasta':<11}{'Llamadas':>11}{'Agentes':>9}{'AA':>8}")
    for campaign, data in summary.items():
        rate = f"{data['aa_rate'] * 100:.2f}%" if data["aa_rate"] is not None else "—"
        print(
            f"{campaign:<14}{data['rows']:>7}{data['days']:>6}  {data['first_day']:<11}"
            f"{data['last_day']:<11}{data['total_calls']:>11}{data['agent_answers']:>9}{rate:>8}"
        )


def _sanity(conn: sqlite3.Connection, summary: dict[str, dict]) -> list[str]:
    issues = []
    default_rows = conn.execute(
        "SELECT COUNT(*) FROM daily_campaign_metrics WHERE campaign = ?", (DEFAULT_CAMPAIGN,)
    ).fetchone()[0]
    if default_rows:
        issues.append(f"{default_rows} filas con campaña '{DEFAULT_CAMPAIGN}' (archivo sin prefijo).")
    sentinel_rows = conn.execute(
        "SELECT COUNT(*) FROM daily_campaign_metrics WHERE fecha = ?", (SENTINEL_DATE,)
    ).fetchone()[0]
    if sentinel_rows:
        issues.append(f"{sentinel_rows} filas con fecha {SENTINEL_DATE} (FECHA inválida).")
    all_days = {row[0] for row in conn.execute("SELECT DISTINCT fecha FROM daily_campaign_metrics")}
    for campaign in summary:
        days = {
            row[0]
            for row in conn.execute(
                "SELECT DISTINCT fecha FROM daily_campaign_metrics WHERE campaign = ?", (campaign,)
            )
        }
        missing = sorted(all_days - days - {SENTINEL_DATE})
        if missing:
            issues.append(f"Campaña {campaign} sin datos en: {', '.join(missing)}.")
    return issues


def _print_days(conn: sqlite3.Connection, campaign: str) -> None:
    rows = conn.execute(
        """
        SELECT fecha, COUNT(*) AS rows_count, SUM(total_calls) AS total_calls,
               SUM(agent_answers) AS agent_answers, MIN(hora) AS first_hour, MAX(hora) AS last_hour
        FROM daily_campaign_metrics
        WHERE campaign = ?
        GROUP BY fecha
        ORDER BY fecha
        """,
        (campaign,),
    ).fetchall()
    print(f"\nDetalle por día — campaña {campaign}")
    print(f"{'Fecha':<12}{'Filas':>7}{'Llamadas':>10}{'Agentes':>9}{'AA':>8}  Horas")
    for row in rows:
        rate = f"{row['agent_answers'] / row['total_calls'] * 100:.2f}%" if row["total_calls"] else "—"
        print(
            f"{row['fecha']:<12}{row['rows_count']:>7}{row['total_calls']:>10}"
            f"{row['agent_answers']:>9}{rate:>8}  {row['first_hour']}–{row['last_hour']}"
        )


def _compare(before: dict[str, dict], after: dict[str, dict]) -> None:
    print("\nComparación contra el resumen previo:")
    for campaign in sorted(set(before) | set(after)):
        if campaign not in before:
            print(f"  {campaign}: NUEVA ({after[campaign]['rows']} filas, {after[campaign]['total_calls']} llamadas)")
        elif campaign not in after:
            print(f"  {campaign}: ELIMINADA de la DB")
        elif before[campaign] == after[campaign]:
            print(f"  {campaign}: intacta ({after[campaign]['rows']} filas)")
        else:
            changes = [
                f"{key} {before[campaign][key]} -> {after[campaign][key]}"
                for key in ("rows", "days", "total_calls", "agent_answers")
                if before[campaign][key] != after[campaign][key]
            ]
            print(f"  {campaign}: CAMBIÓ ({'; '.join(changes)})")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path)
    parser.add_argument("--compare", type=Path)
    parser.add_argument("--campaign")
    args = parser.parse_args()

    if not DB_PATH.exists():
        print(f"No existe la DB en {DB_PATH}.")
        return 1
    conn = _connect()
    summary = _campaigns(conn)
    _print_campaigns(summary)

    issues = _sanity(conn, summary)
    print("\nChequeos:" if issues else "\nChequeos: OK (sin 'Sin Campaña', sin fecha 1970, sin días faltantes).")
    for issue in issues:
        print(f"  ATENCIÓN: {issue}")

    if args.campaign:
        _print_days(conn, args.campaign)
    if args.compare:
        _compare(json.loads(args.compare.read_text(encoding="utf-8")), summary)
    if args.out:
        args.out.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nResumen guardado en {args.out}")
    conn.close()
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
