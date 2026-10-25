# task64: P13 · P13. Git 실무 — 충돌 해결·되돌리기·브랜치 작업

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P13-git-practical.md
- 원문 SHA256: `764bd6d856489275937c7a622b637da7478072589f3de5fdb18ddab1098f080d` / 418줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 작업 디렉터리·index·HEAD, 브랜치·원격·fetch/pull, 충돌·restore/reset/revert/stash, merge/rebase/cherry-pick과 이력, 비밀값과 ignore
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P13. Git 실무 — 충돌 해결·되돌리기·브랜치 작업
- L7: 1. 한 줄로 말하면
- L15: 2. 당장 알아야 할 것
- L17: 2.1 세 영역과 HEAD
- L38: 2.2 브랜치는 복사본이 아니라 이름이다
- L51: 2.3 원격은 fetch와 pull을 나눈다
- L64: 2.4 충돌을 읽고 해결한다
- L81: 편집기로 충돌 마커를 모두 제거하고 최종 내용을 저장
- L89: 2.5 되돌리기 결정표
- L103: 2.6 stash는 임시 선반이다
- L115: 2.7 merge, rebase, cherry-pick
- L130: 2.8 비밀값과 ignore
- L149: 3. 따라 하기
- L153: 3.1 레포 생성과 분기
- L168: 3.2 의도적으로 충돌 만들기
- L208: 3.3 실수한 수정, stash, soft reset
- L234: 3.4 reflog로 HEAD 찾기
- L271: 3.5 Spring Boot PR 전 순서
- L289: 4. 치트시트
- L309: 5. 자주 나는 에러와 해결
- L311: non-fast-forward
- L315: detached HEAD
- L319: local changes would be overwritten
- L323: untracked working tree files would be overwritten
- L327: CONFLICT / needs merge
- L331: CRLF/LF 때문에 파일 전체가 변경됨
- L335: reset --hard를 후회함
- L339: 6. 한 단계 더
- L347: 7. 자가점검 Q&A (면접 대비)
- L349: Q1. git diff와 git diff --cached의 차이는?
- L356: Q2. 충돌 마커의 ours와 theirs는?
- L363: Q3. push한 커밋은 왜 reset보다 revert인가?
- L370: Q4. merge와 rebase는 언제 선택하는가?
- L377: Q5. fetch와 pull의 차이는?
- L384: Q6. stash에 새 파일이 빠지는 이유는?
- L391: Q7. reset 후 커밋을 복구하는 방법은?
- L398: Q8. ignore했는데 비밀값이 원격에 남는 이유는?
- L405: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task64/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task64/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task64/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task64/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p13`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task64/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task64/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
