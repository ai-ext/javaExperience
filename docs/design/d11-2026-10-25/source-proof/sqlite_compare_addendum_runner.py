#!/usr/bin/env python3
"""추가 SQLite 비교를 별도 프로세스로 실행하고 addendum 로그를 저장한다."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "sqlite_compare_addendum.py"
LOG_DIR = HERE.parent / "proof-logs"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> int:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    argv = [sys.executable, str(SOURCE)]
    started_at = datetime.now(timezone.utc).isoformat()
    completed = subprocess.run(argv, capture_output=True, text=True, check=False)
    log = {
        "startedAtUTC": started_at,
        "finishedAtUTC": datetime.now(timezone.utc).isoformat(),
        "source": str(SOURCE),
        "sourceSHA256": sha256(SOURCE),
        "runnerSource": str(Path(__file__).resolve()),
        "runnerSourceSHA256": sha256(Path(__file__).resolve()),
        "argv": argv,
        "returnCode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
    }
    name = datetime.now(timezone.utc).strftime("addendum-sqlite-compare-%Y%m%dT%H%M%SZ.json")
    target = LOG_DIR / name
    target.write_text(json.dumps(log, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sys.stdout.write(completed.stdout)
    if completed.stderr:
        sys.stderr.write(completed.stderr)
    print(json.dumps({"addendumLog": str(target), "sourceSHA256": log["sourceSHA256"], "returnCode": completed.returncode}))
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
