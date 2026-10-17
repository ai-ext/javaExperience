#!/usr/bin/env python3
"""DOM 전수조사를 화면별 의미 장면 설계 대기열로 묶는다. 완료 판정은 하지 않는다."""

from collections import Counter, defaultdict
from pathlib import Path
import json
import re


ROOT = Path(__file__).resolve().parents[2]
DESIGN = ROOT / "docs/design"


def load_json(name: str):
    return json.loads((DESIGN / name).read_text())


def kind(source: str) -> str:
    if source.startswith("scenario/ch"):
        return "scenario"
    if source.startswith("scenario/labs/"):
        return "lab"
    if source.startswith("scenario/db-query-journey/"):
        return "db-query-journey"
    if source.startswith("docs/knowledge/") and source != "docs/knowledge/README.md":
        return "knowledge"
    if source.startswith("lessons/"):
        return "lesson"
    if source.startswith("tickets/"):
        return "ticket"
    return "navigation-or-reference"


def title(source: str) -> str:
    path = ROOT / source
    for line in path.read_text().splitlines():
        match = re.match(r"^#\s+(.+)", line)
        if match:
            return match.group(1).strip()
    return path.stem


def main() -> None:
    inventory = load_json("visual-inventory-summary.json")
    panels = load_json("open-panel-census-summary.json")
    panel_by_page = {item["source"]: item for item in panels["pages"]}
    parity = [json.loads(line) for line in (DESIGN / "visual-parity.jsonl").read_text().splitlines() if line]
    parity_by_page = defaultdict(list)
    for item in parity:
        parity_by_page[item["page"]].append(item)

    rows = []
    for page in inventory["pages"]:
        source = page["source"]
        linked = parity_by_page[source]
        item = panel_by_page.get(source, {})
        rows.append({
            "source": source,
            "title": title(source),
            "kind": kind(source),
            "inventoryUnits": page["units"],
            "openPanelBlocks": item.get("innerBlocks", 0) + item.get("rootBlocks", 0),
            "toggles": page["toggles"],
            "longProse": page["longProse"],
            "semanticScreens": None,
            "designQuestion": "장면별 사용자 질문·첫 행동·관찰 결과를 원문에서 분할",
            "parityRecords": len(linked),
            "implementedReferenceScreens": sum(row["status"] in ("implemented", "verified") for row in linked),
            "coverage": "partial" if linked else "unscoped",
            "nextGate": "원문 분할 → 장면별 imagegen → 기술 대조 → DOM 구현 → desktop/mobile·조작 검증",
        })

    if len(rows) != inventory["sourcePages"]:
        raise RuntimeError("전수조사 페이지 수와 대기열 수가 다르다")
    output = DESIGN / "semantic-screen-queue.jsonl"
    output.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in rows))
    counts = Counter(row["kind"] for row in rows)
    summary = {
        "sourcePages": len(rows),
        "inventoryUnits": inventory["units"],
        "openPanelItems": panels["items"],
        "unitMeaning": "DOM·산문·코드·토글 조사항목이며 의미 장면이나 필요한 이미지 개수가 아님",
        "byKind": dict(counts),
        "partialPages": sum(row["coverage"] == "partial" for row in rows),
        "unscopedPages": sum(row["coverage"] == "unscoped" for row in rows),
        "fullPageVerified": 0,
        "parityRecords": len(parity),
        "wholeInventorySemanticScreenCount": None,
    }
    (DESIGN / "semantic-screen-queue-summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
