# 자동 하네스 독립 Sol 검토

검토 HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`. 대상: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/run-harness.py`.

판정: **needs_fix**. fresh unit 12개는 모두 통과했지만, 추가 임시 fixture에서 important 4건을 재현했다. critical 0건. 요구사항 검토가 실패했으므로 품질 관찰은 진단용이며 승인으로 승격하지 않는다.

## 요구사항 검토

- task1~task24만 실행; task25 이상 거부: **pass** — 기존 unit + 추가 task0/task01/task25/task134/taskx/task-1/경로 주입 거부 fixture. 실제 npm 미실행.
- 고정 argv 및 shell=False: **pass** — 12개 unit 중 argv/셸 및 잘못된 registry command 거부. 현재 24 script 존재도 정적 확인.
- nonzero/timeout/launch_error/스크립트 누락은 실패: **pass** — fresh unit의 4개 분기 통과. runner/timeout은 mock 주입이며 실제 npm 프로세스 timeout 실험은 미실행.
- 실행 중 원문/HEAD drift는 실패: **partial** — 값이 모두 있는 drift unit은 통과. HEAD 불완전 증거는 HARNESS-001로 실패.
- 기준 원문과 코드 해시 귀속: **fail** — HARNESS-002, HARNESS-003.
- 출력 경계 및 nondestructive 기록: **fail** — HARNESS-004. 정상 경로의 raw run 고유 이름/이전 result 보존은 unit 통과.
- 자동검사 결과와 전체 문서 완료 구분: **pass** — HARNESS.md와 AUDIT-CONTRACT.md는 자동검사 통과의 한계를 명시한다. 본 검토도 전체 문서 완료를 승인하지 않는다.

## 품질 발견사항

### HARNESS-001 · important

위치: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/run-harness.py:236`.

HEAD 조회가 불완전해도 자동검사 결과가 passed가 된다.

재현: headBefore/headAfter가 모두 null, 또는 headAfter만 null이어도 status=passed. 228~232행은 두 값이 있을 때만 변경을 판정하며 236~243행은 HEAD 존재를 요구하지 않는다.

최소 수정: HEAD 전후 값이 모두 유효하게 조회된 경우에만 passed를 허용하고 누락은 failed/unverified와 구체 원인으로 기록한다. 가능하면 실행 전 HEAD 실패 시 npm을 시작하지 않는다.

재검증: HEAD (None,None), (정상,None), (None,정상)을 각각 주입해 passed가 나오지 않는 회귀 검사. 정상 동일 HEAD 통과와 서로 다른 HEAD 실패를 유지한다.

### HARNESS-002 · important

위치: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/run-harness.py:197`.

tasks.json의 기준 원문 sourceSHA256과 현재 원문을 비교하지 않아 기준과 다른 원문도 passed가 된다.

재현: registry sourceSHA256=000...000과 실제 before=32e59b64...가 불일치한데 status=passed. 결과에는 기대 해시/기준 불일치가 없다. 현재 실제 24개 원문은 registry 해시와 모두 일치한다.

최소 수정: registry의 sourceSHA256을 기대값으로 검증·보존하고 실행 전 실제 원문과 불일치하거나 기준값이 누락/무효하면 기준 원문 검증 성공으로 표시하지 않는다. 기준 갱신은 명시적인 별도 작업으로 남긴다.

재검증: 정상 일치, 불일치, 누락/잘못된 해시 fixture에서 일치만 passed. 현재 실행 중 원문 변경 실패 검사는 유지한다.

### HARNESS-003 · important

위치: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/run-harness.py:182`.

검사 대상 실제 코드 해시를 기록하지 않아 결과를 검사한 코드 상태에 귀속하거나 이후 stale 여부를 판단할 수 없다.

재현: 동일 HEAD를 반환하면서 test-p09.mjs 내용 해시를 ba06d86e...에서 11789929...로 바꾸어도 status=passed. 결과 해시 필드는 sourceSHA256Before/After뿐이다. 이 작업 트리는 미커밋 변경이 존재하므로 HEAD만으로 코드 상태를 식별할 수 없다.

최소 수정: 해당 npm 명령을 구성하는 package.json과 task 관련 검사/lesson/controller/renderer 등 실제 검증 입력 코드의 경로·SHA-256 manifest를 결과에 귀속한다. 실행 전후 코드 입력이 바뀌면 failed/stale로 기록하며 이후 결과 사용 시 같은 코드 해시인지 확인할 수 있게 한다.

재검증: 원문과 HEAD가 그대로인 상태에서 관련 test/lesson 코드 변경을 주입해 정상 통과로 승격되지 않는 검사. 동일 코드 재실행은 통과하고 결과에 관련 경로와 정확한 해시가 남는지 검사.

### HARNESS-004 · important

위치: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/run-harness.py:116`.

출력 루트 자체 및 task 폴더 symlink가 논리 경계를 바꾸어 범위 밖 기록 또는 다른 task 최신 결과 덮어쓰기를 허용한다.

재현: tasks→repo/outside symlink fixture에서는 outside/task1/harness.json을 작성하고 passed. task1→tasks/task2 fixture에서는 기존 task2/harness.json이 task1 결과로 교체된다. 116행은 허용 경계도 resolve하며 166~168행은 task 폴더를 resolve한 후 safe_root 내부인지만 확인한다. 현재 실제 tasks 루트/24개 task 출력 폴더에는 이 symlink가 없다.

최소 수정: 신뢰 경계를 resolve된 저장소 안의 논리 tasks 경로와 taskN 소유 폴더로 고정하고, 해당 경계를 바꾸는 tasks/taskN symlink를 결과 생성 전에 거부한다. 허용된 하위 output-root와 runs 경계 검사도 유지한다.

재검증: tasks 루트→외부 및 task1→task2 symlink를 각각 fixture로 구성해 runner 미호출·외부 기록 없음·task2 기존 내용 보존을 확인한다. 기존 runs symlink 거부와 정상 고유 run 보존 검사도 유지한다.

## 실행 증거와 범위

- 12개 unit fresh 실행: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-unit-tests.log` (exit 0).
- 추가 fixture 재현: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-edge-cases.log`.
- 현재 24개 해시/스크립트 및 검토 코드 해시: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-static-checks.log`.
- 실제 `--existing24` 또는 npm은 실행하지 않았다. application·원문·공유 장부·기존 증거는 수정하지 않았다.
- failure exit/timeout/launch error는 mock runner 단위 검증이다. 실제 프로세스·DB·브라우저의 실행 결과로 해석하지 않는다.
- 현재 실제 24개 원문은 registry 해시와 일치하며, tasks/taskN 출력 symlink는 없다. fixture 결과는 실패 경계의 결함을 보여 준다.
- 정상 순차 실행의 원시 run 덮어쓰기 방지는 확인했다. 동시 실행·강제 종료·TOCTOU는 미검증이다.
- 문서 전체 완료·기술 사실·시각 품질·현재 브라우저 동작은 검토 범위 밖이다.

다음 작업은 Luna 최소 수정 및 회귀 검사 → 새 코드 해시에 대한 fresh unit → 독립 Sol spec→quality 재검토다.
