#!/usr/bin/env python3
"""tasks.json과 task별 증거를 읽어 기계 집계 파일을 갱신한다."""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CYCLE = Path(__file__).resolve().parent
ROOT = CYCLE.parents[2]
TASKS_JSON = CYCLE / "tasks.json"
BROWSER_SUMMARY_PATH = CYCLE / "infrastructure/browser-summary.json"
BASELINE_HEAD = "4b0493af52b1a06decca909d6bf9a8b6f9610686"
EXPECTED_FIRST24 = [
    "P09", "P04", "P16", "W09", "P19", "P20", "S09", "S08", "W11", "R03", "R04", "W15",
    "V04", "B01", "D01", "D02", "D03", "D04", "D05", "D06", "D07", "D08", "D09", "D10",
]
COVERAGE_VERDICTS = ("covered", "partial", "missing", "unrun")
QUALITY_SEVERITIES = ("critical", "important", "minor")
REVIEW_FIELDS = (
    "taskId", "documentId", "reviewer", "reviewedHEAD", "scope", "filesRead", "commandsRun",
    "specReview", "qualityReview", "visualReview", "runtimeReview", "boundedVerdict",
    "fullDocumentComplete", "remainingWork", "limitations",
)
COVERAGE_FIELDS = ("sourceSection", "sourceLines", "stageIds", "verdict", "evidence", "gap")
FINDING_FIELDS = ("id", "severity", "path", "line", "problem", "evidence", "fix", "validation")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def sha256(path: Path) -> str | None:
    try:
        digest = hashlib.sha256()
        with path.open("rb") as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(block)
        return digest.hexdigest()
    except OSError:
        return None


def absolute_repo_path(value: str | Path) -> Path | None:
    candidate = Path(value)
    if not candidate.is_absolute():
        candidate = ROOT / candidate
    candidate = candidate.resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return None
    return candidate


def evidence_path(value: str, task_dir: Path) -> Path | None:
    path = Path(value)
    if path.is_absolute():
        return absolute_repo_path(path)
    if value.startswith(("docs/", "tools/", "scenario/", "practice/")):
        return absolute_repo_path(ROOT / path)
    return absolute_repo_path(task_dir / path)


def link(path: Path, *, exists: bool = True) -> str:
    label = str(path)
    target = f"<{path}>"
    return f"[{label}]({target})" + ("" if exists else " (없음)")


def load_json(path: Path) -> tuple[Any | None, str | None]:
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except (OSError, json.JSONDecodeError) as exc:
        return None, str(exc)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--require24", action="store_true", help="첫 24개 리뷰가 모두 있어야 exit 0")
    args = parser.parse_args()

    errors: list[str] = []
    checks: dict[str, Any] = {}
    input_hashes: dict[str, str] = {}
    missing_review_tasks: list[str] = []
    missing_harness_tasks: list[str] = []
    browser_summary_tasks: list[str] = []
    task_rows: list[dict[str, Any]] = []
    markdown_rows: list[str] = []

    registry, registry_error = load_json(TASKS_JSON)
    if registry_error or not isinstance(registry, dict) or not isinstance(registry.get("tasks"), list):
        print(f"tasks.json을 읽을 수 없습니다: {registry_error or 'tasks 배열 누락'}", file=sys.stderr)
        return 2
    tasks = registry["tasks"]
    input_hashes[str(TASKS_JSON)] = sha256(TASKS_JSON) or "unreadable"
    harness_spec = importlib.util.spec_from_file_location("cycle_harness_readonly", CYCLE / "run-harness.py")
    harness_module = importlib.util.module_from_spec(harness_spec)
    harness_spec.loader.exec_module(harness_module)
    current_code_fingerprint, fingerprint_error = harness_module.code_fingerprint(ROOT)
    if current_code_fingerprint is None:
        errors.append(f"현재 tools/site code fingerprint를 읽을 수 없습니다: {fingerprint_error}")
    browser_summary: dict[str, Any] | None = None
    browser_task_map: dict[str, dict[str, Any]] = {}
    browser_data, browser_error = load_json(BROWSER_SUMMARY_PATH)
    if browser_error or not isinstance(browser_data, dict):
        errors.append(f"부모 browser-summary.json을 읽을 수 없습니다: {browser_error or 'object 아님'}")
    else:
        browser_summary = browser_data
        input_hashes[str(BROWSER_SUMMARY_PATH)] = sha256(BROWSER_SUMMARY_PATH) or "unreadable"
        for key, expected in (("documents", 24), ("distinctSupplementStates", 760), ("rows", 1520), ("representativeCaptures", 48)):
            actual = browser_summary.get(key)
            checks[f"browser.{key}"] = {"expected": expected, "actual": actual, "passed": actual == expected}
            if actual != expected:
                errors.append(f"browser-summary.{key}가 {expected}가 아닙니다: {actual}")
        browser_tasks = browser_summary.get("tasks")
        if not isinstance(browser_tasks, list):
            errors.append("browser-summary.tasks 배열이 없습니다")
        else:
            for item in browser_tasks:
                if isinstance(item, dict) and isinstance(item.get("taskId"), str):
                    if item["taskId"] in browser_task_map:
                        errors.append(f"browser-summary taskId 중복: {item['taskId']}")
                    browser_task_map[item["taskId"]] = item
            if len(browser_tasks) != 24 or len(browser_task_map) != 24:
                errors.append(f"browser-summary task 수가 24가 아닙니다: {len(browser_task_map)}")
    task_ids = [task.get("taskId") for task in tasks if isinstance(task, dict)]
    document_ids = [task.get("documentId") for task in tasks if isinstance(task, dict)]
    checks["taskCount"] = {"expected": 134, "actual": len(tasks), "passed": len(tasks) == 134}
    checks["uniqueTaskIds"] = {"expected": 134, "actual": len(set(task_ids)), "passed": len(tasks) == 134 and len(set(task_ids)) == 134}
    checks["uniqueDocumentIds"] = {"expected": 134, "actual": len(set(document_ids)), "passed": len(tasks) == 134 and len(set(document_ids)) == 134}
    task_numbering_ok = (
        len(tasks) == 134
        and [task.get("taskId") for task in tasks if isinstance(task, dict)] == [f"task{n}" for n in range(1, 135)]
        and [task.get("number") for task in tasks if isinstance(task, dict)] == list(range(1, 135))
    )
    checks["taskNumbering"] = {"expected": "task1..task134 in order", "passed": task_numbering_ok}
    if not task_numbering_ok:
        errors.append("taskId/number가 task1~task134 순서와 일치하지 않습니다")
    if len(tasks) != 134:
        errors.append(f"tasks.json task 수가 134가 아닙니다: {len(tasks)}")
    if len(set(task_ids)) != len(tasks):
        errors.append("taskId가 중복되었거나 task 객체가 잘못되었습니다")
    if len(set(document_ids)) != len(tasks):
        errors.append("documentId가 중복되었습니다")

    first24 = tasks[:24]
    actual_first24 = [task.get("documentId") for task in first24 if isinstance(task, dict)]
    numbers_first24 = [task.get("number") for task in first24 if isinstance(task, dict)]
    first24_order_ok = actual_first24 == EXPECTED_FIRST24 and numbers_first24 == list(range(1, 25))
    checks["first24Order"] = {
        "expectedDocumentIds": EXPECTED_FIRST24,
        "actualDocumentIds": actual_first24,
        "actualNumbers": numbers_first24,
        "passed": first24_order_ok,
    }
    if not first24_order_ok:
        errors.append("첫 24개 task의 번호 또는 documentId 순서가 계약과 다릅니다")
    checks["partition"] = {"documents": len(tasks), "existing24": len(first24), "remaining110": len(tasks) - len(first24), "passed": len(tasks) == 134 and len(first24) == 24 and len(tasks) - 24 == 110}

    coverage_counts: Counter[str] = Counter()
    quality_counts: Counter[str] = Counter()
    bounded_counts: Counter[str] = Counter()
    full_counts: Counter[str] = Counter()
    review_count = 0
    first24_review_count = 0
    matching_review_count = 0
    baseline_review_count = 0
    historical_passed_harness_count = 0
    first24_historical_passed_harness_count = 0
    current_passed_harness_count = 0
    first24_current_passed_harness_count = 0
    stale_harness_count = 0
    first24_stale_harness_count = 0
    current_source_matches = 0
    source_hash_mismatches: list[dict[str, Any]] = []
    total_coverage = 0
    total_quality_findings = 0
    output_expected = {"review": "review.json", "harness": "harness.json"}

    for index, task in enumerate(tasks, start=1):
        if not isinstance(task, dict):
            errors.append(f"tasks[{index - 1}]가 object가 아닙니다")
            continue
        task_id = task.get("taskId")
        document_id = task.get("documentId")
        task_dir = CYCLE / "tasks" / str(task_id)
        source_path = absolute_repo_path(task.get("source", ""))
        expected_source_hash = task.get("sourceSHA256")
        actual_source_hash = sha256(source_path) if source_path and source_path.is_file() else None
        source_matches = (
            isinstance(expected_source_hash, str)
            and re.fullmatch(r"[0-9a-fA-F]{64}", expected_source_hash) is not None
            and actual_source_hash is not None
            and expected_source_hash.lower() == actual_source_hash.lower()
        )
        if source_matches:
            current_source_matches += 1
        else:
            mismatch = {"taskId": task_id, "documentId": document_id, "source": task.get("source"),
                        "expectedSHA256": expected_source_hash, "actualSHA256": actual_source_hash}
            source_hash_mismatches.append(mismatch)
            errors.append(f"{task_id}: sourceSHA256와 현재 원문이 일치하지 않거나 원문을 읽을 수 없습니다")
        if source_path is None:
            errors.append(f"{task_id}: source 경로가 저장소 밖이거나 잘못되었습니다")
        elif source_path.is_file():
            input_hashes[str(source_path)] = actual_source_hash or "unreadable"

        task_md = task_dir / "TASK.md"
        review_path = task_dir / output_expected["review"]
        harness_path = task_dir / output_expected["harness"]
        browser_path = BROWSER_SUMMARY_PATH
        for input_path in (task_md, review_path, harness_path):
            if input_path.is_file():
                input_hashes[str(input_path.resolve())] = sha256(input_path) or "unreadable"
        if not task_md.is_file():
            errors.append(f"{task_id}: TASK.md가 없습니다")

        review: dict[str, Any] | None = None
        if review_path.is_file():
            review_count += 1
            if index <= 24:
                first24_review_count += 1
            review, error = load_json(review_path)
            if error or not isinstance(review, dict):
                errors.append(f"{task_id}: review.json을 읽을 수 없습니다: {error or 'object 아님'}")
                review = None
            else:
                missing_fields = [field for field in REVIEW_FIELDS if field not in review]
                if missing_fields:
                    errors.append(f"{task_id}: review 필수 필드 누락: {','.join(missing_fields)}")
                if review.get("taskId") != task_id or review.get("documentId") != document_id:
                    errors.append(f"{task_id}: review taskId/documentId가 tasks.json과 다릅니다")
                else:
                    matching_review_count += 1
                reviewer = review.get("reviewer")
                if not isinstance(reviewer, dict) or not all(field in reviewer for field in ("model", "reasoning")):
                    errors.append(f"{task_id}: reviewer.model/reasoning 누락")
                if review.get("reviewedHEAD") == BASELINE_HEAD:
                    baseline_review_count += 1
                else:
                    errors.append(f"{task_id}: reviewedHEAD가 기준 HEAD {BASELINE_HEAD}와 다릅니다")
                if type(review.get("fullDocumentComplete")) is not bool:
                    errors.append(f"{task_id}: fullDocumentComplete가 JSON boolean이 아닙니다")
                else:
                    full_counts[str(review["fullDocumentComplete"]).lower()] += 1
                bounded = review.get("boundedVerdict")
                if isinstance(bounded, str):
                    bounded_counts[bounded] += 1
                else:
                    errors.append(f"{task_id}: boundedVerdict가 문자열이 아닙니다")
                spec = review.get("specReview")
                if not isinstance(spec, dict) or not isinstance(spec.get("coverage"), list) or not isinstance(spec.get("verdict"), str):
                    errors.append(f"{task_id}: specReview 최소 스키마 오류")
                    coverage = []
                else:
                    coverage = spec["coverage"]
                for item_index, item in enumerate(coverage):
                    prefix = f"{task_id}.specReview.coverage[{item_index}]"
                    if not isinstance(item, dict):
                        errors.append(f"{prefix}: object가 아닙니다")
                        continue
                    missing = [field for field in COVERAGE_FIELDS if field not in item]
                    if missing:
                        errors.append(f"{prefix}: 필수 필드 누락 {','.join(missing)}")
                        continue
                    if not isinstance(item["sourceSection"], str) or not isinstance(item["sourceLines"], (str, list)) or not isinstance(item["stageIds"], list) or not isinstance(item["verdict"], str) or not isinstance(item["evidence"], (str, list)) or not isinstance(item["gap"], str):
                        errors.append(f"{prefix}: 필드 타입 오류")
                    verdict = item.get("verdict")
                    if isinstance(verdict, str):
                        coverage_counts[verdict] += 1
                        total_coverage += 1
                        if verdict not in COVERAGE_VERDICTS:
                            errors.append(f"{prefix}: 알 수 없는 coverage verdict {verdict}")
                quality = review.get("qualityReview")
                if not isinstance(quality, dict) or not isinstance(quality.get("verdict"), str) or not isinstance(quality.get("findings"), list):
                    errors.append(f"{task_id}: qualityReview 최소 스키마 오류")
                    findings = []
                else:
                    findings = quality["findings"]
                for finding_index, finding in enumerate(findings):
                    prefix = f"{task_id}.qualityReview.findings[{finding_index}]"
                    if not isinstance(finding, dict):
                        errors.append(f"{prefix}: object가 아닙니다")
                        continue
                    missing = [field for field in FINDING_FIELDS if field not in finding]
                    if missing:
                        errors.append(f"{prefix}: 필수 필드 누락 {','.join(missing)}")
                        continue
                    severity = finding.get("severity")
                    if isinstance(severity, str):
                        quality_counts[severity] += 1
                        total_quality_findings += 1
                        if severity not in QUALITY_SEVERITIES:
                            errors.append(f"{prefix}: 알 수 없는 quality severity {severity}")
                    else:
                        errors.append(f"{prefix}: quality severity가 문자열이 아닙니다")
                visual = review.get("visualReview")
                if not isinstance(visual, dict) or not all(isinstance(visual.get(field), list) for field in ("imagesViewed", "capturesViewed")) or "limitations" not in visual:
                    errors.append(f"{task_id}: visualReview 최소 스키마 오류")
                runtime = review.get("runtimeReview")
                if not isinstance(runtime, dict) or not isinstance(runtime.get("freshCommands"), list) or not isinstance(runtime.get("unexecuted"), list) or "historicalEvidence" not in runtime:
                    errors.append(f"{task_id}: runtimeReview 최소 스키마 오류")

        else:
            if index <= 24:
                missing_review_tasks.append(task_id)

        harness: dict[str, Any] | None = None
        harness_result: dict[str, Any] | None = None
        raw_paths: list[Path] = []
        harness_current_fingerprint_match = False
        harness_historical_passed = False
        harness_current_passed = False
        harness_stale = False
        if harness_path.is_file():
            harness, error = load_json(harness_path)
            if error or not isinstance(harness, dict):
                errors.append(f"{task_id}: harness.json을 읽을 수 없습니다: {error or 'object 아님'}")
                harness = None
            else:
                harness_result = harness.get("result")
                if not isinstance(harness_result, dict):
                    errors.append(f"{task_id}: harness.result가 object가 아닙니다")
                    harness_result = None
                else:
                    if harness_result.get("taskId") != task_id or harness_result.get("documentId") != document_id:
                        errors.append(f"{task_id}: harness result taskId/documentId가 tasks.json과 다릅니다")
                    harness_historical_passed = harness_result.get("status") == "passed"
                    saved_fingerprint = harness_result.get("codeFingerprintAfter")
                    saved_aggregate = saved_fingerprint.get("aggregateSHA256") if isinstance(saved_fingerprint, dict) else None
                    current_aggregate = current_code_fingerprint.get("aggregateSHA256") if current_code_fingerprint else None
                    harness_current_fingerprint_match = bool(current_aggregate and saved_aggregate == current_aggregate)
                    source_hash_current = harness_result.get("sourceSHA256After") == expected_source_hash
                    head_current = harness_result.get("headAfter") == BASELINE_HEAD
                    harness_current_passed = (
                        harness_historical_passed
                        and harness_result.get("exitCode") == 0
                        and harness_current_fingerprint_match
                        and source_hash_current
                        and head_current
                    )
                    harness_stale = harness_historical_passed and not harness_current_passed
                    if harness_historical_passed:
                        historical_passed_harness_count += 1
                        if index <= 24:
                            first24_historical_passed_harness_count += 1
                    if harness_current_passed:
                        current_passed_harness_count += 1
                        if index <= 24:
                            first24_current_passed_harness_count += 1
                    if harness_stale:
                        stale_harness_count += 1
                        if index <= 24:
                            first24_stale_harness_count += 1
                    latest_run = harness.get("latestRun")
                    if isinstance(latest_run, str) and not Path(latest_run).is_absolute() and ".." not in Path(latest_run).parts:
                        raw_dir = task_dir / latest_run
                        try:
                            raw_dir.resolve().relative_to(task_dir.resolve())
                        except ValueError:
                            errors.append(f"{task_id}: harness latestRun이 task 폴더 밖입니다")
                        else:
                            raw_paths = [raw_dir / "result.json", raw_dir / "stdout.log", raw_dir / "stderr.log"]
                            for raw_path in raw_paths:
                                if raw_path.is_file():
                                    input_hashes[str(raw_path.resolve())] = sha256(raw_path) or "unreadable"
                                else:
                                    errors.append(f"{task_id}: harness raw 파일이 없습니다: {raw_path}")
                    else:
                        errors.append(f"{task_id}: harness latestRun 경로가 안전하지 않습니다")
        elif index <= 24:
            missing_harness_tasks.append(task_id)
            errors.append(f"{task_id}: harness.json이 없습니다")

        browser_observation = browser_task_map.get(task_id) if index <= 24 else None
        if index <= 24:
            if browser_observation is None:
                errors.append(f"{task_id}: 부모 browser-summary.json에 task 관측이 없습니다")
            elif browser_observation.get("documentId") != document_id:
                errors.append(f"{task_id}: browser-summary taskId/documentId가 tasks.json과 다릅니다")
            else:
                browser_summary_tasks.append(task_id)

        fresh_commands = []
        visual_paths: list[str] = []
        if review:
            runtime = review.get("runtimeReview")
            if isinstance(runtime, dict) and isinstance(runtime.get("freshCommands"), list):
                for command in runtime["freshCommands"]:
                    if not isinstance(command, dict):
                        continue
                    record = {
                        key: command[key]
                        for key in (
                            "command", "startedAt", "startedAtUTC", "startedUTC", "finishedAt",
                            "finishedAtUTC", "finishedUTC", "endedAtUTC", "endedUTC", "exitCode",
                            "actualExitCode", "actualExit",
                        )
                        if key in command
                    }
                    refs = []
                    for key in ("stdoutPath", "stderrPath", "stdout", "stderr", "rawStdout", "rawStderr", "rawLog", "logPath", "outputPath"):
                        value = command.get(key)
                        if isinstance(value, str):
                            resolved = evidence_path(value, task_dir)
                            if resolved:
                                if str(resolved) not in refs:
                                    refs.append(str(resolved))
                                if resolved.is_file():
                                    input_hashes[str(resolved)] = sha256(resolved) or "unreadable"
                    record["outputPaths"] = refs
                    fresh_commands.append(record)
            visual = review.get("visualReview")
            if isinstance(visual, dict):
                for field in ("imagesViewed", "capturesViewed"):
                    items = visual.get(field, [])
                    if isinstance(items, list):
                        for item in items:
                            value = item.get("path") if isinstance(item, dict) else item
                            if isinstance(value, str):
                                resolved = evidence_path(value, task_dir)
                                if resolved:
                                    visual_paths.append(str(resolved))
                                    if resolved.is_file():
                                        input_hashes[str(resolved)] = sha256(resolved) or "unreadable"

        task_record = {
            "taskId": task_id,
            "number": task.get("number"),
            "documentId": document_id,
            "source": str(source_path) if source_path else task.get("source"),
            "sourceSHA256Registry": expected_source_hash,
            "sourceSHA256Current": actual_source_hash,
            "sourceHashMatches": source_matches,
            "phase": task.get("phase"),
            "taskStatus": task.get("status"),
            "historicalStatus": task.get("historicalStatus"),
            "reviewPath": str(review_path),
            "reviewPresent": review is not None,
            "reviewMatchesTask": bool(review and review.get("taskId") == task_id and review.get("documentId") == document_id),
            "reviewedHEAD": review.get("reviewedHEAD") if review else None,
            "boundedVerdict": review.get("boundedVerdict") if review else None,
            "fullDocumentComplete": review.get("fullDocumentComplete") if review else None,
            "coverageItemCount": len(review.get("specReview", {}).get("coverage", [])) if review and isinstance(review.get("specReview"), dict) and isinstance(review.get("specReview", {}).get("coverage"), list) else 0,
            "qualityFindingSeverityCounts": dict(Counter(item.get("severity") for item in review.get("qualityReview", {}).get("findings", []) if isinstance(item, dict) and isinstance(item.get("severity"), str))) if review and isinstance(review.get("qualityReview"), dict) and isinstance(review.get("qualityReview", {}).get("findings"), list) else {},
            "reviewer": review.get("reviewer") if review else None,
            "harnessPath": str(harness_path),
            "harnessPresent": harness is not None,
            "harnessStatus": harness_result.get("status") if harness_result else None,
            "harnessExitCode": harness_result.get("exitCode") if harness_result else None,
            "harnessHistoricalPassed": harness_historical_passed,
            "harnessCurrentFingerprintMatches": harness_current_fingerprint_match,
            "harnessCurrentPassed": harness_current_passed,
            "harnessStale": harness_stale,
            "harnessCommand": harness_result.get("argv") if harness_result else None,
            "harnessRawPaths": [str(path) for path in raw_paths],
            "freshTestCommands": fresh_commands,
            "browserSummaryPath": str(BROWSER_SUMMARY_PATH),
            "browserSummaryPresent": browser_summary is not None,
            "browserSummaryKind": "baseline common-state observation; post-repair replay is separate" if browser_observation else None,
            "browserObservation": browser_observation,
            "visualEvidencePaths": sorted(set(visual_paths)),
            "taskMarkdownPath": str(task_md),
            "taskMarkdownPresent": task_md.is_file(),
        }
        task_rows.append(task_record)

        if isinstance(review, dict):
            decision = f"boundedVerdict={json.dumps(review.get('boundedVerdict'), ensure_ascii=False)}; fullDocumentComplete={json.dumps(review.get('fullDocumentComplete'), ensure_ascii=False)}"
        elif index <= 24:
            decision = f"review pending; taskStatus={task.get('status')}"
        else:
            decision = f"계획 대기; phase={task.get('phase')}; taskStatus={task.get('status')}; historicalStatus={task.get('historicalStatus')}"
        review_cell = link(review_path, exists=review_path.is_file())
        harness_cell = link(harness_path, exists=harness_path.is_file())
        if harness_result:
            harness_cell += f" (stored={harness_result.get('status')}; currentPassed={str(harness_current_passed).lower()}; stale={str(harness_stale).lower()})"
        task_cell = link(task_md, exists=task_md.is_file())
        raw_links = " ".join(link(path, exists=path.is_file()) for path in raw_paths)
        test_links = " ".join(
            link(Path(path), exists=Path(path).is_file())
            for command in fresh_commands for path in command.get("outputPaths", [])
        )
        browser_bits = [link(BROWSER_SUMMARY_PATH, exists=browser_summary is not None)]
        browser_bits.extend(link(Path(path), exists=Path(path).is_file()) for path in sorted(set(visual_paths)))
        browser_note = "브라우저: " + " ".join(browser_bits)
        if browser_observation:
            browser_note += " " + json.dumps(browser_observation.get("modes", {}), ensure_ascii=False, separators=(",", ":"))
        path_cell = " ".join(part for part in (harness_cell, raw_links, test_links, browser_note) if part)
        source_link = link(source_path, exists=bool(source_path and source_path.is_file())) if source_path else str(task.get("source"))
        markdown_rows.append(
            f"| {task_id} | {document_id} | {source_link} | {task.get('phase')} | {decision} | {task_cell} | {review_cell} | {path_cell} |"
        )

    # Aggregate counts and independently validate that category sums match observed rows.
    coverage_total_from_categories = sum(coverage_counts.values())
    quality_total_from_categories = sum(quality_counts.values())
    count_checks = {
        "coverageVerdictsSum": {"observedRows": total_coverage, "categorySum": coverage_total_from_categories, "passed": total_coverage == coverage_total_from_categories},
        "qualitySeveritySum": {"observedFindings": total_quality_findings, "categorySum": quality_total_from_categories, "passed": total_quality_findings == quality_total_from_categories},
        "reviewPartitionFirst24": {"expected": 24, "present": first24_review_count, "missing": 24 - first24_review_count, "passed": first24_review_count == 24},
        "sourceHashMatches": {"expected": len(tasks), "actual": current_source_matches, "passed": current_source_matches == len(tasks)},
    }
    checks.update(count_checks)
    if total_coverage != coverage_total_from_categories:
        errors.append("coverage verdict 집계 합이 coverage 항목 수와 다릅니다")
    if total_quality_findings != quality_total_from_categories:
        errors.append("quality severity 집계 합이 quality findings 수와 다릅니다")
    require24_satisfied = first24_review_count == 24
    if args.require24 and not require24_satisfied:
        errors.append(f"--require24: 첫 24개 중 리뷰 {first24_review_count}/24개만 있습니다")

    generated = utc_now()
    validation = {
        "generatedAtUTC": generated,
        "require24": args.require24,
        "require24Satisfied": require24_satisfied,
        "ok": not errors,
        "checks": checks,
        "reviewCount": review_count,
        "first24ReviewCount": first24_review_count,
        "missingFirst24ReviewTasks": missing_review_tasks,
        "missingFirst24HarnessTasks": missing_harness_tasks,
        "errors": errors,
    }
    summary = {
        "generatedAtUTC": generated,
        "registryPath": str(TASKS_JSON),
        "registrySHA256": input_hashes[str(TASKS_JSON)],
        "baselineHEAD": BASELINE_HEAD,
        "counts": {
            "documents": len(tasks), "existing24": min(len(tasks), 24), "remaining110": max(0, len(tasks) - 24),
            "actualReviewCount": review_count, "first24ReviewCount": first24_review_count,
            "matchingTaskDocumentReviews": matching_review_count, "baselineHEADReviews": baseline_review_count,
            "historicalPassedHarnessCount": historical_passed_harness_count,
            "first24HistoricalPassedHarnessCount": first24_historical_passed_harness_count,
            "currentPassedHarnessCount": current_passed_harness_count,
            "first24CurrentPassedHarnessCount": first24_current_passed_harness_count,
            "staleHarnessCount": stale_harness_count, "first24StaleHarnessCount": first24_stale_harness_count,
            "browserSummaryCount": len(browser_summary_tasks), "fullDocumentCompleteTrue": int(full_counts.get("true", 0)),
            "fullDocumentCompleteFalse": int(full_counts.get("false", 0)), "coverageReviewRows": total_coverage,
            "qualityFindings": total_quality_findings,
        },
        "coverageVerdictCounts": dict(sorted(coverage_counts.items())),
        "qualityFindingSeverityCounts": {severity: quality_counts.get(severity, 0) for severity in QUALITY_SEVERITIES},
        "otherQualityFindingSeverityCounts": {key: value for key, value in sorted(quality_counts.items()) if key not in QUALITY_SEVERITIES},
        "boundedVerdictCounts": dict(sorted(bounded_counts.items())),
        "fullDocumentCompleteCounts": dict(sorted(full_counts.items())),
        "currentSourceHashMatches": current_source_matches,
        "sourceHashMismatches": source_hash_mismatches,
        "pendingFirst24Reviews": missing_review_tasks,
        "pendingFirst24Harness": missing_harness_tasks,
        "browserSummaryTasks": browser_summary_tasks,
        "browserSummaryReported": {
            key: browser_summary.get(key) for key in ("reviewer", "HEAD", "documents", "distinctSupplementStates", "rows", "copyChecks", "nativePreviousNextChecks", "originalAccess", "representativeCaptures", "mainActualViews")
        } if browser_summary else None,
        "currentToolsSiteCodeFingerprint": current_code_fingerprint,
        "currentToolsSiteCodeFingerprintError": fingerprint_error,
        "coverageCountMeaning": "문서별 coverage 의미 단위 검토 항목 수이며, 서로 다른 문서 사이 중복을 제거한 고유 개념 수가 아니다.",
        "limitations": [
            "브라우저 관측은 기준 HEAD의 부모 infrastructure/browser-summary.json에 저장된 task별 desktop/mobile 값이다. 수정 후 재검증은 별도 repair evidence에 둔다; 집계기가 실제 브라우저를 조작하거나 캡처를 열람한 것은 아니다.",
            "boundedVerdict와 fullDocumentComplete, quality severity는 리뷰 값을 그대로 집계했고 재판정하거나 새 acceptance를 추론하지 않았다.",
            "historicalPassed는 harness.json의 저장된 result.status를 보존한다. currentPassed는 저장 코드 fingerprint·원문 hash·HEAD가 현재 값과 모두 일치할 때만 센다. 문서 품질 승인은 뜻하지 않는다.",
            "visualEvidencePaths는 리뷰에 기록된 링크이며 이번 집계에서 이미지를 직접 열람했다는 뜻이 아니다.",
            "110개 task는 tasks.json 계획 상태이며 완료로 집계하지 않았다.",
        ],
        "tasks": task_rows,
        "inputFilesSHA256": dict(sorted(input_hashes.items())),
    }

    tasks_md = [
        "# 개념 학습 134개 task 집계",
        "",
        f"집계 시각(UTC): {generated}",
        "",
        "| 지표 | 값 |",
        "|---|---:|",
        f"| 전체 문서 | {len(tasks)} |",
        f"| 기존 감사 대상 | {min(len(tasks), 24)} |",
        f"| 계획 대기 | {max(0, len(tasks) - 24)} |",
        f"| 실제 review.json | {review_count} |",
        f"| 첫 24 review | {first24_review_count}/24 |",
        f"| 저장 기록 passed harness | {historical_passed_harness_count} |",
        f"| 현재 code/source/HEAD 일치 passed | {current_passed_harness_count} |",
        f"| stale harness 기록 | {stale_harness_count} |",
        f"| 전체 완료 표시(true) | {int(full_counts.get('true', 0))} |",
        f"| coverage 의미 단위 행 | {total_coverage} |",
        "",
        "Coverage verdict 집계",
        "",
        "| verdict | 항목 수 |",
        "|---|---:|",
    ]
    for verdict, count in sorted(coverage_counts.items()):
        tasks_md.append(f"| {verdict} | {count} |")
    tasks_md += [
        "",
        "Quality review finding 심각도 집계 (spec coverage와 분리)",
        "",
        "| severity | finding 수 |",
        "|---|---:|",
    ]
    for severity in QUALITY_SEVERITIES:
        tasks_md.append(f"| {severity} | {quality_counts.get(severity, 0)} |")
    for severity, count in sorted(quality_counts.items()):
        if severity not in QUALITY_SEVERITIES:
            tasks_md.append(f"| {severity} (알 수 없는 값) | {count} |")
    tasks_md += [
        "",
        f"Pending first24 review: {', '.join(missing_review_tasks) if missing_review_tasks else '없음'}",
        f"Parent browser summary (baseline common states): {len(browser_summary_tasks)}/24 task observations; 문서 {browser_summary.get('documents') if browser_summary else 0}, 상태 {browser_summary.get('distinctSupplementStates') if browser_summary else 0}, 행 {browser_summary.get('rows') if browser_summary else 0}, 대표 캡처 {browser_summary.get('representativeCaptures') if browser_summary else 0}. 수정 후 재검증은 별도 기록.",
        "Coverage 의미 단위 행은 문서별 검토 항목의 합이며 문서 사이 중복을 제거한 고유 개념 수가 아니다.",
        "110개는 계획 대기이며 완료로 계산하지 않았다. 판정과 severity는 리뷰 값을 그대로 집계했고 재판정하지 않았다.",
        "",
        "| Task | Document ID | 원문 | phase | 현재 판정 | TASK.md | 별도 review | raw/test/browser 경로 |",
        "|---|---|---|---|---|---|---|---|",
        *markdown_rows,
        "",
    ]

    (CYCLE / "SUMMARY.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (CYCLE / "infrastructure" / "summary-validation.json").write_text(json.dumps(validation, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (CYCLE / "TASKS.md").write_text("\n".join(tasks_md), encoding="utf-8")
    print(json.dumps({
        "generatedAtUTC": generated,
        "documents": len(tasks),
        "reviews": review_count,
        "first24Reviews": first24_review_count,
        "historicalPassedHarness": first24_historical_passed_harness_count,
        "currentPassedHarness": first24_current_passed_harness_count,
        "staleHarness": first24_stale_harness_count,
        "validationErrors": len(errors),
        "require24Satisfied": require24_satisfied,
    }, ensure_ascii=False))
    return 1 if args.require24 and not require24_satisfied else (1 if errors else 0)


if __name__ == "__main__":
    raise SystemExit(main())
