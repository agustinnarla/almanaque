from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
VALID_EXTENSIONS = (".xls", ".xlsx")


def scan_data_dir(data_dir: Path | str = DATA_DIR) -> list[Path]:
    directory = Path(data_dir)
    if not directory.exists():
        print(f"Alerta: el directorio {directory} no existe.")
        return []
    files = sorted(
        path for path in directory.iterdir()
        if path.is_file() and path.suffix.lower() in VALID_EXTENSIONS
    )
    return files
