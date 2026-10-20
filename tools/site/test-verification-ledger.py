#!/usr/bin/env python3
"""전수 검증판이 HTML·시안 목록과 같은 범위를 세고 완료를 과장하지 않는지 확인한다."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DESIGN = ROOT / "docs/design"


def read_jsonl(name: str) -> list[dict]:
    return [json.loads(line) for line in (DESIGN / name).read_text().splitlines() if line.strip()]


pages = read_jsonl("verification-page-ledger.jsonl")
images = read_jsonl("verification-image-ledger.jsonl")
queue = read_jsonl("semantic-screen-queue.jsonl")
parity = read_jsonl("visual-parity.jsonl")
structure = json.loads((DESIGN / "html-structure-audit.json").read_text())
summary = json.loads((DESIGN / "semantic-screen-queue-summary.json").read_text())
assert len(pages) == len(queue) == structure["pages"] == summary["sourcePages"]
assert len(images) == len(parity) == summary["parityRecords"]
assert {item["page"] for item in pages} == {item["source"] for item in queue}
assert all(item["htmlExists"] and item["htmlStructureGate"] == "passed" for item in pages)
assert all(item["mockupExists"] for item in images)
assert sum(item["complete"] for item in pages) == summary["fullPageVerified"]
assert sum(item["coverage"] == "partial" for item in pages) == summary["partialPages"]
assert sum(item["coverage"] == "unscoped" for item in pages) == summary["unscopedPages"]
assert sum(item["desktopGate"] != "missing" for item in images) == sum(bool(item.get("desktopCapture")) for item in parity)
assert sum(item["mobileGate"] != "missing" for item in images) == sum(bool(item.get("mobileCapture")) for item in parity)
assert all(not item["verified"] or (item["desktopGate"] == "captured_unreviewed" and item["mobileGate"] == "captured_unreviewed") for item in images)
assert (DESIGN / "USER-REVIEW-QUEUE.md").read_text().count("에이전트 게이트 뒤 |") == summary["partialPages"]
print(f"{len(pages)}쪽·{len(images)}시안 전수 기록과 캡처 게이트 분리 통과")
