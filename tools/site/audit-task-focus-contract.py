#!/usr/bin/env python3
"""101개 첫 과제 카드의 경로·파일·근거 줄을 원문/스냅샷과 대조한다."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/design/task-focus-contract-audit.json"


def main() -> None:
    guides = {}
    for name in ("0-9", "10-16"):
        guides.update(json.loads((ROOT / f"tools/site/task-focus-data-{name}.json").read_text()))
    results = []
    for stage, guide in guides.items():
        source = ROOT / guide["source"]
        markdown = source.read_text()
        route = guide.get("route") or ""
        route_path = route.split(" ", 1)[1] if " " in route else ""
        route_pattern = re.escape(route_path).replace(r"\{", "{").replace(r"\}", "}")
        route_pattern = re.sub(r"\{[^{}]+\}", r"[^\\s/?\"']+", route_pattern)
        route_supported = not route_path or bool(re.search(route_pattern, markdown))
        file_name = guide.get("file") or ""
        snapshot = ROOT / f"scenario/snapshots/{stage}.json"
        snapshot_files = json.loads(snapshot.read_text()).get("files", []) if snapshot.is_file() else []
        file_supported = not file_name or file_name in markdown or any(Path(item["path"]).name == file_name for item in snapshot_files)
        evidence = []
        for reference in guide.get("evidence", []):
            location, number = reference.rsplit(":", 1)
            lines = (ROOT / location).read_text().splitlines()
            index = int(number) - 1
            evidence.append({"reference": reference, "valid": 0 <= index < len(lines) and bool(lines[index].strip())})
        results.append({
            "stage": stage, "source": guide["source"], "route": route or None,
            "routeSupportedBySource": route_supported, "file": file_name or None,
            "fileSupportedBySourceOrSnapshot": file_supported,
            "evidence": evidence, "allEvidenceLinesValid": all(item["valid"] for item in evidence),
            "result": "static_source_match" if route_supported and file_supported and all(item["valid"] for item in evidence) else "manual_review",
            "meaning": "문자열·경로 패턴·스냅샷 근거 검사이며 과제 의미의 수동 검수나 브라우저 검증은 아님",
        })
    OUT.write_text(json.dumps({"guides": len(results), "matched": sum(item["result"] == "static_source_match" for item in results), "results": results}, ensure_ascii=False, indent=2) + "\n")
    flagged = [item["stage"] for item in results if item["result"] == "manual_review"]
    print(json.dumps({"guides": len(results), "matched": len(results) - len(flagged), "manualReview": flagged}, ensure_ascii=False))


if __name__ == "__main__":
    main()
