#!/usr/bin/env python3
"""16-4 참조 코드에 L12~L14 코드를 순서대로 적용해 독립 실습 폴더를 만든다."""

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCENARIO = ROOT / "scenario"
LABS = ("l12-query-methods", "l13-declared-queries", "l14-querydsl-extension")


def materialize(output: Path, through: str) -> None:
    marker = output / ".java-query-stage"
    previous = None
    if output.exists() and any(output.iterdir()):
        if not marker.is_file() or marker.read_text().strip() not in LABS:
            raise SystemExit(f"이미 다른 파일이 있는 폴더입니다: {output}")
        previous = marker.read_text().strip()
        if LABS.index(through) <= LABS.index(previous):
            raise SystemExit(f"현재 {previous} 단계입니다. 다음 단계만 적용할 수 있습니다.")
    output.mkdir(parents=True, exist_ok=True)
    count = 0
    if previous is None:
        snapshot = json.loads((SCENARIO / "reference/16-4.json").read_text())
        count = len(snapshot["files"])
        for item in snapshot["files"]:
            source = SCENARIO / "reference/blobs" / f'{item["blob"]}.txt'
            target = output / item["path"]
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
        for name in ("gradlew", "gradlew.bat", "gradle/wrapper/gradle-wrapper.jar",
                     "gradle/wrapper/gradle-wrapper.properties"):
            target = output / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, target)
        (output / "gradlew").chmod(0o755)
    start = LABS.index(previous) + 1 if previous else 0
    for lab in LABS[start: LABS.index(through) + 1]:
        for source in (SCENARIO / "labs" / lab / "code").rglob("*"):
            if source.is_file():
                target = output / source.relative_to(SCENARIO / "labs" / lab / "code")
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
    # 참조 스냅샷과 L12 overlay의 원래 DB 포트(3306)를 공개 레포 포트로 맞춘다.
    for name in ("application.yml", "application-practice.yml"):
        config = output / "src/main/resources" / name
        config.write_text(config.read_text().replace("localhost:3306", "localhost:13308")
                          .replace("studymate MySQL", "javaExperience MySQL")
                          .replace("studymate를 먼저 띄운다", "javaExperience DB를 먼저 띄운다"))
    marker.write_text(through + "\n")
    print(f"{count}개 본편 파일 + {through}까지 적용: {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--through", choices=LABS, default=LABS[-1])
    args = parser.parse_args()
    materialize(args.output, args.through)
