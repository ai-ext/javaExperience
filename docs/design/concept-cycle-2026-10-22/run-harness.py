#!/usr/bin/env python3
"""기존 개념 문서의 허용된 npm 검사만 실행하고 증거를 보존한다."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable, Any

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_REPO_ROOT = SCRIPT_DIR.parents[2]
CONTRACT_DIR = Path("docs/design/concept-cycle-2026-10-22")
TASKS_RELATIVE = CONTRACT_DIR / "tasks"
REGISTRY_RELATIVE = CONTRACT_DIR / "tasks.json"
DEFAULT_TIMEOUT_SECONDS = 600
MAX_PLANNED_TASK_NUMBER = 134
CODE_SUFFIXES = {".mjs", ".js", ".css", ".json"}


class HarnessError(Exception):
    """요청이나 레지스트리가 허용 범위를 벗어났다."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def sha256_file(path: Path) -> str | None:
    try:
        digest = hashlib.sha256()
        with path.open("rb") as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                digest.update(block)
        return digest.hexdigest()
    except OSError:
        return None


def _source_path(task: dict[str, Any], repo_root: Path) -> Path:
    source_value = task.get("source")
    if not isinstance(source_value, str):
        raise HarnessError(f"{task.get('taskId', '알 수 없음')}: source 경로가 없습니다")
    source_path = (repo_root / source_value).resolve()
    try:
        source_path.relative_to(repo_root.resolve())
    except ValueError as exc:
        raise HarnessError(f"{task.get('taskId', '알 수 없음')}: source 경로가 저장소 밖을 가리킵니다") from exc
    if not source_path.is_file():
        raise HarnessError(f"{task.get('taskId', '알 수 없음')}: source 파일이 없습니다: {source_value}")
    return source_path


def code_fingerprint(repo_root: Path) -> tuple[dict[str, Any] | None, str | None]:
    """tools/site 코드 파일의 정렬된 SHA-256 manifest와 집계 hash를 만든다."""
    site_root = repo_root / "tools/site"
    try:
        _reject_symlink_components(site_root, repo_root)
    except HarnessError as exc:
        return None, str(exc)
    if not site_root.is_dir():
        return None, "tools/site 경로를 안전하게 읽을 수 없습니다"
    manifest: list[dict[str, str]] = []
    errors: list[str] = []

    def walk_error(error: OSError) -> None:
        errors.append(str(error))

    for directory, directory_names, file_names in os.walk(site_root, topdown=True, followlinks=False, onerror=walk_error):
        current = Path(directory)
        kept_directories = []
        for name in directory_names:
            child = current / name
            if name == "node_modules":
                continue
            if child.is_symlink():
                errors.append(f"symlink 디렉터리: {child.relative_to(repo_root).as_posix()}")
                continue
            kept_directories.append(name)
        directory_names[:] = kept_directories
        for name in file_names:
            path = current / name
            if path.suffix.lower() not in CODE_SUFFIXES:
                continue
            if path.is_symlink():
                errors.append(f"symlink 코드 파일: {path.relative_to(repo_root).as_posix()}")
                continue
            digest = sha256_file(path)
            if digest is None:
                errors.append(f"파일 hash 읽기 실패: {path.relative_to(repo_root).as_posix()}")
                continue
            manifest.append({"path": path.relative_to(repo_root).as_posix(), "sha256": digest})

    if errors:
        return None, "; ".join(errors)
    manifest.sort(key=lambda item: item["path"])
    canonical = json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return {"manifest": manifest, "aggregateSHA256": hashlib.sha256(canonical).hexdigest()}, None


def _reject_symlink_components(path: Path, repo_root: Path) -> None:
    repo = repo_root.resolve()
    logical_path = Path(os.path.abspath(path))
    try:
        relative = logical_path.relative_to(repo)
    except ValueError as exc:
        raise HarnessError("결과 경로가 저장소 밖입니다") from exc
    cursor = repo
    for component in relative.parts:
        cursor = cursor / component
        if cursor.is_symlink():
            raise HarnessError(f"결과 경로 중간에 symlink가 있습니다: {cursor}")


def read_head(repo_root: Path) -> str | None:
    try:
        completed = subprocess.run(
            ["git", "rev-parse", "HEAD"], cwd=str(repo_root), capture_output=True,
            text=True, shell=False, timeout=10, check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    return completed.stdout.strip() if completed.returncode == 0 else None


def _load_registry(repo_root: Path) -> list[dict[str, Any]]:
    registry_path = repo_root / REGISTRY_RELATIVE
    try:
        data = json.loads(registry_path.read_text(encoding="utf-8"))
        tasks = data["tasks"]
    except (OSError, json.JSONDecodeError, KeyError, TypeError) as exc:
        raise HarnessError(f"tasks.json을 읽을 수 없습니다: {exc}") from exc
    if not isinstance(tasks, list):
        raise HarnessError("tasks.json의 tasks는 배열이어야 합니다")
    return tasks


def _task_for_id(task_id: str, tasks: list[dict[str, Any]]) -> dict[str, Any]:
    match = re.fullmatch(r"task([1-9][0-9]*)", task_id)
    if not match:
        raise HarnessError(f"잘못된 task 번호입니다: {task_id}")
    number = int(match.group(1))
    if number > MAX_PLANNED_TASK_NUMBER:
        raise HarnessError(f"task{number}는 계획 범위 밖입니다. task1~task{MAX_PLANNED_TASK_NUMBER}만 실행할 수 있습니다.")
    number_matches = [
        task for task in tasks
        if isinstance(task, dict) and type(task.get("number")) is int and task.get("number") == number
    ]
    id_matches = [task for task in tasks if isinstance(task, dict) and task.get("taskId") == task_id]
    if len(number_matches) != 1 or len(id_matches) != 1 or number_matches[0] is not id_matches[0]:
        raise HarnessError(f"tasks.json에서 유일한 {task_id} 항목을 찾지 못했습니다")
    return number_matches[0]


def _expected_argv(task: dict[str, Any]) -> list[str]:
    document_id = task.get("documentId")
    if not isinstance(document_id, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9]*", document_id):
        raise HarnessError("documentId 형식이 올바르지 않습니다")
    script = f"test:{document_id.lower()}"
    return ["npm", "--prefix", "tools/site", "run", script]


def _validate_task(task: dict[str, Any], repo_root: Path) -> tuple[list[str], Path]:
    task_id = task.get("taskId", "알 수 없음")
    if task.get("harnessCommand") is None:
        raise HarnessError(f"{task_id}: harnessCommand가 없습니다. queued task는 실행할 수 없습니다.")
    expected_argv = _expected_argv(task)
    if task.get("harnessCommand") != expected_argv:
        raise HarnessError(f"{task_id}: harnessCommand가 허용된 npm argv와 일치하지 않습니다")
    package_path = repo_root / "tools/site/package.json"
    try:
        package = json.loads(package_path.read_text(encoding="utf-8"))
        scripts = package["scripts"]
    except (OSError, json.JSONDecodeError, KeyError, TypeError) as exc:
        raise HarnessError(f"package.json을 확인할 수 없습니다: {exc}") from exc
    if not isinstance(scripts, dict) or expected_argv[-1] not in scripts:
        raise HarnessError(f"{task_id}: package.json에 {expected_argv[-1]} 스크립트가 없습니다")
    return expected_argv, _source_path(task, repo_root)


def _safe_output_root(repo_root: Path, output_root: str | Path | None) -> Path:
    allowed_root = Path(os.path.abspath(repo_root / TASKS_RELATIVE))
    _reject_symlink_components(allowed_root, repo_root)
    candidate = Path(output_root) if output_root is not None else allowed_root
    if not candidate.is_absolute():
        candidate = repo_root / candidate
    candidate = Path(os.path.abspath(candidate))
    try:
        candidate.relative_to(allowed_root)
    except ValueError as exc:
        raise HarnessError(f"결과 경로는 {allowed_root} 내부만 허용됩니다") from exc
    _reject_symlink_components(candidate, repo_root)
    return candidate


def _new_run_directory(task_output_dir: Path, repo_root: Path) -> tuple[Path, str]:
    runs_dir = task_output_dir / "runs"
    _reject_symlink_components(runs_dir, repo_root)
    runs_dir.mkdir(parents=True, exist_ok=True)
    base = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    for suffix in range(1000):
        name = base if suffix == 0 else f"{base}-{suffix}"
        run_dir = runs_dir / name
        try:
            run_dir.mkdir()
            return run_dir, f"runs/{name}"
        except FileExistsError:
            continue
    raise HarnessError("고유한 run 디렉터리를 만들지 못했습니다")


def _assert_output_path(path: Path, output_root: Path, repo_root: Path) -> None:
    logical_path = Path(os.path.abspath(path))
    logical_root = Path(os.path.abspath(output_root))
    try:
        logical_path.relative_to(logical_root)
    except ValueError as exc:
        raise HarnessError("결과 파일 경로가 허용된 tasks root 밖입니다") from exc
    _reject_symlink_components(logical_path, repo_root)


def _write_new_text(path: Path, text: str, output_root: Path, repo_root: Path) -> None:
    _assert_output_path(path, output_root, repo_root)
    try:
        with path.open("x", encoding="utf-8") as stream:
            stream.write(text)
    except OSError as exc:
        raise HarnessError(f"새 결과 파일을 안전하게 만들지 못했습니다: {path}: {exc}") from exc


def _write_new_json(path: Path, payload: dict[str, Any], output_root: Path, repo_root: Path) -> None:
    _assert_output_path(path, output_root, repo_root)
    try:
        with path.open("x", encoding="utf-8") as stream:
            stream.write(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    except OSError as exc:
        raise HarnessError(f"새 JSON 결과 파일을 안전하게 만들지 못했습니다: {path}: {exc}") from exc


def _write_json(path: Path, payload: dict[str, Any], output_root: Path, repo_root: Path) -> None:
    _assert_output_path(path, output_root, repo_root)
    temp_fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    temp_path = Path(temp_name)
    try:
        with os.fdopen(temp_fd, "w", encoding="utf-8") as stream:
            stream.write(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
        _assert_output_path(path, output_root, repo_root)
        os.replace(temp_path, path)
    except OSError as exc:
        temp_path.unlink(missing_ok=True)
        raise HarnessError(f"JSON 결과를 안전하게 저장하지 못했습니다: {path}: {exc}") from exc
    except HarnessError:
        temp_path.unlink(missing_ok=True)
        raise


def run_task(
    task_id: str,
    *,
    repo_root: str | Path = DEFAULT_REPO_ROOT,
    output_root: str | Path | None = None,
    runner: Callable[..., subprocess.CompletedProcess] = subprocess.run,
    head_reader: Callable[[Path], str | None] = read_head,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> dict[str, Any]:
    repo = Path(repo_root).resolve()
    tasks = _load_registry(repo)
    task = _task_for_id(task_id, tasks)
    safe_root = _safe_output_root(repo, output_root)
    task_output = Path(os.path.abspath(safe_root / task_id))
    try:
        task_output.relative_to(safe_root)
    except ValueError as exc:
        raise HarnessError("task 결과 경로가 output root 밖입니다") from exc
    _reject_symlink_components(task_output, repo)
    task_output.mkdir(parents=True, exist_ok=True)
    run_dir, run_relative = _new_run_directory(task_output, repo)

    source_path: Path | None = None
    argv: list[str] | None = None
    preflight_error: str | None = None
    try:
        argv = _expected_argv(task)
    except HarnessError as exc:
        preflight_error = str(exc)
    try:
        source_path = _source_path(task, repo)
    except HarnessError as exc:
        if preflight_error is None:
            preflight_error = str(exc)
    source_hash_before = sha256_file(source_path) if source_path else None
    registry_source_hash = task.get("sourceSHA256")
    if preflight_error is None:
        if not isinstance(registry_source_hash, str) or not re.fullmatch(r"[0-9a-fA-F]{64}", registry_source_hash):
            preflight_error = f"{task_id}: registry sourceSHA256가 유효한 64자리 SHA-256이 아닙니다"
        elif source_hash_before is None or source_hash_before.lower() != registry_source_hash.lower():
            preflight_error = f"{task_id}: stale source hash; tasks.json과 현재 원문 hash가 다릅니다"
    if preflight_error is None:
        try:
            validated_argv, source_path = _validate_task(task, repo)
            argv = validated_argv
        except HarnessError as exc:
            preflight_error = str(exc)
    code_before, code_before_error = code_fingerprint(repo)
    if preflight_error is None and code_before is None:
        preflight_error = f"코드 fingerprint를 수집하지 못했습니다: {code_before_error}"
    head_before = head_reader(repo)
    if head_before is None and preflight_error is None:
        preflight_error = "HEAD를 실행 전에 읽지 못했습니다"

    result: dict[str, Any] = {
        "schemaVersion": 1,
        "taskId": task_id,
        "documentId": task.get("documentId"),
        "status": "failed",
        "executionStatus": "not_run",
        "argv": argv,
        "cwd": str(repo),
        "startedAtUTC": utc_now(),
        "endedAtUTC": None,
        "exitCode": None,
        "headBefore": head_before,
        "headAfter": None,
        "headChangedDuringRun": False,
        "headAvailableBeforeAndAfter": False,
        "sourcePath": task.get("source"),
        "registrySourceSHA256": registry_source_hash,
        "sourceSHA256Before": source_hash_before,
        "sourceSHA256After": None,
        "sourceChangedDuringRun": False,
        "codeFingerprintBefore": code_before,
        "codeFingerprintAfter": None,
        "codeFingerprintErrorBefore": code_before_error,
        "codeFingerprintErrorAfter": None,
        "codeFingerprintAvailableBeforeAndAfter": False,
        "codeChangedDuringRun": False,
        "timeoutSeconds": timeout_seconds,
        "error": preflight_error,
        "runDirectory": run_relative,
    }

    stdout = ""
    stderr = ""
    if preflight_error is None and argv is not None:
        try:
            completed = runner(
                argv, cwd=str(repo), shell=False, capture_output=True, text=True,
                timeout=timeout_seconds, check=False,
            )
            result["exitCode"] = completed.returncode
            result["executionStatus"] = "completed"
            stdout = completed.stdout or ""
            stderr = completed.stderr or ""
        except subprocess.TimeoutExpired as exc:
            result["executionStatus"] = "timeout"
            result["error"] = f"timeout after {timeout_seconds} seconds"
            stdout = _decode_output(exc.stdout)
            stderr = _decode_output(exc.stderr)
        except OSError as exc:
            result["executionStatus"] = "launch_error"
            result["error"] = f"{type(exc).__name__}: {exc}"

    result["endedAtUTC"] = utc_now()
    result["headAfter"] = head_reader(repo)
    result["headAvailableBeforeAndAfter"] = bool(result["headBefore"]) and bool(result["headAfter"])
    result["headChangedDuringRun"] = (
        result["headAvailableBeforeAndAfter"]
        and result["headBefore"] != result["headAfter"]
    )
    if source_path is not None:
        result["sourceSHA256After"] = sha256_file(source_path)
        result["sourceChangedDuringRun"] = result["sourceSHA256Before"] != result["sourceSHA256After"]
    code_after, code_after_error = code_fingerprint(repo)
    result["codeFingerprintAfter"] = code_after
    result["codeFingerprintErrorAfter"] = code_after_error
    result["codeFingerprintAvailableBeforeAndAfter"] = code_before is not None and code_after is not None
    result["codeChangedDuringRun"] = (
        result["codeFingerprintAvailableBeforeAndAfter"]
        and code_before["aggregateSHA256"] != code_after["aggregateSHA256"]
    )
    passed = (
        result["executionStatus"] == "completed"
        and result["exitCode"] == 0
        and result["headAvailableBeforeAndAfter"]
        and not result["sourceChangedDuringRun"]
        and not result["headChangedDuringRun"]
        and result["codeFingerprintAvailableBeforeAndAfter"]
        and not result["codeChangedDuringRun"]
        and result["sourceSHA256Before"] is not None
        and result["sourceSHA256After"] is not None
        and isinstance(registry_source_hash, str)
        and result["sourceSHA256Before"].lower() == registry_source_hash.lower()
        and result["sourceSHA256After"].lower() == registry_source_hash.lower()
    )
    result["status"] = "passed" if passed else "failed"
    _assert_output_path(run_dir, safe_root, repo)
    _assert_output_path(task_output, safe_root, repo)
    _write_new_text(run_dir / "stdout.log", stdout, safe_root, repo)
    _write_new_text(run_dir / "stderr.log", stderr, safe_root, repo)
    _write_new_json(run_dir / "result.json", result, safe_root, repo)
    latest = {"schemaVersion": 1, "latestRun": run_relative, "result": result}
    _write_json(task_output / "harness.json", latest, safe_root, repo)
    return result


def _decode_output(value: str | bytes | None) -> str:
    if value is None:
        return ""
    return value.decode("utf-8", errors="replace") if isinstance(value, bytes) else value


def run_existing24(
    *,
    repo_root: str | Path = DEFAULT_REPO_ROOT,
    output_root: str | Path | None = None,
    runner: Callable[..., subprocess.CompletedProcess] = subprocess.run,
    head_reader: Callable[[Path], str | None] = read_head,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> tuple[list[dict[str, Any]], int]:
    repo = Path(repo_root).resolve()
    tasks = _load_registry(repo)
    first24 = tasks[:24]
    expected_numbers = list(range(1, 25))
    if [task.get("number") for task in first24 if isinstance(task, dict)] != expected_numbers:
        raise HarnessError("tasks.json의 첫 24개 task 번호가 1~24 순서가 아닙니다")
    results = []
    for task in first24:
        results.append(run_task(
            task["taskId"], repo_root=repo, output_root=output_root,
            runner=runner, head_reader=head_reader, timeout_seconds=timeout_seconds,
        ))
    return results, (0 if all(item["status"] == "passed" for item in results) else 1)


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--task", help="tasks.json에 등록된 실행 가능 task1~task134 하나 실행")
    selection.add_argument("--existing24", action="store_true", help="tasks.json 첫 24개 검사 실행")
    parser.add_argument("--output-root", help="audit tasks 폴더 내부 결과 경로")
    parser.add_argument("--timeout-seconds", type=int, default=DEFAULT_TIMEOUT_SECONDS)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    if args.timeout_seconds < 1:
        print("--timeout-seconds는 1 이상이어야 합니다", file=sys.stderr)
        return 2
    try:
        if args.task:
            result = run_task(args.task, output_root=args.output_root, timeout_seconds=args.timeout_seconds)
            print(json.dumps({"taskId": result["taskId"], "status": result["status"], "runDirectory": result["runDirectory"]}, ensure_ascii=False))
            return 0 if result["status"] == "passed" else 1
        results, exit_code = run_existing24(output_root=args.output_root, timeout_seconds=args.timeout_seconds)
        print(json.dumps({"count": len(results), "passed": sum(r["status"] == "passed" for r in results), "failed": sum(r["status"] != "passed" for r in results)}, ensure_ascii=False))
        return exit_code
    except HarnessError as exc:
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
