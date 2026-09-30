"""Snapshot and verify the project invariants that every spec must keep.

Usage (from any directory):
    .venv/Scripts/python .claude/scripts/baseline.py save    # store the current state
    .venv/Scripts/python .claude/scripts/baseline.py check   # compare against it
    .venv/Scripts/python .claude/scripts/baseline.py names   # campaign prefix check for /data

The snapshot covers:
    - /data: name, size and mtime (ns) of every file (read-only rule).
    - frontend/package.json: dependencies + devDependencies.
    - Python venv: `pip freeze`.

Only reads /data (os.stat); the snapshot lives in .claude/baseline.json.
Exit code of `check`: 0 = no changes, 1 = changes detected.
"""

import json
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_DIR / "data"
PACKAGE_JSON = PROJECT_DIR / "frontend" / "package.json"
VENV_PYTHON = PROJECT_DIR / ".venv" / "Scripts" / "python.exe"
BASELINE_FILE = PROJECT_DIR / ".claude" / "baseline.json"
DATA_EXTENSIONS = (".xls", ".xlsx")
CAMPAIGN_NAME = re.compile(r"^\d+_\d{2}-\d{2}(_h\d+)?\.xlsx?$", re.IGNORECASE)


def _data_snapshot() -> dict:
    files = {}
    for path in sorted(DATA_DIR.iterdir()):
        if path.is_file():
            stat = path.stat()
            files[path.name] = {"size": stat.st_size, "mtime_ns": stat.st_mtime_ns}
    return files


def _npm_snapshot() -> dict:
    package = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    return {
        "dependencies": package.get("dependencies", {}),
        "devDependencies": package.get("devDependencies", {}),
    }


def _pip_snapshot() -> list[str]:
    result = subprocess.run(
        [str(VENV_PYTHON), "-m", "pip", "freeze"],
        capture_output=True,
        text=True,
        check=True,
    )
    return sorted(line for line in result.stdout.splitlines() if line.strip())


def _current() -> dict:
    return {
        "saved_at": datetime.now().isoformat(timespec="seconds"),
        "data": _data_snapshot(),
        "npm": _npm_snapshot(),
        "pip": _pip_snapshot(),
    }


def save() -> int:
    snapshot = _current()
    BASELINE_FILE.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Baseline guardado en {BASELINE_FILE.relative_to(PROJECT_DIR)}")
    print(f"  /data: {len(snapshot['data'])} archivos")
    print(
        f"  npm: {len(snapshot['npm']['dependencies'])} dependencies + "
        f"{len(snapshot['npm']['devDependencies'])} devDependencies"
    )
    print(f"  pip: {len(snapshot['pip'])} paquetes")
    return 0


def _diff_dict(label: str, before: dict, after: dict) -> list[str]:
    lines = []
    for key in sorted(set(before) | set(after)):
        if key not in before:
            lines.append(f"  [{label}] NUEVO: {key} = {after[key]}")
        elif key not in after:
            lines.append(f"  [{label}] ELIMINADO: {key}")
        elif before[key] != after[key]:
            lines.append(f"  [{label}] CAMBIADO: {key}: {before[key]} -> {after[key]}")
    return lines


def check() -> int:
    if not BASELINE_FILE.exists():
        print("No hay baseline. Ejecutá primero: baseline.py save")
        return 1
    baseline = json.loads(BASELINE_FILE.read_text(encoding="utf-8"))
    current = _current()
    print(f"Comparando contra el baseline del {baseline['saved_at']}")

    problems = []
    data_lines = _diff_dict("data", baseline["data"], current["data"])
    problems += data_lines
    problems += _diff_dict("npm dependencies", baseline["npm"]["dependencies"], current["npm"]["dependencies"])
    problems += _diff_dict(
        "npm devDependencies", baseline["npm"]["devDependencies"], current["npm"]["devDependencies"]
    )
    pip_before, pip_after = set(baseline["pip"]), set(current["pip"])
    problems += [f"  [pip] NUEVO/CAMBIADO: {pkg}" for pkg in sorted(pip_after - pip_before)]
    problems += [f"  [pip] ELIMINADO/CAMBIADO: {pkg}" for pkg in sorted(pip_before - pip_after)]

    print(f"  /data: {len(current['data'])} archivos (baseline {len(baseline['data'])})")
    if not problems:
        print("OK: /data intacto (tamaño y mtime), sin dependencias npm ni pip nuevas.")
        return 0
    print("CAMBIOS DETECTADOS:")
    for line in problems:
        print(line)
    return 1


def names() -> int:
    wrong = [
        path.name
        for path in sorted(DATA_DIR.iterdir())
        if path.is_file()
        and path.suffix.lower() in DATA_EXTENSIONS
        and not CAMPAIGN_NAME.match(path.name)
    ]
    others = [
        path.name
        for path in sorted(DATA_DIR.iterdir())
        if path.is_file() and path.suffix.lower() not in DATA_EXTENSIONS
    ]
    by_campaign: dict[str, int] = {}
    for path in DATA_DIR.iterdir():
        if path.is_file() and CAMPAIGN_NAME.match(path.name):
            campaign = path.name.split("_", 1)[0]
            by_campaign[campaign] = by_campaign.get(campaign, 0) + 1
    print("Archivos por campaña: " + ", ".join(f"{c}={n}" for c, n in sorted(by_campaign.items())))
    if others:
        print("Ignorados por el pipeline (extensión no .xls/.xlsx): " + ", ".join(others))
    if wrong:
        print("SIN PREFIJO DE CAMPAÑA (el pipeline los cargaría como 'Sin Campaña' o mal):")
        for name in wrong:
            print(f"  {name}")
        return 1
    print("OK: todos los .xls/.xlsx siguen el patrón NN_DD-MM[_hN].xls[x].")
    return 0


COMMANDS = {"save": save, "check": check, "names": names}

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in COMMANDS:
        print(__doc__)
        sys.exit(2)
    sys.exit(COMMANDS[sys.argv[1]]())
