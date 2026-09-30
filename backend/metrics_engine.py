import pandas as pd

ANSWER_STATE = "ANSWER"
MACHINE_SUBSTATE = "ANSWERING_MACHINE"
AGENT_SUBSTATE = "AGENT"
BUSY_STATE = "BUSY"
CONGESTION_STATE = "CONGESTION"

METRIC_COLUMNS = [
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

GROUP_KEYS = ["FECHA", "hora", "campaign", "BASE", "device"]
GROUP_RENAME = {"FECHA": "fecha", "BASE": "base"}
MERGE_KEYS = ["fecha", "hora", "campaign", "base", "device"]


def compute_metrics(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=METRIC_COLUMNS)

    working = df.copy()

    is_machine = working["SUB_ESTADO"].eq(MACHINE_SUBSTATE).fillna(False).astype(bool)
    is_agent = (
        working["ESTADO"].eq(ANSWER_STATE)
        & working["SUB_ESTADO"].eq(AGENT_SUBSTATE)
    ).fillna(False).astype(bool)
    is_connected = working["CONEXION"].notna()
    is_human_connected = is_agent & is_connected

    working["is_agent"] = is_agent
    working["wait_time_sec"] = (working["CONEXION"] - working["INICIO"]).dt.total_seconds()
    working["abandon_time_sec"] = (working["FIN"] - working["INICIO"]).dt.total_seconds()

    metrics = (
        working.groupby(GROUP_KEYS, dropna=False)
        .agg(
            total_calls=("INICIO", "size"),
            agent_answers=("is_agent", "sum"),
            machine_answers=(
                "SUB_ESTADO",
                lambda series: int((series == MACHINE_SUBSTATE).sum()),
            ),
            busy_calls=(
                "ESTADO",
                lambda series: int((series == BUSY_STATE).sum()),
            ),
            congestion_calls=(
                "ESTADO",
                lambda series: int((series == CONGESTION_STATE).sum()),
            ),
        )
        .reset_index()
        .rename(columns=GROUP_RENAME)
    )

    valid_wait = working.loc[is_human_connected & (working["wait_time_sec"] >= 0)]
    wait_by_group = (
        valid_wait.groupby(GROUP_KEYS)["wait_time_sec"]
        .mean()
        .reset_index(name="avg_wait_time_sec")
        .rename(columns=GROUP_RENAME)
    )

    valid_abandon = working.loc[~is_connected & (working["abandon_time_sec"] >= 0)]
    abandon_by_group = (
        valid_abandon.groupby(GROUP_KEYS)["abandon_time_sec"]
        .mean()
        .reset_index(name="avg_abandon_time_sec")
        .rename(columns=GROUP_RENAME)
    )

    metrics = metrics.merge(wait_by_group, on=MERGE_KEYS, how="left")
    metrics = metrics.merge(abandon_by_group, on=MERGE_KEYS, how="left")
    return metrics
