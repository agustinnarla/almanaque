import pandas as pd
import pytest

from data_cleaner import (
    DEFAULT_DEVICE,
    GENERIC_CAMPAIGN,
    MissingCriticalColumnsError,
    SENTINEL_DATE,
    clean_dataframe,
    extract_campaign,
    validate_columns,
)
from metrics_engine import compute_metrics


def make_base_frame(rows: int = 1, **overrides) -> pd.DataFrame:
    row = {
        "FECHA": [20260901] * rows,
        "BASE": ["Campaña A"] * rows,
        "INICIO": [pd.Timestamp("2026-09-01 10:00:00")] * rows,
        "CONEXION": [pd.Timestamp("2026-09-01 10:00:30")] * rows,
        "FIN": [pd.Timestamp("2026-09-01 10:01:00")] * rows,
        "ESTADO": ["ANSWER"] * rows,
        "SUB_ESTADO": ["AGENT"] * rows,
        "Dispositivo": ["gw37"] * rows,
    }
    row.update(overrides)
    return pd.DataFrame(row)


def test_validate_columns_reports_missing_optional(capsys):
    df = make_base_frame().drop(columns=["ESTADO"])
    missing = validate_columns(df)
    assert missing == ["ESTADO"]
    captured = capsys.readouterr()
    assert "Alerta" in captured.out
    assert "ESTADO" in captured.out


def test_validate_columns_raises_on_critical_missing():
    df = make_base_frame().drop(columns=["CONEXION"])
    with pytest.raises(MissingCriticalColumnsError):
        validate_columns(df)


def test_clean_fills_generic_campaign_and_sentinel_date():
    df = make_base_frame(BASE=[None], FECHA=[None])
    cleaned = clean_dataframe(df)
    assert cleaned["BASE"].iloc[0] == GENERIC_CAMPAIGN
    assert cleaned["FECHA"].iloc[0] == SENTINEL_DATE


def test_clean_replaces_fake_connection_with_nat():
    df = make_base_frame(CONEXION=[pd.Timestamp("2000-01-01 00:00:00")])
    cleaned = clean_dataframe(df)
    assert pd.isna(cleaned["CONEXION"].iloc[0])


def test_clean_keeps_hour_19_and_drops_hour_20():
    df = make_base_frame(
        rows=2,
        INICIO=[
            pd.Timestamp("2026-09-01 19:59:59"),
            pd.Timestamp("2026-09-01 20:00:00"),
        ],
        CONEXION=[
            pd.Timestamp("2026-09-01 20:00:10"),
            pd.Timestamp("2026-09-01 20:00:30"),
        ],
        FIN=[
            pd.Timestamp("2026-09-01 20:01:00"),
            pd.Timestamp("2026-09-01 20:02:00"),
        ],
        ESTADO=["ANSWER", "ANSWER"],
        SUB_ESTADO=["AGENT", "AGENT"],
    )
    cleaned = clean_dataframe(df)
    assert len(cleaned) == 1
    assert cleaned["INICIO"].iloc[0] == pd.Timestamp("2026-09-01 19:59:59")


def test_metrics_exclude_nat_and_machine_from_wait():
    df = clean_dataframe(
        pd.concat(
            [
                make_base_frame(
                    FECHA=[20260901],
                    BASE=["Campaña A"],
                    INICIO=[pd.Timestamp("2026-09-01 10:00:00")],
                    CONEXION=[pd.Timestamp("2026-09-01 10:00:20")],
                    FIN=[pd.Timestamp("2026-09-01 10:00:40")],
                    ESTADO=["ANSWER"],
                    SUB_ESTADO=["AGENT"],
                ),
                make_base_frame(
                    FECHA=[20260901],
                    BASE=["Campaña A"],
                    INICIO=[pd.Timestamp("2026-09-01 11:00:00")],
                    CONEXION=[pd.Timestamp("2000-01-01 00:00:00")],
                    FIN=[pd.Timestamp("2026-09-01 11:00:50")],
                    ESTADO=["NO ANSWER"],
                    SUB_ESTADO=[None],
                ),
                make_base_frame(
                    FECHA=[20260901],
                    BASE=["Campaña A"],
                    INICIO=[pd.Timestamp("2026-09-01 12:00:00")],
                    CONEXION=[pd.Timestamp("2026-09-01 12:00:40")],
                    FIN=[pd.Timestamp("2026-09-01 12:01:00")],
                    ESTADO=["ANSWER"],
                    SUB_ESTADO=["ANSWERING_MACHINE"],
                ),
            ],
            ignore_index=True,
        )
    )
    metrics = compute_metrics(df)

    assert metrics["total_calls"].sum() == 3
    assert metrics["agent_answers"].sum() == 1
    assert metrics["machine_answers"].sum() == 1
    human_wait = metrics.dropna(subset=["avg_wait_time_sec"])
    assert human_wait["avg_wait_time_sec"].iloc[0] == pytest.approx(20.0)
    abandon = metrics.dropna(subset=["avg_abandon_time_sec"])
    assert abandon["avg_abandon_time_sec"].iloc[0] == pytest.approx(50.0)


def test_metrics_abandon_is_fin_minus_inicio_without_connection():
    df = clean_dataframe(
        make_base_frame(
            INICIO=[pd.Timestamp("2026-09-01 10:00:00")],
            CONEXION=[pd.Timestamp("2000-01-01")],
            FIN=[pd.Timestamp("2026-09-01 10:00:45")],
            ESTADO=["NO ANSWER"],
            SUB_ESTADO=[None],
        )
    )
    metrics = compute_metrics(df)
    assert metrics["avg_abandon_time_sec"].iloc[0] == pytest.approx(45.0)
    assert pd.isna(metrics["avg_wait_time_sec"].iloc[0])


def test_metrics_empty_frame_returns_schema():
    metrics = compute_metrics(pd.DataFrame())
    assert list(metrics.columns) == [
        "fecha",
        "hora",
        "campaign",
        "base",
        "device",
        "total_calls",
        "agent_answers",
        "machine_answers",
        "busy_calls",
        "congestion_calls",
        "avg_wait_time_sec",
        "avg_abandon_time_sec",
    ]


def test_extract_campaign_from_prefixed_filename():
    assert extract_campaign("data/35_01-09.xls") == "35"
    assert extract_campaign("Ventas_01-09.xlsx") == "Ventas"


def test_extract_campaign_fallback_without_underscore():
    assert extract_campaign("data/01-09.xls") == "Sin Campaña"


def test_clean_dataframe_assigns_campaign():
    cleaned = clean_dataframe(make_base_frame(), campaign="35")
    assert cleaned["campaign"].iloc[0] == "35"


def test_metrics_keep_campaign_column():
    df = clean_dataframe(make_base_frame(), campaign="35")
    metrics = compute_metrics(df)
    assert metrics["campaign"].iloc[0] == "35"


def test_clean_extracts_hour_from_inicio():
    df = make_base_frame(INICIO=[pd.Timestamp("2026-09-01 10:35:12")])
    cleaned = clean_dataframe(df)
    assert cleaned["hora"].iloc[0] == 10


def test_metrics_split_by_hour():
    df = clean_dataframe(
        make_base_frame(
            rows=2,
            INICIO=[
                pd.Timestamp("2026-09-01 09:10:00"),
                pd.Timestamp("2026-09-01 10:10:00"),
            ],
            CONEXION=[
                pd.Timestamp("2026-09-01 09:10:20"),
                pd.Timestamp("2026-09-01 10:10:20"),
            ],
            FIN=[
                pd.Timestamp("2026-09-01 09:11:00"),
                pd.Timestamp("2026-09-01 10:11:00"),
            ],
        )
    )
    metrics = compute_metrics(df)
    assert list(metrics["hora"]) == [9, 10]
    assert len(metrics) == 2


def test_clean_normalizes_device_trim_and_upper():
    df = make_base_frame(Dispositivo=["  gw37  "])
    cleaned = clean_dataframe(df)
    assert cleaned["device"].iloc[0] == "GW37"


def test_clean_device_null_and_empty_become_desconocido():
    df = make_base_frame(rows=2, Dispositivo=[None, "   "])
    cleaned = clean_dataframe(df)
    assert list(cleaned["device"]) == [DEFAULT_DEVICE, DEFAULT_DEVICE]


def test_clean_device_missing_column_becomes_desconocido(capsys):
    df = make_base_frame().drop(columns=["Dispositivo"])
    cleaned = clean_dataframe(df)
    assert cleaned["device"].iloc[0] == DEFAULT_DEVICE
    captured = capsys.readouterr()
    assert "Alerta" in captured.out
    assert "Dispositivo" in captured.out


def test_metrics_split_by_device():
    df = clean_dataframe(
        make_base_frame(
            rows=2,
            Dispositivo=["gw37", "GW20"],
            ESTADO=["BUSY", "CONGESTION"],
            CONEXION=[pd.NaT, pd.NaT],
        )
    )
    metrics = compute_metrics(df)
    assert sorted(metrics["device"]) == ["GW20", "GW37"]
    assert len(metrics) == 2


def test_metrics_count_busy_and_congestion():
    df = clean_dataframe(
        make_base_frame(
            rows=4,
            Dispositivo=["gw37"] * 4,
        ESTADO=["BUSY", "BUSY", "CONGESTION", "ANSWER"],
        SUB_ESTADO=[None, None, None, "AGENT"],
        )
    )
    metrics = compute_metrics(df)
    assert metrics["busy_calls"].iloc[0] == 2
    assert metrics["congestion_calls"].iloc[0] == 1
    assert metrics["agent_answers"].iloc[0] == 1
    assert metrics["total_calls"].iloc[0] == 4


def test_busy_and_congestion_are_subset_of_rejected():
    df = clean_dataframe(
        make_base_frame(
            rows=5,
            Dispositivo=["gw37"] * 5,
            ESTADO=["BUSY", "CONGESTION", "NOANSWER", "ANSWER", "REJECTED"],
            SUB_ESTADO=[None, None, None, "ANSWERING_MACHINE", None],
            CONEXION=[pd.NaT, pd.NaT, pd.NaT, pd.Timestamp("2026-09-01 10:00:30"), pd.NaT],
        )
    )
    metrics = compute_metrics(df).iloc[0]
    rejected = (
        int(metrics["total_calls"])
        - int(metrics["agent_answers"])
        - int(metrics["machine_answers"])
    )
    assert int(metrics["busy_calls"]) + int(metrics["congestion_calls"]) <= rejected


def test_estados_case_insensitive_after_clean():
    df = make_base_frame(ESTADO=["busy"], Dispositivo=["gw37"], CONEXION=[pd.NaT])
    cleaned = clean_dataframe(df)
    assert cleaned["ESTADO"].iloc[0] == "BUSY"
    metrics = compute_metrics(cleaned)
    assert metrics["busy_calls"].iloc[0] == 1


def test_agent_answers_requires_agent_substate():
    df = clean_dataframe(
        make_base_frame(
            rows=4,
            ESTADO=["ANSWER"] * 4,
            SUB_ESTADO=["AGENT", "QUEUED", None, "agent"],
            CONEXION=[pd.Timestamp("2026-09-01 10:00:30")] * 4,
        )
    )
    metrics = compute_metrics(df)
    assert metrics["agent_answers"].iloc[0] == 2


def test_wait_time_only_for_agent_substate():
    df = clean_dataframe(
        make_base_frame(
            rows=3,
            ESTADO=["ANSWER"] * 3,
            SUB_ESTADO=["AGENT", "QUEUED", None],
            CONEXION=[
                pd.Timestamp("2026-09-01 10:00:20"),
                pd.Timestamp("2026-09-01 10:00:40"),
                pd.Timestamp("2026-09-01 10:01:00"),
            ],
        )
    )
    metrics = compute_metrics(df)
    assert metrics["agent_answers"].iloc[0] == 1
    assert metrics["avg_wait_time_sec"].iloc[0] == pytest.approx(20.0)
