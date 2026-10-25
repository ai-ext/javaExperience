# D12 Linux proof 독립 명세 검수

**판정: FAIL — Critical 0 / Important 3 / Minor 4.** 명세 검수에서 차단 결함을 확인했으므로 품질 합격 검수는 진행하지 않았다.

검토 대상은 성공 attempt-865a083d60ba.json 및 당시 proof.py SHA-256 `b20a6b16db28eedd87ed0aa287f15ba8f6ffffd60fcf40b49d105a0fde37b9c5`, run_proof.py `983be6c2902b549ba2532d082646bdb5876c3de70879d8889b8415d4815c3eb2`다. 원문 330행 SHA-256 `bcdd88b289812a79e82d1a705d38c0f11477afaadfc76985b2eb50b231d79b0c`와 일치했다. 메인이 수정하기 시작한 이후 현재 소스는 이 판정의 대상이 아니다.

## 독립 재현

- 로컬 Desktop Unix socket을 명시한 모든 Docker 명령, read-only rootfs·proof bind·network none·CPU1·memory256MiB·pids128·tmpfs128MiB exec/nosuid/nodev를 실행 전 inspect로 확인했다.
- 원본 baseline, pipefail 비활성 temp mutant, 직접 상태/df 검사, PID1 검사 모두 실행했다. baseline과 mutant 모두 exit0이므로 기존 검사의 잘못된 통과를 입증했다. 직접 `$?` 캡처는 default0/pipefail7을 구분했다.
- 실제 df Used는 write 전0→8MiB write후8388608→unlink후8388608→close후0, free block32768→30720→30720→32768이다.
- 자기 nonce/이름/ID를 확인한 컨테이너4개만 ID로 제거하고 각각 부재를 확인했다. Docker Desktop에서 접근할 수 없는 macOS temp bind경로로 create가 거절된 초기 reviewer 시도2건도 보존했다.

## 발견 사항

### I1 Important — pipefail의 실제 aggregate status를 측정하지 않아 비활성 mutant가 통과

위치: source-proof/proof.py:75-83 (reviewed SHA b20a6b16)

기존 script는 PIPESTATUS[1]/[0]를 수동 exit한다. set -o pipefail를 set +o pipefail로 바꾼 temp mutant도 exit0 및 pipefail_status=true. 별도 동시 캡처 captured=("$?" "${PIPESTATUS[@]}")는 default aggregate0, pipefail aggregate7을 관측했다.

수정 기준: pipeline 직후 aggregate $?와 PIPESTATUS를 같은 assignment로 캡처하고 aggregate를 검증한다. 원본기록 보존 후 새 attempt를 추가한다.

### I2 Important — container guard 전에 /tmp 디렉터리를 변경

위치: source-proof/proof.py:19-21, main:273-277 (reviewed SHA b20a6b16)

module top-level ROOT.mkdir/chmod가 main의 /.dockerenv/platform/lab marker 검증보다 먼저 실행된다. guard 뒤에만 만든다는 구현 문서와 불일치한다. 호스트 직접호출은 실행하지 않고 source에서 확인했다.

수정 기준: mkdir/chmod를 container guard 뒤로 이동하고 import/direct refusal 경로의 무변경을 검증한다.

### I3 Important — 검사한 context endpoint와 실제 Docker 호출 endpoint를 고정하지 않음

위치: source-proof/run_proof.py:37-39, Docker 호출 전체 (reviewed SHA 983be6c2)

docker context inspect 결과만 Unix인지 검사한 뒤 환경을 상속한 bare docker 명령을 호출한다. DOCKER_HOST 등 override에 대한 고정/거부가 없다. 이 리뷰 당시 override 변수는 없고 실제 desktop-linux Unix socket이므로 기존 실행이 원격이었다는 증거는 없다.

수정 기준: Docker override를 제거하거나 거부하고 검증한 로컬 Desktop Unix endpoint를 모든 명령의 --host에 고정한다.

### M1 Minor — df_before_write 필드가 실제로는 write 후 측정

위치: source-proof/proof.py:233-250 (reviewed SHA b20a6b16)

8MiB write/fsync 후 df를 실행한다. 성공raw Used8429568은 write후이며 statvfs_before_write만 실제 이전 값이다. 독립 측정 df Used는 0→8388608→8388608→0으로 재현했다.

수정 기준: 진짜 write전 df와 write후 df를 각각 실행하고 올바른 필드명으로 새 증거를 추가한다.

### M2 Minor — 소유 ID 확인 후 삭제 대상은 이름으로 다시 지정

위치: source-proof/run_proof.py:118-129 (reviewed SHA 983be6c2)

검증은 ID+nonce로 수행하므로 기존 성공의 자기컨테이너 정리는 확인된다. 단 검사와 삭제 사이 이름 재사용에 대해 동일 ID 삭제를 강제하지 않는다. 실제 교체/오삭제는 관측하지 않았다.

수정 기준: 이름/ID/nonce 일치 확인 후 docker rm --force에는 검증한 container ID를 넘긴다.

### M3 Minor — 초기 실패 소스 fingerprint 누락으로 전 revision의 assertion 보존은 확정 불가

위치: proof-logs/attempt-*.json 및 PROOF-IMPLEMENTATION.md

전체15건은 failure13건+success2건이다. 최신성공 이전14건을 실패14건으로 부르면 cd0c883a506e 성공1건을 잘못 센다. 초기13개 attempt에는 sourceSha256이 없어 원출력 오류원인은 분류 가능하지만 revision별 기대값 비약화를 완전 입증할 수 없다. PIPESTATUS의 최종 workaround는 I1 반례에 취약하다.

수정 기준: 실패13/선행성공1/최신성공1을 구분하며, 보존된 오류로그로 확인한 원인과 미확정한 수정이력을 분리한다.

### M4 Minor — TERM/KILL 실측과 일반적인 정리기회 개념을 구분해야 함

위치: source-proof/proof.py do_signals 및 PROOF-IMPLEMENTATION.md

실측은 TERM handler ack 뒤 생존→release 이후 exit0, 별도 sleep child의 KILL Popen -9이다. 실제 cleanup marker를 생성/비교하는 fixture는 없다. kill_cleanup_unavailable assertion 이름을 정리작업 비교실험으로 읽으면 과장이다.

수정 기준: UI/native 근거는 TERM요청후생존·release후종료와 KILL -9까지만 표시하고 정리기회는 일반 개념 설명으로 둔다.

## 원출력과 범위

기존15개 attempt는 실패13건과 성공2건이다. 최신성공 전14개를 모두 실패로 세지 않는다. 실패원인은 cleanup/inspect JSON 형식, redirection 적용 범위·기대값, PIPESTATUS 캡처, tmpfs noexec, Bash builtin 표기, 제한된 PATH의 Python 경로, 상위 디렉터리 탐색권한, idle inspect JSON형식으로 원출력에 나타난다. 최초 두 정리 실패의 reconciliation은 해당 이름이 그 시각 부재였음을 확인하며, 그 자체가 당시 삭제 명령의 성공원출력은 아니다.

권한은 root orchestrator와 nonroot UID1000/1001/1002 표본을 분리했다. 스트림/환경/권한/신호/HTTP/용량/rsync/Docker PID1 원출력은 재현됐다. network none의 외부경로 차단과 컨테이너 내부 loopback 성공은 양립한다. 인터페이스에는 DOWN tunnel장치도 보였으며 eth0/default route는 없었다. SSH/systemd/Spring Boot와 운영자원은 실행하지 않았다. TERM/KILL의 cleanup marker 비교도 수행하지 않았다.

검수 보고: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-review.json

독립 원출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-logs/independent-656fa995a4406df1.json

기존 attempt별 원출력 감사: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/d12-2026-10-25/proof-sol-logs/original-attempt-audit.json

기존 PLAN·AGENTS·RESUME·구현·학습자코드·기존원출력은 이 리뷰에서 수정하지 않았다. 커밋하지 않았다.
