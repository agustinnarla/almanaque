"""Spec 060: edge cases of the consolidated repository helpers."""
import pytest

from db_manager import get_connection, migrate_recreate_device
from repositories.campaigns_repo import _fraction, _rate, compute_deltas


def test_rates_without_denominator_are_none():
    assert _rate(5, 0) is None
    assert _rate(0, 100) == 0
    assert _rate(4153, 60265) == pytest.approx(0.0689, abs=1e-4)  # campaign 35, September
    assert _fraction(3, 0) is None
    assert _fraction(3, 12) == 0.25


def test_compute_deltas_skips_zero_or_missing_bases():
    day_a = {"total_calls": 0, "agent_answers": 10, "machine_answers": None, "rejected_calls": 5, "agent_answer_rate": 0.1}
    day_b = {"total_calls": 100, "agent_answers": 15, "machine_answers": 3, "rejected_calls": 5, "agent_answer_rate": 0.15}
    deltas = compute_deltas(day_a, day_b)
    assert deltas["total_calls"] is None  # base 0
    assert deltas["machine_answers"] is None  # base missing
    assert deltas["agent_answers"] == pytest.approx(50.0)
    assert deltas["rejected_calls"] == 0
    assert compute_deltas(None, day_b) is None


def test_migrate_recreate_device_from_hourly_schema_without_device(capsys):
    conn = get_connection(":memory:")
    conn.execute(
        """
        CREATE TABLE daily_campaign_metrics (
            fecha DATE NOT NULL, hora INTEGER NOT NULL, campaign TEXT NOT NULL, base TEXT NOT NULL,
            total_calls INTEGER NOT NULL, agent_answers INTEGER NOT NULL, machine_answers INTEGER NOT NULL,
            PRIMARY KEY (fecha, hora, campaign, base)
        )
        """
    )
    migrate_recreate_device(conn)
    columns = {info[1] for info in conn.execute("PRAGMA table_info(daily_campaign_metrics)")}
    assert "device" in columns
    assert "(fecha, hora, campaign, base, device)" in capsys.readouterr().out
    conn.close()
