"""Spec 048: the GitHub Flow hooks in .githooks/ (run through Git's sh)."""
import shutil
import subprocess
from pathlib import Path

import pytest

HOOKS = Path(__file__).resolve().parent.parent / ".githooks"
ZERO = "0" * 40
SHA = "a" * 40


def find_sh() -> str | None:
    found = shutil.which("sh")
    if found:
        return found
    git = shutil.which("git")
    if git:
        # Git for Windows: <Git>/cmd/git.exe -> <Git>/usr/bin/sh.exe
        candidate = Path(git).resolve().parent.parent / "usr" / "bin" / "sh.exe"
        if candidate.exists():
            return str(candidate)
    return None


SH = find_sh()
pytestmark = pytest.mark.skipif(SH is None, reason="sh no disponible")


def commit_msg(tmp_path: Path, message: str) -> subprocess.CompletedProcess:
    msg_file = tmp_path / "COMMIT_EDITMSG"
    msg_file.write_text(message, encoding="utf-8")
    return subprocess.run(
        [SH, str(HOOKS / "commit-msg"), str(msg_file)],
        capture_output=True, text=True, encoding="utf-8",
    )


def pre_push(*remote_refs: str, local_sha: str = SHA) -> subprocess.CompletedProcess:
    lines = "".join(f"refs/heads/x {local_sha} {ref} {ZERO}\n" for ref in remote_refs)
    return subprocess.run(
        [SH, str(HOOKS / "pre-push"), "origin", "url"],
        input=lines, capture_output=True, text=True, encoding="utf-8",
    )


@pytest.mark.parametrize("message", [
    "feat(049): marca los días con poco volumen",
    "fix: corrige el badge «Parcial» en semanas de 5 días",
    "chore(048)!: renombra el proyecto a Proyecto Almanaque\n\nCuerpo opcional.\n",
    "docs(048): " + "á" * 61,  # 72 characters with accents
])
def test_commit_msg_accepts_conventional_commits(tmp_path, message):
    assert commit_msg(tmp_path, message).returncode == 0


@pytest.mark.parametrize("message", [
    "Spec 048: proyecto almanaque",
    "feat(049): Marca los días con poco volumen",
    "feat(049): marca los días con poco volumen.",
    "feature(049): marca los días",
    "feat(049): " + "a" * 62,  # 73 characters
])
def test_commit_msg_rejects_other_formats(tmp_path, message):
    result = commit_msg(tmp_path, message)
    assert result.returncode == 1
    assert "Error:" in result.stderr


def test_commit_msg_accepts_git_generated_messages_and_skips_comments(tmp_path):
    for message in ("Merge branch 'main'", 'Revert "feat(049): algo"', "fixup! feat(049): algo"):
        assert commit_msg(tmp_path, message).returncode == 0
    assert commit_msg(tmp_path, "# comentario de git\n\nfix: corrige algo\n").returncode == 0


def test_pre_push_rejects_main():
    result = pre_push("refs/heads/main")
    assert result.returncode == 1
    assert "main" in result.stderr


def test_pre_push_checks_branch_names():
    assert pre_push("refs/heads/feat/049-low-volume-days", "refs/heads/docs/readme-install").returncode == 0
    assert pre_push("refs/tags/v1.0").returncode == 0
    assert pre_push("refs/heads/old_branch", local_sha=ZERO).returncode == 0  # deleting is fine
    for bad in ("refs/heads/spec-049", "refs/heads/feat/Low_Volume", "refs/heads/wip/049-x"):
        assert pre_push(bad).returncode == 1, bad
