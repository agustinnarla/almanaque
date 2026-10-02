"""Full regression gate required by every spec's "Criterios de Finalización".

Runs, in order: pytest with coverage, vitest with coverage (npm run
test:coverage), npx tsc -b, npm run lint, npm run build, then the /data +
dependencies baseline check — the same gates as CI (.github/workflows/ci.yml).
Coverage floors live in .coveragerc and frontend/vite.config.ts. Prints one
summary line per step (with test counts and coverage when available) and the
tail of the output for failures.

Usage:
    .venv/Scripts/python .claude/skills/cerrar-spec/scripts/run_checks.py [--expected-pytest N]
Exit code: 0 if every step passed (and pytest matches N when given), 1 otherwise.
"""

import argparse
import re
import os
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[4]
FRONTEND_DIR = PROJECT_DIR / "frontend"
VENV_PYTHON = PROJECT_DIR / ".venv" / "Scripts" / "python.exe"
BASELINE_SCRIPT = PROJECT_DIR / ".claude" / "scripts" / "baseline.py"
TAIL_LINES = 40
ANSI = re.compile(r"\x1b\[[0-9;]*m")


def _run(command: str, cwd: Path) -> tuple[int, str]:
    # Child Python processes must emit UTF-8 so their output decodes correctly
    # even when stdout is a pipe (Windows would otherwise use cp1252).
    result = subprocess.run(
        command,
        cwd=cwd,
        shell=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
    )
    return result.returncode, ANSI.sub("", result.stdout + result.stderr)


def _pytest_count(output: str) -> str:
    match = re.search(r"(\d+) passed", output)
    failed = re.search(r"(\d+) failed", output)
    parts = []
    if match:
        parts.append(f"{match.group(1)} passed")
    if failed:
        parts.append(f"{failed.group(1)} failed")
    coverage = re.search(r"Total coverage: ([\d.]+%)", output)
    if coverage:
        parts.append(f"cobertura {coverage.group(1)}")
    return ", ".join(parts)


def _vitest_count(output: str) -> str:
    match = re.search(r"Tests\s+(.+?\(\d+\))", output)
    detail = match.group(1).strip() if match else ""
    lines = re.search(r"Lines\s*:\s*([\d.]+%)", output)
    branches = re.search(r"Branches\s*:\s*([\d.]+%)", output)
    if lines and branches:
        detail += f", cobertura líneas {lines.group(1)} · ramas {branches.group(1)}"
    return detail


def _lint_count(output: str) -> str:
    warnings = len(re.findall(r":\d+:\d+: warning ", output))
    errors = len(re.findall(r":\d+:\d+: error ", output))
    return f"{warnings} warnings, {errors} errors"


def main() -> int:
    sys.stdout.reconfigure(errors="replace")
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected-pytest", type=int, default=None)
    args = parser.parse_args()

    steps = [
        ("pytest --cov", f'"{VENV_PYTHON}" -m pytest -q --cov --cov-report=term', PROJECT_DIR, _pytest_count),
        ("npm run test:coverage", "npm run test:coverage", FRONTEND_DIR, _vitest_count),
        ("npx tsc -b", "npx tsc -b", FRONTEND_DIR, None),
        ("npm run lint", "npm run lint", FRONTEND_DIR, _lint_count),
        ("npm run build", "npm run build", FRONTEND_DIR, None),
        ("baseline check", f'"{VENV_PYTHON}" "{BASELINE_SCRIPT}" check', PROJECT_DIR, None),
    ]

    all_ok = True
    report = []
    for label, command, cwd, counter in steps:
        print(f"... {label}", flush=True)
        code, output = _run(command, cwd)
        detail = counter(output) if counter else ""
        ok = code == 0
        if label == "pytest --cov" and args.expected_pytest is not None:
            passed = re.search(r"(\d+) passed", output)
            if not passed or int(passed.group(1)) != args.expected_pytest:
                ok = False
                detail += f" (se esperaban {args.expected_pytest})"
        all_ok = all_ok and ok
        report.append((label, ok, detail))
        if not ok or label == "baseline check":
            tail = output.strip().splitlines()[-TAIL_LINES:]
            print("\n".join(f"    {line}" for line in tail))

    print("\nResumen de regresión:")
    for label, ok, detail in report:
        mark = "OK  " if ok else "FALLA"
        print(f"  [{mark}] {label}" + (f" — {detail}" if detail else ""))
    print("\nRESULTADO: " + ("todo en verde." if all_ok else "hay fallas, no cerrar la spec."))
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
