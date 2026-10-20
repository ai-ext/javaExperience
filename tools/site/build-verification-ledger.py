#!/usr/bin/env python3
"""전수조사와 시안 기록을 현재 HTML·캡처 증거에 대조해 검증 대기열을 만든다."""

from __future__ import annotations

import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DESIGN = ROOT / "docs/design"
PAGE_QUEUE = DESIGN / "semantic-screen-queue.jsonl"
PARITY = DESIGN / "visual-parity.jsonl"
PAGE_OUT = DESIGN / "verification-page-ledger.jsonl"
IMAGE_OUT = DESIGN / "verification-image-ledger.jsonl"
BOARD_OUT = DESIGN / "VERIFICATION-BOARD.md"
USER_OUT = DESIGN / "USER-REVIEW-QUEUE.md"
STRUCTURE = DESIGN / "html-structure-audit.json"


def rows(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def relative_file(value: object) -> Path | None:
    if not isinstance(value, str) or not value.strip():
        return None
    candidate = ROOT / value
    return candidate if candidate.is_file() else None


def image_size(path: Path | None) -> list[int] | None:
    if path is None:
        return None
    try:
        from PIL import Image  # 선택 의존성: 없으면 크기 검사는 별도 대기로 남긴다.

        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            return [image.width, image.height]
    except (ImportError, OSError):
        return None


def user_question(kind: str, title: str) -> str:
    if kind in {"scenario", "db-query-journey", "lab"}:
        return f"‘{title}’의 첫 화면만 보고 만들 것·보낼 것·확인할 것을 말할 수 있는지, 순서와 난도가 자연스러운지"
    if kind == "knowledge":
        return f"‘{title}’의 이미지만 보고 핵심 관계를 쉽게 설명할 수 있는지, 깊이와 재질·타이포가 충분한지"
    if kind in {"lesson", "ticket"}:
        return f"‘{title}’에서 문제·힌트·정답의 공개 순서가 적절한지, 풀이 없이 답이 새지 않는지"
    return f"‘{title}’에서 처음 시작할 위치와 다음 학습 경로를 찾기 쉬운지"


def agent_next(coverage: str, kind: str) -> str:
    if coverage == "unscoped":
        return "원문 의미 장면 분할 → 기존 시안 경로 대조 → HTML 장면 이관"
    runtime = " → 실제 Spring/DB 결과 대조" if kind in {"scenario", "db-query-journey", "lab"} else ""
    return "현재 HTML 데스크톱·360px 캡처 → 장면/버튼/키보드 조작 → 원문 사실·시안 비교" + runtime


def main() -> None:
    pages = rows(PAGE_QUEUE)
    parity = rows(PARITY)
    structure = json.loads(STRUCTURE.read_text()) if STRUCTURE.is_file() else {"results": [], "totals": {}}
    suite_file = max(DESIGN.glob("site-test-suite-*.json"), default=DESIGN / "site-test-suite-2026-10-16.json")
    suites = json.loads(suite_file.read_text()) if suite_file.is_file() else []
    task_file = DESIGN / "task-focus-contract-audit.json"
    task_audit = json.loads(task_file.read_text()) if task_file.is_file() else {"results": [], "guides": 0, "matched": 0}
    task_by_source = {item["source"]: item for item in task_audit["results"]}
    passed_scripts = {item["script"] for item in suites if item["exitCode"] == 0}
    package_scripts = json.loads((ROOT / "tools/site/package.json").read_text())["scripts"]
    related_tests: dict[str, set[str]] = defaultdict(set)
    for name, command in package_scripts.items():
        if not name.startswith("test:"):
            continue
        match = re.search(r"node\s+(\S+\.mjs)", command)
        if not match:
            continue
        test_file = ROOT / "tools/site" / match.group(1)
        text = test_file.read_text()
        paths = set(re.findall(r"(?:scenario|docs/knowledge|lessons|tickets|practice)/[A-Za-z0-9_./-]+\.(?:md|html)", text))
        for found in paths:
            related_tests[found[:-5] + ".md" if found.endswith(".html") else found].add(name)
    for name in ("P08-maven-gradle-practical", "S03-boot-autoconfig", "S04-config-profiles", "R08-app-to-db-connection"):
        related_tests[f"docs/knowledge/{name}.md"].add("test:config-concepts")
    structure_by_page = {item["page"]: item for item in structure["results"]}
    build_epoch = max((ROOT / item["source"]).with_suffix(".html").stat().st_mtime
                      for item in pages if (ROOT / item["source"]).with_suffix(".html").is_file())
    exact = defaultdict(list)
    image_rows = []
    for item in parity:
        page = item.get("page")
        if isinstance(page, str):
            exact[page].append(item["id"])
        mockup = relative_file(item.get("mockup"))
        desktop = relative_file(item.get("desktopCapture"))
        mobile = relative_file(item.get("mobileCapture"))
        desktop_size = image_size(desktop)
        mobile_size = image_size(mobile)
        mockup_size = image_size(mockup)
        desktop_state = "missing" if desktop is None else "stale" if desktop.stat().st_mtime < build_epoch else "captured_unreviewed"
        mobile_state = "missing" if mobile is None else "stale" if mobile.stat().st_mtime < build_epoch else "captured_unreviewed"
        image_rows.append({
            "id": item["id"], "page": page, "mockup": item.get("mockup"),
            "mockupExists": mockup is not None, "mockupSize": mockup_size,
            "implementationState": item.get("status", "unreviewed"),
            "desktopCapture": item.get("desktopCapture") or None,
            "desktopSize": desktop_size, "desktopGate": desktop_state,
            "sameDesktopViewport": bool(mockup_size and desktop_size and mockup_size == desktop_size),
            "mobileCapture": item.get("mobileCapture") or None,
            "mobileSize": mobile_size, "mobileGate": mobile_state,
            "mobile360": bool(mobile_size and mobile_size[0] == 360),
            "sourceCheckRecorded": bool(item.get("sourceCheck")),
            "interactionNoteRecorded": bool(item.get("interactionCheck")),
            "currentInteractionGate": "not_verified",
            "currentTechnicalGate": "not_verified",
            "agentNext": "최신 HTML과 같은 뷰포트 캡처·360px 캡처·클릭·키보드·원문 계약 재검증",
            "userReview": "agent_gate_after_pending",
            "verified": False,
        })
    page_rows = []
    for item in pages:
        source = item["source"]
        html = (ROOT / source).with_suffix(".html")
        matches = exact.get(source, [])
        task_result = task_by_source.get(source)
        tests = sorted(related_tests.get(source, set()))
        structure_result = structure_by_page.get(source)
        structure_errors = (sum(len(structure_result[key]) for key in ("duplicateIds", "brokenAriaRefs", "brokenFragments", "imagesWithoutAlt"))
                            + structure_result["summarylessDetails"] + structure_result["namelessButtons"]) if structure_result else None
        page_rows.append({
            "page": source, "html": str(html.relative_to(ROOT)), "htmlExists": html.is_file(),
            "title": item["title"], "kind": item["kind"],
            "coverage": item["coverage"], "semanticScreens": item.get("semanticScreens"),
            "inventoryUnits": item["inventoryUnits"], "openPanelBlocks": item["openPanelBlocks"],
            "parityRecordCount": item["parityRecords"], "exactParityIds": matches,
            "buildLinkGate": "passed" if html.is_file() else "missing_html",
            "htmlStructureGate": "passed" if structure_errors == 0 else "failed" if structure_errors else "not_run",
            "htmlStructureIssues": structure_errors,
            "sourceContractGate": "partial_evidence" if item["parityRecords"] else "not_reviewed",
            "firstTaskSourceGate": task_result["result"] if task_result else "not_applicable",
            "relatedStaticTests": tests,
            "relatedStaticTestsPassed": all(name in passed_scripts for name in tests) if tests else None,
            "testRelationMeaning": "테스트가 이 소스를 참조함. 페이지 전체 검증을 뜻하지 않음" if tests else "연결된 개별 테스트 없음",
            "desktopGate": "not_currently_verified", "mobile360Gate": "not_currently_verified",
            "interactionGate": "not_currently_verified", "runtimeGate": "not_currently_verified",
            "visualParityGate": "not_currently_verified",
            "agentNext": agent_next(item["coverage"], item["kind"]),
            "userReviewQuestion": user_question(item["kind"], item["title"]),
            "userReviewState": "wait_for_agent_checks",
            "complete": False,
        })
    assert len(page_rows) == 339
    assert len(image_rows) == len(parity)
    PAGE_OUT.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in page_rows))
    IMAGE_OUT.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in image_rows))
    page_count = Counter(item["coverage"] for item in page_rows)
    desktop_count = Counter(item["desktopGate"] for item in image_rows)
    mobile_count = Counter(item["mobileGate"] for item in image_rows)
    lines = [
        "# javaExperience 전수 검증 진행표", "",
        f"재계산: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} · 현재 작업 트리 기준", "",
        "체크의 뜻을 분리한다. HTML·링크 빌드가 지나도 실제 화면, 모바일, 조작, 기술 계약, 학습자 이해는 별도 검증이다. 상태 파일의 이전 캡처는 현재 HTML의 증거로 자동 승격하지 않는다.", "",
        f"- 페이지: {len(page_rows)}쪽 · 일부 장면 적용 {page_count['partial']}쪽 · 의미 장면 미분할 {page_count['unscoped']}쪽 · 전체 검증 완료 0쪽",
        f"- 시안 기록: {len(image_rows)}건 · 데스크톱 현재 증거 {desktop_count['captured_unreviewed']}건 / 이전 캡처 {desktop_count['stale']}건 / 없음 {desktop_count['missing']}건",
        f"- 모바일 현재 증거 {mobile_count['captured_unreviewed']}건 / 이전 캡처 {mobile_count['stale']}건 / 없음 {mobile_count['missing']}건",
        f"- 이전 캡처 중 시안과 데스크톱 크기가 같은 파일 {sum(item['sameDesktopViewport'] for item in image_rows)}건, 너비 360px 모바일 파일 {sum(item['mobile360'] for item in image_rows)}건. 둘 다 현재 HTML보다 이전 자료다.",
        "- 실제 브라우저 클릭·키보드·360px 넘침·API/DB 실행 결과·학습자 이해: 현재 전수 완료 증거 없음", "",
        f"- HTML 구조 감사: {len(structure_by_page)}쪽 검사 · 중복 ID {structure['totals'].get('duplicateIds', '미실행')}건 · 깨진 ARIA 참조 {structure['totals'].get('brokenAriaRefs', '미실행')}건 · 깨진 페이지 내 앵커 {structure['totals'].get('brokenFragments', '미실행')}건", "",
        f"- 사이트의 범위별 정적 검사: {sum(item['exitCode'] == 0 for item in suites)}/{len(suites)}개 통과. 이 수치는 브라우저·모바일 검증 수가 아님.", "",
        f"- 개별 테스트와 파일 경로가 연결된 페이지 {sum(bool(item['relatedStaticTests']) for item in page_rows)}쪽. 참조된 테스트가 통과해도 해당 페이지의 모든 상태가 검증된 것은 아님.", "",
        f"- 101단계 첫 과제 카드: 원문 경로·파일·근거 줄 정적 대조 {task_audit['matched']}/{task_audit['guides']}건. 실제 구현과 학습자 이해 검증은 별개.", "",
        "- [현재 실습 서버 실행 확인](RUNTIME-CHECK-2026-10-16.md): compileJava 통과, 테스트 1개 통과, GET /hello 200, GET /api/lists 500. 다른 시나리오의 기대 응답을 현재 서버 실측으로 취급하지 않음.", "",
        "## 검증 게이트", "",
        "1. 에이전트: 원문·코드·요청/DB 계약을 화면의 모든 상태와 비교한다.",
        "2. 에이전트: 현재 HTML을 데스크톱과 360px에서 렌더·캡처해 시안과 줄바꿈·배치·재질·대비를 비교한다.",
        "3. 에이전트: 장면 이동, 요청 버튼, 복사, 토글, 키보드 포커스와 콘솔 오류를 확인한다.",
        "4. 에이전트: 실행 가능한 실습은 실제 Spring Boot/API/DB의 응답·행·로그를 예상값과 구분해 확인한다.",
        "5. 사용자: 위 검사가 끝난 화면을 보고 이해 용이성, 표현의 정교함, 학습 순서와 난도를 판단한다. 사용자 의견 전에는 학습자 검증 완료로 표시하지 않는다.", "",
        "## 페이지별 현재 상태", "",
        "| 종류 | 페이지 | 적용 | 시안 기록 | 관련 정적 검사 | HTML 구조 | 현재 데스크톱 | 현재 360px | 조작·실행 | 사용자 검토 | 에이전트 다음 일 |",
        "|---|---|---|---:|---|---|---|---|---|---|---|",
    ]
    for item in page_rows:
        lines.append("| " + " | ".join([
            item["kind"], f"[{item['page']}](../../{item['html']})",
            "부분" if item["coverage"] == "partial" else "미분할",
            str(item["parityRecordCount"]), str(len(item["relatedStaticTests"])), "통과" if item["htmlStructureGate"] == "passed" else "재검사", "대기", "대기", "대기", "에이전트 검증 뒤", item["agentNext"],
        ]) + " |")
    lines += ["", "## 사용자에게 검토받을 기준", "",
              "시나리오·DB 실습은 첫 화면의 만들 파일·보낼 요청·실제 확인 경로가 바로 보이는지 묻는다. 공부자료는 이미지가 개념의 값을 쉽게 보여 주면서도 기술 깊이와 시각적 정교함이 충분한지 묻는다. 레슨·티켓은 정답 누출과 힌트 순서를, 목차는 출발점과 탐색을 묻는다. 실제 요청은 에이전트 검증을 마친 페이지 묶음마다 구체적 캡처와 함께 한다.", ""]
    BOARD_OUT.write_text("\n".join(lines))
    user_lines = ["# 사용자 화면 검토 대기열", "",
                  "현재 사용자에게 완료 판정을 요청할 화면은 0쪽이다. 에이전트의 현재 데스크톱·360px 캡처, 조작·기술 검증이 끝난 화면부터 캡처와 함께 묶어 요청한다.", "",
                  "사용자 판단 항목은 미적 완성도, 고등학생에게 전달되는지, 첫 행동과 학습 깊이의 균형이다. API/DB 상태 코드와 SQL의 기술 검증은 먼저 에이전트가 한다.", "",
                  "| 화면 | 사용자에게 확인받을 질문 | 요청 가능 시점 |", "|---|---|---|"]
    for item in page_rows:
        if item["coverage"] == "partial":
            user_lines.append(f"| {item['page']} | {item['userReviewQuestion']} | 에이전트 게이트 뒤 |")
    USER_OUT.write_text("\n".join(user_lines) + "\n")
    print(json.dumps({"pages": len(page_rows), "pageCoverage": page_count,
                      "images": len(image_rows), "desktop": desktop_count,
                      "mobile": mobile_count, "out": [str(PAGE_OUT.relative_to(ROOT)),
                      str(IMAGE_OUT.relative_to(ROOT)), str(BOARD_OUT.relative_to(ROOT)),
                      str(USER_OUT.relative_to(ROOT))]}, ensure_ascii=False, default=dict))


if __name__ == "__main__":
    main()
