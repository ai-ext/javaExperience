# 자동 하네스 독립 Sol 재검토

HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`.

판정: **needs_fix**. fresh unit 18개는 통과했고 이전 important4개 재현은 해결됐다. 실행 후 출력 symlink 처리에서 새로운 important1개가 남는다. critical 0개. 요구사항 실패이므로 품질 승인은 부여하지 않는다.

## 이전 발견사항 재실행

- **HARNESS-001 해결**: HEAD (None,None)/(정상,None)/(None,정상)은 모두 failed. 실행 전 HEAD 누락은 runner 0회.
- **HARNESS-002 해결**: registry 기준 해시 불일치/누락/무효는 failed/not_run, runner 0회. 현재 실제 원문24개도 registry 기준과 모두 일치.
- **HARNESS-003 해결**: 동일 HEAD에서 실제 test-p09.mjs 변경은 codeChangedDuringRun=true/failed. 코드 manifest 경로와 SHA-256 기록. fingerprint before 누락은 미실행, after 누락은 runner 1회 뒤 failed. 현재 실제 tools/site manifest는 418개 코드 파일.
- **HARNESS-004 해결**: 실행 전 tasks 루트 symlink 및 task1→task2 symlink 모두 HarnessError/runner 0회. 범위 밖 새 파일 없음·기존 task2 sentinel 보존. 실행 후 생성되는 symlink 문제는 별도 HARNESS-005.

## HARNESS-005 · important

위치: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/run-harness.py:357`, 관련 `_write_json`은 212~215행.

symlink 검사는 runner 이전에만 수행되며 결과 기록 시 경계를 다시 확인하지 않는다. 실행 중 생성된 run/임시 결과 symlink를 따라 범위 밖 파일을 작성·덮어쓰고 passed를 반환한다.

재현은 임시 fixture의 injected runner 한 번으로 이루어진다. runner가 생성된 빈 run 디렉터리를 `outside` symlink로 교체하면 `stdout.log`, `stderr.log`, `result.json`이 outside에 기록되고 passed다. 별도 fixture에서 예측 가능한 `.harness.json.<pid>.tmp`를 외부 sentinel symlink로 만들면 sentinel 내용이 JSON으로 덮어써지고 passed다. 별도 동시 race는 사용하지 않았다.

최소 수정: runner 완료 후 실제 결과 쓰기 직전에 tasks/task/run 및 각 쓰기 대상의 symlink 경계를 확인해 변경 시 안전하게 중단한다. 로그는 생성한 run 경로에 새 파일로만 쓰고, JSON 임시 파일은 symlink를 따라 열지 않는 exclusive 생성(mkstemp 등)으로 만든 뒤 교체한다. 외부 대상이나 기존 원시 run을 덮어쓰지 않도록 한다.

재검증: 두 fixture를 회귀 검사로 추가해 run symlink 또는 .harness.json.<pid>.tmp symlink가 실행 중 생성돼도 outside에 새 파일이 생기지 않고 sentinel 내용이 보존되며 passed가 나오지 않는지 확인한다. 정상 기록·이전 raw run 보존·18개 기존 테스트도 유지한다.

## 검토 입력 해시

- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/run-harness.py`: `a7713b4d240bc2dc69f619d2e3d9530b05f53d79591cda15c5c9a2ed1140d99e`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/test-harness.py`: `19dec8279d8c16a5b385d1c2f62adb16eaa129800b5f418ef89e99d166c3ad60`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/HARNESS.md`: `2fcb4ed80ba7d1e2c6141cc7f451b25ce152c07368bfe2493a13307b40917103`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/AUDIT-CONTRACT.md`: `06f0bad92b7fcb7b4bc590ea8e9d891556c68d2de94dcb2223997dbd5f453cfb`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks.json`: `119100f9cecf80065cecb721724498f7572ca99c341da7433dc2ce17349f1cd0`

## 새 실행 증거와 한계

- 18개 unit, exit 0: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-rereview-unit-tests.log`.
- 이전 재현 및 신규 symlink 재현: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-rereview-edge-cases.log`.
- fingerprint after 누락 수정 fixture: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-rereview-fingerprint-postflight.log`.
- 현재 코드·원문 baseline·입력 해시: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-rereview-static-checks.log`.

- 실제 --existing24/npm은 미실행이다. unit 및 재현은 임시 저장소와 injected runner만 사용했다.
- code fingerprint 범위는 HARNESS.md에 명시된 tools/site의 .mjs/.js/.css/.json이며 node_modules·생성 HTML·외부 도구 버전·실행 환경 전체를 식별하지 않는다.
- 이번 새 finding은 실제 프로젝트에서 문제가 발생했다는 뜻이 아니다. 현재 직접 확인한 것은 fixture에서 실행 후 경계가 변하면 범위 밖 쓰기가 가능한 동작이다.
- 추가 재현 로그의 첫 fingerprint-after 사례는 macOS 임시 경로 정규화가 안 된 fixture로 runner가 미실행됐다. 그 사례로 after 누락을 승인하지 않았으며 sol-rereview-fingerprint-postflight.log의 수정 fixture로 runner 1회 후 failed를 다시 확인했다.
- 동시 공격에 대한 파일시스템 전체 TOCTOU 방어는 검증하지 않았다. 이번 발견은 동시 race 없이 재현된 실행 후 경계 문제다.
- 문서 원문 전체 coverage·기술 정확성·시각 품질·브라우저/DB 동작·전체 문서 완료를 승인하지 않는다.

`run-harness.py`, `test-harness.py`, 원문, application, Git은 수정하지 않았다. 기존 `sol-review.*`도 보존했다.
