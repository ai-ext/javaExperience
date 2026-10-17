#!/usr/bin/env python3
"""생성 HTML의 토글 계층과 실제 내부 항목을 검토 가능한 목록으로 만든다."""

from __future__ import annotations

from collections import Counter, defaultdict
from hashlib import sha256
from html.parser import HTMLParser
from pathlib import Path
import json
import re


ROOT = Path(__file__).resolve().parents[2]
DESIGN = ROOT / "docs/design"
OUTPUT = DESIGN / "open-panel-census.jsonl"
SUMMARY = DESIGN / "open-panel-census-summary.json"
SOURCE_SUMMARY = DESIGN / "visual-inventory-summary.json"
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}
BLOCK_KINDS = {"p", "li", "pre", "table", "img", "button", "input", "textarea", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "figcaption"}


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


class PanelParser(HTMLParser):
    def __init__(self, page: str, previous: dict[str, dict]):
        super().__init__(convert_charrefs=True)
        self.page = page
        self.previous = previous
        self.rows: list[dict] = []
        self.stack: list[dict] = []
        self.details: list[dict] = []
        self.detail_ordinals: Counter[str] = Counter()
        self.block_ordinals: Counter[tuple[str, str]] = Counter()
        self.max_depth = 0

    def make_row(self, ident: str, kind: str, parent: str, depth: int, attrs: dict, text: str = "") -> dict:
        old = self.previous.get(ident, {})
        return {
            "id": ident,
            "page": self.page,
            "kind": kind,
            "parent": parent,
            "depth": depth,
            "label": normalize(text)[:240],
            "chars": len(normalize(text)),
            "contentSha256": sha256(normalize(text).encode()).hexdigest()[:16] if text else "",
            "elementId": attrs.get("id", ""),
            "className": attrs.get("class", ""),
            "src": attrs.get("src", ""),
            "alt": attrs.get("alt", ""),
            "type": attrs.get("type", ""),
            "status": old.get("status", "unreviewed"),
            "evidence": old.get("evidence", ""),
        }

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        attrs = {key: value or "" for key, value in attrs_list}
        parent = self.details[-1]["path"] if self.details else "root"
        frame = {"tag": tag, "attrs": attrs, "text": [], "row": None, "detail": None}
        if tag == "details":
            self.detail_ordinals[parent] += 1
            path = f"{parent}/{self.detail_ordinals[parent]}"
            ident = f"{self.page}::details::{path}"
            row = self.make_row(ident, "toggle", parent, len(self.details) + 1, attrs)
            row["initiallyOpen"] = "open" in attrs
            row["summary"] = ""
            row["path"] = path
            self.rows.append(row)
            frame["detail"] = row
            self.details.append(row)
            self.max_depth = max(self.max_depth, len(self.details))
        elif tag in BLOCK_KINDS:
            self.block_ordinals[(parent, tag)] += 1
            ordinal = self.block_ordinals[(parent, tag)]
            ident = f"{self.page}::{parent}::{tag}::{ordinal}"
            row = self.make_row(ident, tag, parent, len(self.details), attrs, attrs.get("alt", "") if tag == "img" else attrs.get("value", "") if tag == "input" else "")
            self.rows.append(row)
            frame["row"] = row
        self.stack.append(frame)
        if tag in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)

    def handle_data(self, data: str) -> None:
        for frame in self.stack:
            if frame["row"] is not None or frame["tag"] == "summary":
                frame["text"].append(data)

    def handle_endtag(self, tag: str) -> None:
        position = next((i for i in range(len(self.stack) - 1, -1, -1) if self.stack[i]["tag"] == tag), -1)
        if position < 0:
            return
        while len(self.stack) > position:
            frame = self.stack.pop()
            content = normalize("".join(frame["text"]))
            row = frame["row"]
            if row is not None and content:
                row["label"] = content[:240]
                row["chars"] = len(content)
                row["contentSha256"] = sha256(content.encode()).hexdigest()[:16]
            if frame["tag"] == "summary" and self.details:
                self.details[-1]["summary"] = content[:240]
            if frame["detail"] is not None:
                self.details.pop()


def main() -> None:
    source = json.loads(SOURCE_SUMMARY.read_text())
    previous = {}
    if OUTPUT.exists():
        previous = {row["id"]: row for row in (json.loads(line) for line in OUTPUT.read_text().splitlines())}
    pages = source["pages"]
    rows: list[dict] = []
    page_summaries = []
    for page in pages:
        html = ROOT / page["html"]
        if not html.is_file():
            raise FileNotFoundError(html)
        parser = PanelParser(page["source"], previous)
        parser.feed(html.read_text())
        parser.close()
        rows.extend(parser.rows)
        counts = Counter(row["kind"] for row in parser.rows)
        page_summaries.append({"source": page["source"], "html": page["html"], "toggles": counts["toggle"], "innerBlocks": sum(1 for row in parser.rows if row["depth"] > 0 and row["kind"] != "toggle"), "rootBlocks": sum(1 for row in parser.rows if row["depth"] == 0), "maxDepth": parser.max_depth})
    ids = [row["id"] for row in rows]
    if len(ids) != len(set(ids)):
        raise ValueError("계층 목록의 ID가 중복됐다")
    kinds = Counter(row["kind"] for row in rows)
    expected_toggles = sum(page["toggles"] for page in pages)
    if kinds["toggle"] != expected_toggles:
        mismatches = [(page["source"], page["toggles"], actual["toggles"]) for page, actual in zip(pages, page_summaries) if page["toggles"] != actual["toggles"]]
        raise ValueError(f"토글 수 불일치: {kinds['toggle']} != {expected_toggles}; 예: {mismatches[:12]}")
    if len(page_summaries) != source["sourcePages"]:
        raise ValueError("원본 화면 수와 다르다")
    with OUTPUT.open("w") as file:
        for row in rows:
            file.write(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n")
    result = {"sourcePages": len(page_summaries), "items": len(rows), "byKind": dict(sorted(kinds.items())), "toggleChildren": sum(1 for row in rows if row["depth"] > 0 and row["kind"] != "toggle"), "maxDepth": max(page["maxDepth"] for page in page_summaries), "byStatus": dict(Counter(row["status"] for row in rows)), "pages": page_summaries}
    SUMMARY.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({key: value for key, value in result.items() if key != "pages"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
