#!/usr/bin/env python3
"""정적 시나리오 snapshot을 javaExperience의 로컬 DB 설정으로 맞춘다."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

CONFIG_PATHS = {
    "src/main/resources/application.yml",
    "src/main/resources/application-practice.yml",
    "src/main/resources/application-project.yml",
}
SHA1_RE = re.compile(r"^[0-9a-f]{40}$")


def git_blob_sha1(content: bytes) -> str:
    header = f"blob {len(content)}\0".encode("ascii")
    return hashlib.sha1(header + content).hexdigest()


def localize_config(path: str, content: bytes) -> bytes:
    text = content.decode("utf-8")
    if path not in CONFIG_PATHS:
        return content

    text = text.replace("localhost:3306", "localhost:13308")
    if path == "src/main/resources/application.yml":
        text = text.replace(
            "# studymate MySQL의 community DB. 시작하기 안내대로 studymate를 먼저 띄운다",
            "# compose.yaml의 mysql(호스트 13308 → 컨테이너 3306)의 community DB(시나리오용). 앱을 띄우기 전에 docker compose up -d",
        )
        text = text.replace(
            "# studymate MySQL(호스트 3306)의 project DB. 빈 DB면 Flyway가 V1으로 테이블·시드를 만든다",
            "# compose.yaml의 mysql(호스트 13308 → 컨테이너 3306)의 project DB. 빈 DB면 Flyway가 V1으로 테이블·시드를 만든다",
        )
    return text.encode("utf-8")


def load_indexes(snapshot_dir: Path) -> list[tuple[Path, dict, str]]:
    indexes = []
    for index_path in sorted(snapshot_dir.glob("*.json")):
        try:
            raw = index_path.read_text(encoding="utf-8")
            data = json.loads(raw)
        except (OSError, UnicodeError, json.JSONDecodeError) as error:
            raise ValueError(f"snapshot index를 읽을 수 없습니다: {index_path}: {error}") from error
        if not isinstance(data, dict) or not isinstance(data.get("files"), list):
            raise ValueError(f"snapshot 형식이 올바르지 않습니다: {index_path}")
        if data.get("id") != index_path.stem:
            raise ValueError(f"snapshot id와 파일명이 다릅니다: {index_path}")
        newline = "\n" if raw.endswith("\n") else ""
        indexes.append((index_path, data, newline))
    if not indexes:
        raise ValueError(f"snapshot index가 없습니다: {snapshot_dir}")
    return indexes


def write_index(index_path: Path, data: dict, newline: str) -> None:
    rendered = json.dumps(data, ensure_ascii=False, indent=2) + newline
    index_path.write_text(rendered, encoding="utf-8")


def normalize(snapshot_dir: Path) -> tuple[int, int, int, int]:
    blob_dir = snapshot_dir / "blobs"
    if not blob_dir.is_dir():
        raise ValueError(f"blob 디렉터리가 없습니다: {blob_dir}")
    indexes = load_indexes(snapshot_dir)
    original_blobs = {blob_path.stem: blob_path.read_bytes() for blob_path in blob_dir.glob("*.txt")}

    # 모든 참조를 먼저 확인해, 일부 파일을 바꾼 뒤 입력 오류를 발견하지 않게 한다.
    referenced = set()
    for index_path, data, _ in indexes:
        for file_ref in data["files"]:
            if not isinstance(file_ref, dict):
                raise ValueError(f"파일 참조 형식이 올바르지 않습니다: {index_path}")
            blob = file_ref.get("blob")
            if not isinstance(blob, str) or not SHA1_RE.fullmatch(blob):
                raise ValueError(f"blob SHA1 형식이 올바르지 않습니다: {index_path}: {blob!r}")
            if blob not in original_blobs:
                raise ValueError(f"참조한 blob이 없습니다: {index_path}: {blob}")
            if git_blob_sha1(original_blobs[blob]) != blob:
                raise ValueError(f"blob 내용과 SHA1이 다릅니다: {blob}")
            referenced.add(blob)

    content_by_sha: dict[str, bytes] = {}
    changed_hashes = 0
    for index_path, data, newline in indexes:
        index_changed = False
        for file_ref in data["files"]:
            config_path = file_ref.get("path")
            if config_path not in CONFIG_PATHS:
                continue
            old_hash = file_ref["blob"]
            updated = localize_config(config_path, original_blobs[old_hash])
            new_hash = git_blob_sha1(updated)
            if updated != original_blobs[old_hash]:
                changed_hashes += 1
                content_by_sha[new_hash] = updated
            file_ref["blob"] = new_hash
            index_changed |= new_hash != old_hash
        if index_changed:
            write_index(index_path, data, newline)

    # 고친 blob을 쓴 뒤 모든 index가 가리키는 컨텐츠만 남긴다.
    for blob, content in content_by_sha.items():
        (blob_dir / f"{blob}.txt").write_bytes(content)

    # 같은 내용은 Git blob SHA1 하나로 공유하고, 미참조 blob은 제거한다.
    final_refs = set()
    for index_path, data, _ in indexes:
        for file_ref in data["files"]:
            blob = file_ref["blob"]
            final_refs.add(blob)
            content = (blob_dir / f"{blob}.txt").read_bytes()
            if git_blob_sha1(content) != blob:
                raise ValueError(f"정규화 후 blob SHA1 불일치: {blob}")
            if file_ref.get("path") in CONFIG_PATHS:
                text = content.decode("utf-8")
                if "localhost:3306" in text:
                    raise ValueError(f"공개 설정에 localhost:3306이 남았습니다: {index_path} {file_ref['path']}")
                if file_ref["path"] == "src/main/resources/application.yml" and "studymate" in text.lower():
                    raise ValueError(f"studymate 안내가 남았습니다: {index_path} {file_ref['path']}")

    removed = 0
    for blob_path in blob_dir.glob("*.txt"):
        if blob_path.stem not in final_refs:
            blob_path.unlink()
            removed += 1

    # 모든 refs와 모든 남은 blob을 다시 검사하고 동일 컨텐츠 중복을 막는다.
    hashes_by_content: dict[bytes, str] = {}
    for blob_path in sorted(blob_dir.glob("*.txt")):
        content = blob_path.read_bytes()
        expected = git_blob_sha1(content)
        if blob_path.stem != expected:
            raise ValueError(f"blob 파일명이 내용 SHA1과 다릅니다: {blob_path}")
        if content in hashes_by_content:
            raise ValueError(f"중복 blob 파일이 남았습니다: {blob_path} / {hashes_by_content[content]}")
        hashes_by_content[content] = blob_path.name

    total_refs = sum(len(data["files"]) for _, data, _ in indexes)
    return len(indexes), total_refs, changed_hashes, removed


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--snapshots-dir",
        type=Path,
        default=Path(__file__).resolve().parents[2] / "scenario" / "snapshots",
        help="snapshot index와 blobs 디렉터리 (기본값: 저장소의 scenario/snapshots)",
    )
    args = parser.parse_args()
    try:
        indexes, refs, changed, removed = normalize(args.snapshots_dir)
    except (OSError, UnicodeError, ValueError) as error:
        print(f"오류: {error}", file=sys.stderr)
        return 1
    blob_count = len(list((args.snapshots_dir / "blobs").glob("*.txt")))
    print(f"snapshot index: {indexes}")
    print(f"파일 참조: {refs}")
    print(f"환경에 맞춰 갱신한 설정 참조: {changed}")
    print(f"삭제한 미참조 blob: {removed}")
    print(f"남은 blob: {blob_count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
