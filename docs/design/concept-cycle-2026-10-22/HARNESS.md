# 자동 하네스 사용법

`run-harness.py --task`는 `tasks.json`에 유일하게 등록된 task1~task134 중 `harnessCommand`와 npm 스크립트가 준비된 항목 하나를 실행한다. `--existing24`는 기존처럼 첫 24개를 순서대로 실행한다. registry의 명령 문자열을 셸로 전달하지 않고, 명령을 `npm --prefix tools/site run test:<documentId 소문자>` 형태의 argv로 다시 검증한 뒤 `shell=False`로 실행한다. 실행 전에 `tools/site/package.json`에 그 스크립트가 있는지 확인한다. `harnessCommand`가 없는 queued task와 task135 이후 번호는 실행하지 않는다. `build`, Docker, DB, 외부 서비스나 외부 CLI는 실행하지 않는다.

```sh
python3 docs/design/concept-cycle-2026-10-22/run-harness.py --task task1
python3 docs/design/concept-cycle-2026-10-22/run-harness.py --task task1 --timeout-seconds 300
python3 docs/design/concept-cycle-2026-10-22/run-harness.py --existing24
```

`--output-root`는 `docs/design/concept-cycle-2026-10-22/tasks/` 내부의 결과 디렉터리를 지정한다. 그 밖의 경로와 task 결과 폴더 밖으로 향하는 symlink는 거부한다. 기본값은 해당 `tasks/` 폴더다. 실행마다 `tasks/taskN/runs/<UTC timestamp>/`에 `stdout.log`, `stderr.log`, `result.json`을 새로 저장하므로 이전 원시 결과를 덮어쓰지 않는다. `tasks/taskN/harness.json`은 가장 최근의 `runs/...` 경로와 결과 구조를 담는다.

실행 전 `tasks.json`의 `sourceSHA256`가 유효한 64자리 값인지 확인하고 현재 원문과 비교한다. 값이 없거나 다르면 npm 검사를 시작하지 않고 stale preflight 실패를 기록한다. 결과에는 argv, 저장소 루트 cwd, 시작/종료 UTC, exit code, HEAD와 원문 source의 SHA-256 전후 값, 실행 상태가 들어간다. 실행 전 HEAD를 읽지 못하면 npm을 시작하지 않고, 실행 후 HEAD를 읽지 못한 결과도 실패한다.

실행 전후 `tools/site/` 아래 `.mjs`, `.js`, `.css`, `.json` 파일을 `node_modules`를 제외하고 정렬된 SHA-256 manifest와 집계 hash로 기록한다. 두 fingerprint가 없거나 다르면 성공으로 취급하지 않는다. fingerprint를 읽지 못하면 npm 검사를 시작하지 않는다. 출력 경로의 tasks root부터 task/run 폴더까지 symlink가 있으면 결과 파일을 만들기 전에 거부하고, runner가 반환된 뒤 쓰기 직전에도 다시 확인한다. stdout, stderr, raw result는 exclusive 생성하며, 최신 포인터 갱신에는 고유한 exclusive 임시 파일을 사용한다.

스크립트 누락이나 사전 조건 실패는 `executionStatus: not_run`, 실행 시작 실패는 `launch_error`, 제한 시간 초과는 `timeout`으로 남는다. 프로세스 실패, timeout, launch error, 원문 변경, 실행 중 HEAD 또는 코드 fingerprint 변경은 성공으로 취급하지 않는다. 단일 task는 성공 0/실패 1, 잘못된 요청은 2를 반환한다. `--existing24`는 24개 모두를 수집하고 하나라도 실패하면 1을 반환한다.

하네스 통과는 해당 자동 검사 명령의 결과만 뜻한다. 문서 내용의 기술 정확성, 원문 범위, 시각 품질, 브라우저 동작을 승인하지 않는다.

이 하네스는 허용된 npm argv와 결과 경로를 검증한다. npm 스크립트 자체를 OS 격리 환경에서 실행하는 완전한 샌드박스는 아니다.
