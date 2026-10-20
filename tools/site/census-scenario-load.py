#!/usr/bin/env python3
"""101단계의 첫 과제와 화면 밀도 지표를 한 행씩 기록한다."""

from __future__ import annotations

from collections import Counter
from pathlib import Path
import csv
import json
import re


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/design"


def first_task(source: str) -> str:
    match = re.search(r"^##\s+(?:만들 것|이번에 만들 것|목표)\s*$([\s\S]*?)(?=^##\s|\Z)", source, re.M)
    if not match:
        return ""
    rows = re.findall(r"^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", match.group(1), re.M)
    route = next((value for label, value in rows if "메서드·경로" in label), "")
    response = next((value for label, value in rows if "응답 상태" in label), "")
    if route:
        route = re.sub(r"[`*]", "", route).strip()
        response = re.sub(r"[`*]", "", response).strip()
        return (route + (f" · 기대 {response}" if response else ""))[:180]
    text = re.sub(r"```[\s\S]*?```", " ", match.group(1))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[`*_#|]", " ", text)
    return re.sub(r"\s+", " ", text).strip()[:180]


def main() -> None:
    catalog = json.loads((ROOT / "scenario/scenario.json").read_text())
    panels = json.loads((OUT / "open-panel-census-summary.json").read_text())
    by_page = {row["source"]: row for row in panels["pages"]}
    rows = []
    problems = []
    for chapter in catalog["chapters"]:
        for level in chapter["levels"]:
            source_path = Path("scenario") / chapter["dir"] / level["file"]
            source = (ROOT / source_path).read_text()
            links = re.findall(r"\]\(([^)]+)\)", source)
            knowledge = [link.split("#")[0] for link in links if "docs/knowledge/" in link]
            checks = re.findall(r"^```check\s*\n([\s\S]*?)^```\s*$", source, re.M)
            request_count = check_count = 0
            routes = set()
            for block in checks:
                try:
                    data = json.loads(block)
                except json.JSONDecodeError as error:
                    problems.append((level["id"], str(error)))
                    continue
                requests = data.get("requests", [])
                request_count += len(requests)
                check_count += len(data.get("checks", []))
                routes.update(f"{request.get('method', '')} {request.get('path', '')}" for request in requests if request.get("path"))
            panel = by_page.get(source_path.as_posix())
            if panel is None:
                raise ValueError(f"생성 HTML 연결이 없다: {source_path}")
            flags = []
            if request_count >= 30:
                flags.append("requests>=30")
            if len(knowledge) >= 5:
                flags.append("knowledge>=5")
            if len(re.findall(r"<details\b", source)) >= 15:
                flags.append("sourceDetails>=15")
            if source.count("\n") + 1 >= 2000:
                flags.append("lines>=2000")
            rows.append({
                "id": level["id"], "difficulty": level["difficulty"], "title": level["title"],
                "source": source_path.as_posix(), "firstTaskExcerpt": first_task(source),
                "lines": source.count("\n") + 1, "knowledgeLinks": len(knowledge),
                "uniqueKnowledgeDocs": len(set(knowledge)), "sourceDetails": len(re.findall(r"<details\b", source)),
                "htmlDetails": panel["toggles"], "htmlInnerBlocks": panel["innerBlocks"],
                "structuredRequests": request_count, "structuredChecks": check_count,
                "distinctRequestRoutes": len(routes), "flags": ";".join(flags),
                "status": "census_only",
            })
    if len(rows) != 101:
        raise ValueError(f"101단계가 아니다: {len(rows)}")
    if problems:
        raise ValueError(f"check JSON 파싱 오류: {problems[:5]}")
    csv_path = OUT / "scenario-learning-load.csv"
    with csv_path.open("w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    summary = {
        "levels": len(rows), "difficulty": dict(Counter(row["difficulty"] for row in rows)),
        "knowledgeLinks": sum(row["knowledgeLinks"] for row in rows),
        "sourceDetails": sum(row["sourceDetails"] for row in rows),
        "htmlDetails": sum(row["htmlDetails"] for row in rows),
        "structuredRequests": sum(row["structuredRequests"] for row in rows),
        "structuredChecks": sum(row["structuredChecks"] for row in rows),
        "flagged": sum(bool(row["flags"]) for row in rows),
        "note": "링크·토글·행 수는 화면 밀도 지표이며 새 개념 수나 실제 과제 난이도 판정이 아니다.",
    }
    (OUT / "scenario-learning-load-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
