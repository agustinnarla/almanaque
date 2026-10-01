from pathlib import Path

import pandas as pd

from db_manager import DEFAULT_CAMPAIGN

REQUIRED_COLUMNS = ["FECHA", "BASE", "INICIO", "CONEXION", "FIN", "ESTADO", "SUB_ESTADO"]
CRITICAL_COLUMNS = ["FECHA", "BASE", "INICIO", "CONEXION", "FIN"]
SENTINEL_DATE = pd.Timestamp("1970-01-01")
FAKE_CONNECTION_DATE = pd.Timestamp("2000-01-01")
GENERIC_CAMPAIGN = "Campaña Sin Asignar"
MAX_START_HOUR = 20
DEFAULT_DEVICE = "DESCONOCIDO"


class MissingCriticalColumnsError(ValueError):
    pass


def extract_campaign(file_path: Path | str) -> str:
    stem = Path(file_path).stem
    if "_" in stem:
        return stem.split("_", 1)[0]
    return DEFAULT_CAMPAIGN


def _parse_fecha(series: pd.Series) -> pd.Series:
    if pd.api.types.is_numeric_dtype(series):
        return pd.to_datetime(series.astype("Int64").astype(str), format="%Y%m%d", errors="coerce")
    return pd.to_datetime(series, errors="coerce")


def validate_columns(df: pd.DataFrame) -> list[str]:
    missing = [column for column in REQUIRED_COLUMNS if column not in df.columns]
    missing_critical = [column for column in missing if column in CRITICAL_COLUMNS]
    if missing_critical:
        print(
            "Alerta: faltan columnas críticas "
            f"{missing_critical}; se omite este archivo."
        )
        raise MissingCriticalColumnsError(f"Columnas críticas faltantes: {missing_critical}")
    if missing:
        print(f"Alerta: faltan columnas opcionales {missing}; se continúa con las disponibles.")
    return missing


def clean_dataframe(df: pd.DataFrame, campaign: str | None = None) -> pd.DataFrame:
    validate_columns(df)
    cleaned = df.copy()

    cleaned["FECHA"] = _parse_fecha(cleaned["FECHA"])
    cleaned["FECHA"] = cleaned["FECHA"].fillna(SENTINEL_DATE)

    for column in ("INICIO", "CONEXION", "FIN"):
        cleaned[column] = pd.to_datetime(cleaned[column], errors="coerce")

    cleaned.loc[
        cleaned["CONEXION"].dt.date == FAKE_CONNECTION_DATE.date(),
        "CONEXION",
    ] = pd.NaT

    cleaned["BASE"] = cleaned["BASE"].astype("string").fillna(GENERIC_CAMPAIGN)
    cleaned.loc[cleaned["BASE"].str.strip() == "", "BASE"] = GENERIC_CAMPAIGN

    cleaned = cleaned.dropna(subset=["INICIO"])
    cleaned = cleaned[cleaned["INICIO"].dt.hour < MAX_START_HOUR]
    cleaned["hora"] = cleaned["INICIO"].dt.hour.astype(int)

    cleaned["ESTADO"] = cleaned["ESTADO"].astype("string")
    cleaned["SUB_ESTADO"] = cleaned["SUB_ESTADO"].astype("string")
    cleaned["campaign"] = campaign if campaign is not None else DEFAULT_CAMPAIGN

    if "Dispositivo" not in cleaned.columns:
        print("Alerta: falta la columna Dispositivo; se usa device=DESCONOCIDO.")
        cleaned["device"] = DEFAULT_DEVICE
    else:
        cleaned["device"] = cleaned["Dispositivo"].astype("string").str.strip().str.upper()
        cleaned.loc[cleaned["device"].isna() | (cleaned["device"] == ""), "device"] = DEFAULT_DEVICE

    cleaned["ESTADO"] = cleaned["ESTADO"].str.upper()
    cleaned["SUB_ESTADO"] = cleaned["SUB_ESTADO"].str.upper().str.strip()

    return cleaned.reset_index(drop=True)


def read_all_sheets(file_path: Path | str, **kwargs) -> pd.DataFrame:
    sheets = [sheet for sheet in pd.read_excel(file_path, sheet_name=None, **kwargs).values() if not sheet.empty]
    if not sheets:
        return pd.DataFrame()
    return pd.concat(sheets, ignore_index=True)


def load_and_clean(file_path: Path | str) -> pd.DataFrame:
    df = read_all_sheets(file_path)
    return clean_dataframe(df, campaign=extract_campaign(file_path))
