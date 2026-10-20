#!/usr/bin/env python3
"""브라우저 렌더와 별도로 생성 HTML 339개의 구조·접근성 참조를 검사한다."""

from __future__ import annotations

import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[2]
DESIGN = ROOT / "docs/design"
QUEUE = DESIGN / "semantic-screen-queue.jsonl"
OUT = DESIGN / "html-structure-audit.json"


class AuditParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: Counter[str] = Counter()
        self.aria_refs: list[tuple[str, str]] = []
        self.fragments: list[str] = []
        self.images_without_alt: list[str] = []
        self.details: list[dict] = []
        self.open_details: list[dict] = []
        self.buttons: list[dict] = []
        self.open_buttons: list[dict] = []
        self.stack: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids[values["id"]] += 1
        for name in ("aria-labelledby", "aria-describedby"):
            if values.get(name):
                for ref in values[name].split():
                    self.aria_refs.append((name, ref))
        href = values.get("href") or ""
        if href.startswith("#") and len(href) > 1:
            self.fragments.append(unquote(href[1:]))
        if tag == "img" and "alt" not in values:
            self.images_without_alt.append(values.get("src") or "(src 없음)")
        if tag == "details":
            item = {"id": values.get("id"), "hasSummary": False}
            self.details.append(item)
            self.open_details.append(item)
        elif tag == "summary" and self.open_details:
            self.open_details[-1]["hasSummary"] = True
        if tag == "button":
            item = {"label": values.get("aria-label") or values.get("title") or "", "text": "", "type": values.get("type") or ""}
            self.buttons.append(item)
            self.open_buttons.append(item)
        self.stack.append(tag)

    def handle_endtag(self, tag: str) -> None:
        if tag == "button" and self.open_buttons:
            self.open_buttons.pop()
        if tag == "details" and self.open_details:
            self.open_details.pop()
        if tag in self.stack:
            while self.stack:
                popped = self.stack.pop()
                if popped == tag:
                    break

    def handle_data(self, data: str) -> None:
        if self.open_buttons and data.strip():
            self.open_buttons[-1]["text"] += data.strip() + " "


def main() -> None:
    queue = [json.loads(line) for line in QUEUE.read_text().splitlines() if line.strip()]
    results = []
    totals: Counter[str] = Counter()
    for page in queue:
        html = (ROOT / page["source"]).with_suffix(".html")
        parser = AuditParser()
        parser.feed(html.read_text())
        duplicate_ids = sorted(key for key, count in parser.ids.items() if count > 1)
        broken_aria = sorted(set(f"{kind}:{ref}" for kind, ref in parser.aria_refs if ref not in parser.ids))
        broken_fragments = sorted(set(ref for ref in parser.fragments if ref not in parser.ids))
        summaryless = sum(not item["hasSummary"] for item in parser.details)
        nameless_buttons = sum(not (item["label"] or item["text"].strip()) for item in parser.buttons)
        result = {
            "page": page["source"], "html": str(html.relative_to(ROOT)),
            "idCount": sum(parser.ids.values()), "duplicateIds": duplicate_ids,
            "brokenAriaRefs": broken_aria, "brokenFragments": broken_fragments,
            "summarylessDetails": summaryless, "imagesWithoutAlt": parser.images_without_alt,
            "namelessButtons": nameless_buttons, "buttonCount": len(parser.buttons),
            "renderingVerified": False,
        }
        results.append(result)
        for key in ("duplicateIds", "brokenAriaRefs", "brokenFragments", "imagesWithoutAlt"):
            totals[key] += len(result[key])
        totals["summarylessDetails"] += summaryless
        totals["namelessButtons"] += nameless_buttons
    report = {"pages": len(results), "totals": dict(totals), "note": "HTML 구조 감사이며 실제 브라우저 렌더·모바일 검증이 아님", "results": results}
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"pages": len(results), "totals": dict(totals)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
