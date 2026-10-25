# 하네스 task 범위 확장 기록

## 목적과 범위

개념 task registry는 134개지만 기존 `run-harness.py --task`는 task 번호 24 초과를 거부했다. D11 task25처럼 registry에 실행 명령이 명시된 항목의 자동 검증 결과를 같은 append-only evidence 구조에 기록할 수 있도록 단일 task 선택의 허용 상한을 134로 확장했다.

변경 파일은 아래 세 개다.

- `docs/design/concept-cycle-2026-10-22/run-harness.py`
- `docs/design/concept-cycle-2026-10-22/test-harness.py`
- `docs/design/concept-cycle-2026-10-22/HARNESS.md`

`--existing24` 경로와 순서는 변경하지 않았다. 새 선택 flag, 임의 argv, 임의 shell 명령 또는 계획 밖 번호는 허용하지 않는다. `--task`는 task ID와 정수 번호가 registry에서 각각 유일하고 동일 행에 있을 때만 계속 검증한다. task 번호 상한은 134이며, `harnessCommand: null`인 queued task는 `executionStatus: not_run`으로 남고 runner를 호출하지 않는다.

기존 사전 검증·실행 경계는 유지했다. document ID에서 허용 npm argv를 파생하고 registry 명령과 정확히 비교하며, `tools/site/package.json` 스크립트, source 경로 및 `sourceSHA256`, symlink 차단, output-root 제한, timeout, 실행 전후 HEAD와 코드 fingerprint, append-only 원자료와 최신 포인터를 계속 검사한다. task25 테스트는 고정 argv `npm --prefix tools/site run test:d11`과 `shell=False`를 mock runner 호출에서 검증한다.

## 재현 및 검증

앞서 작성한 RED 실행의 원시 로그 파일은 지정 evidence 경로에서 찾지 못했다. 따라서 아래 증거는 원실행 로그로 가장하지 않고 **replayed RED**로 표시했다. HEAD `d2aa2c9aad39b21f7c5a49b1cdd69978d2b8e03a`의 원래 runner와 현재 test 파일을 별도 임시 디렉터리에 복사해 task25·task134 양성 테스트만 다시 실행했다. 두 테스트 모두 기존 `>24` guard에서 `HarnessError`로 끝났고 프로세스 exit code는 1이었다. 격리 입력 사본과 분리된 stdout/stderr는 `harness-luna-logs/replayed-red-input/` 및 `01-replayed-red.*.log`에 보존했다.

수정된 코드로 전체 mock fixture 단위 테스트도 다시 실행했다. 명령은 `python3 docs/design/concept-cycle-2026-10-22/test-harness.py -v`이며 exit code 0, 26개 테스트 통과다. task25와 task134 테스트는 테스트용 임시 저장소 및 주입 runner를 사용한다. 실제 npm/D11 harness는 실행하지 않았다. `--existing24` 실제 실행도 하지 않았다.

각 실행의 argv, cwd 유형, exit code, stdout/stderr SHA-256, 관련 입력 파일 SHA-256은 `harness-luna-logs/00-run-metadata.json`에 기록했다. 원시 stream은 `01-replayed-red.stdout.log`, `01-replayed-red.stderr.log`, `02-green.stdout.log`, `02-green.stderr.log`에 보존했다. RED에서 stdout은 비어 있으며 stderr에는 task25와 task134의 기존 번호 guard 실패가 있다. GREEN의 stderr에는 26개 테스트 결과가 있고 stdout은 비어 있다.

## 입력 및 보호 범위

기록된 HEAD는 `d2aa2c9aad39b21f7c5a49b1cdd69978d2b8e03a`다. 검증 시점의 실제 입력 SHA-256과 task25 원문 registry hash는 `00-run-metadata.json`에서 확인할 수 있다. task25 source인 `docs/knowledge/D11-web-security-basics.md`의 registry SHA와 실제 파일 SHA는 모두 `a9ba3c0109c24d61fcfbaf0e013ab2b90cee5dceac5a8432326f4bc7f63e2fba`다.

Sol의 기존 baseline `harness-sol-logs/00-input-snapshot.json`을 그대로 사용해 등록된 1,331개 경로를 대조했고 전부 일치했다. 기존 `harness-sol-logs/00-preservation.json`의 별도 보존 기준도 그대로 인용한다: 문서 135개, 학습자 서버 구현 17개, 최초 24개 리뷰 24개이며 기존 baseline상 mismatch는 없다. 대조 실행 결과는 `harness-luna-logs/03-scope-preservation.json`에 있다. 이 작업에서는 registry, package, 학습 원문, HTML/UI, collector, 최초 감사 raw/progress/summary/review evidence를 수정하지 않았다.

## 남은 검증 경계

mock runner 테스트는 task 선택, 안전한 argv 구성, 결과 기록과 guard 동작을 확인한다. 실제 task25 npm 스크립트와 24개 일괄 실행은 이번 변경 증거에 포함되지 않았으며, parent가 요청한 최종 harness 기록 단계에서 한 번에 실행해야 한다.
