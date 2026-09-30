"""PreToolUse hook: keeps the raw files in /data read-only.

- Write / Edit / NotebookEdit targeting /data -> deny.
- Bash / PowerShell commands that mention /data together with a mutating
  verb (rm, mv, Remove-Item, redirection, to_excel, ...) -> ask, so the user
  can still authorize one-off renames like the ones in Specs 022 / 029.
"""

import json
import os
import re
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_DIR / "data"

FILE_TOOLS = {"Write", "Edit", "NotebookEdit", "MultiEdit"}
SHELL_TOOLS = {"Bash", "PowerShell"}

DATA_REFERENCE = re.compile(r"(^|[\s\"'=(\\/])data([\\/]|[\s\"')]|$)", re.IGNORECASE)
MUTATING_COMMAND = re.compile(
    r"\b("
    r"rm|rmdir|mv|cp|del|erase|ren|rename|move|copy|touch|truncate|shred|unlink|"
    r"chmod|chown|mkdir|sed\s+-i|"
    r"remove-item|move-item|rename-item|copy-item|set-content|add-content|"
    r"clear-content|out-file|new-item|set-itemproperty|"
    r"to_excel|to_csv|to_parquet|os\.remove|os\.rename|os\.replace|shutil\.|"
    r"write_text|write_bytes"
    r")\b",
    re.IGNORECASE,
)
REDIRECT_INTO_DATA = re.compile(r">{1,2}\s*[\"']?[^\s\"'|;&]*data[\\/]", re.IGNORECASE)


def _is_inside_data(raw_path: str) -> bool:
    if not raw_path:
        return False
    candidate = Path(raw_path)
    if not candidate.is_absolute():
        candidate = PROJECT_DIR / candidate
    resolved = os.path.normcase(os.path.realpath(candidate))
    data_root = os.path.normcase(os.path.realpath(DATA_DIR))
    return resolved == data_root or resolved.startswith(data_root + os.sep)


def _decision(kind: str, reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": kind,
                    "permissionDecisionReason": reason,
                }
            },
            ensure_ascii=False,
        )
    )


def main() -> int:
    payload = json.loads(sys.stdin.buffer.read().decode("utf-8-sig"))
    tool_name = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}

    if tool_name in FILE_TOOLS:
        target = tool_input.get("file_path") or tool_input.get("notebook_path") or ""
        if _is_inside_data(target):
            _decision(
                "deny",
                "Los archivos de /data son de solo lectura (AGENTS.md y constitución, "
                "principio 2). No se pueden crear, editar ni sobreescribir.",
            )
        return 0

    if tool_name in SHELL_TOOLS:
        command = tool_input.get("command", "")
        mentions_data = DATA_REFERENCE.search(command) or str(DATA_DIR).lower() in command.lower()
        if not mentions_data:
            return 0
        if MUTATING_COMMAND.search(command) or REDIRECT_INTO_DATA.search(command):
            _decision(
                "ask",
                "El comando parece modificar /data (solo lectura). Confirmá solo si "
                "es un cambio autorizado explícitamente (p. ej. un renombrado).",
            )
    return 0


if __name__ == "__main__":
    sys.exit(main())
