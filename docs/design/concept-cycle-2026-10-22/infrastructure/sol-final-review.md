# 자동 하네스 독립 Sol 최종 검토

HEAD: `4b0493af52b1a06decca909d6bf9a8b6f9610686`.

판정: **pass — 하네스 계약 범위의 spec→quality 관문 승인**. fresh21개 unit이 모두 통과했다. 이전 HARNESS-001~005의 재현된 결함은 해결됐고 새 critical/important는 확인하지 못했다. 문서 전체 완료를 뜻하지 않는다.

## 직접 재실행 결과

- **HARNESS-001 해결**: HEAD 누락 3조합 모두 failed. 실행 전 누락은 runner 미호출, 실행 후 누락은 실행 뒤 failed.
- **HARNESS-002 해결**: 기준 source hash 불일치/누락/무효 모두 runner 미호출·failed. 현재 실제 원문24개 baseline 일치.
- **HARNESS-003 해결**: test 코드 변경은 failed/codeChangedDuringRun=true. 코드 경로·해시 manifest 기록. fingerprint before 미확보는 미실행, after 미확보는 실행 뒤 failed.
- **HARNESS-004 해결**: tasks root 및 task1→task2 symlink는 runner 전에 거부. 외부 파일 생성 없음, sibling sentinel 보존.
- **HARNESS-005 해결**: runner가 만든 run_dir 및 stdout/stderr/result 실제 출력 symlink는 HarnessError, passed 미반환, 외부 sentinel 보존. 구 PID 임시파일 symlink는 쓰기 대상이 아니므로 무시되어 passed지만 외부 sentinel 보존. latest는 mkstemp exclusive 임시파일로 올바른 task 경로에 기록.

특히 구 `.harness.json.<pid>.tmp` symlink 사례는 **passed**였다. 이제 그 경로를 열지 않으므로 sentinel이 보존되며, 고유 exclusive 임시파일을 사용해 정상 latest를 썼다. 두 종류의 symlink를 모두 failed로 차단했다고 보고하지 않는다. 실제 run/raw 쓰기 대상 symlink는 거부됐다.

## 승인 입력 SHA-256

- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/run-harness.py`: `4339c5494a5efc9a39fedd4f10d92ba3b8f3ef47255204f985d8731490c9548f`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/test-harness.py`: `684836988be54c10218cf067a079de037bed95fd3aae1fc8a0945a195922b1e1`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/HARNESS.md`: `bda4297fbbb2a930301207e0ba076bf7ce1884494f29ef86fe6e6beb2429d6f7`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/AUDIT-CONTRACT.md`: `06f0bad92b7fcb7b4bc590ea8e9d891556c68d2de94dcb2223997dbd5f453cfb`
- `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks.json`: `119100f9cecf80065cecb721724498f7572ca99c341da7433dc2ce17349f1cd0`

## 새 실행 증거

- fresh21 unit, exit0: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-final-unit-tests.log`.
- 이전5 finding 직접 fixture 재실행: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-final-edge-cases.log`.
- 현재 HEAD/해시/코드 manifest/원문 baseline: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/infrastructure/sol-final-static-checks.log`.

현재 tools/site 코드 manifest는 418개다. 실제 원문24개의 registry 기준 해시가 모두 일치하며 대응 npm 스크립트도 모두 존재한다. 검토 시작과 완료 시 승인 입력 해시가 일치했다.

## 승인 한계

- 실제 existing24/npm은 아직 미실행이다. fresh21 unit 및 이전 재현은 임시 저장소와 injected runner를 사용했으며 실제 npm·DB·브라우저를 검증하지 않았다.
- 승인 범위는 허용 argv, 코드/원문/HEAD 증거, 재현한 출력 경계 계약이다. 신뢰되지 않은 npm 코드의 모든 파일시스템 쓰기를 OS 수준에서 격리하는 샌드박스가 아니다.
- 동시 race/악의적 TOCTOU 완전 차단을 주장하지 않는다. 검증한 실행 후 symlink는 runner가 반환하기 전에 결정적으로 생성한 입력이다.
- PID 임시파일 사례를 failed로 보고하지 않는다. 구 경로는 더 이상 사용하지 않기 때문에 sentinel을 건드리지 않고 정상 passed를 반환했다. 실제 출력 경로의 symlink 거부와 구분한다.
- 코드 fingerprint는 tools/site의 .mjs/.js/.css/.json에 한정되고 node_modules, 생성 HTML, 도구 버전 및 외부 실행 환경 전체를 식별하지 않는다.
- 학습 문서 전체 coverage, 내용의 기술 정확성, 시각 품질, 현재 브라우저, 다른 환경 재현, 전체 문서 완료는 이 하네스 관문 승인의 대상이 아니다.

다음 작업은 메인의 실제 기존24 npm 검사 실행이다. 이 검토에서는 application·원문·하네스·테스트·Git을 수정하지 않았고, 이전 review 산출물을 보존했다.
