#!/usr/bin/env python3
"""SQLite proof를 실행하고 자체 수정과 분리된 실행 로그를 보관한다."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


HERE = Path(__file__).resolve().parent
PROOF = HERE / "sqlite_proof.py"
LOGS = HERE.parent / "proof-logs"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> int:
    LOGS.mkdir(parents=True, exist_ok=True)
    argv = [sys.executable, str(PROOF)]
    started_at = datetime.now(timezone.utc).isoformat()
    completed = subprocess.run(argv, capture_output=True, text=True, check=False)
    log = {
        "startedAtUTC": started_at,
        "finishedAtUTC": datetime.now(timezone.utc).isoformat(),
        "source": str(PROOF),
        "sourceSHA256": sha256(PROOF),
        "runnerSource": str(Path(__file__).resolve()),
        "runnerSourceSHA256": sha256(Path(__file__).resolve()),
        "argv": argv,
        "returnCode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
    }
    name = datetime.now(timezone.utc).strftime("sqlite-proof-%Y%m%dT%H%M%SZ.json")
    target = LOGS / name
    target.write_text(json.dumps(log, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sys.stdout.write(completed.stdout)
    if completed.stderr:
        sys.stderr.write(completed.stderr)
    print(json.dumps({"proofLog": str(target), "sourceSHA256": log["sourceSHA256"], "returnCode": completed.returncode}))
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
