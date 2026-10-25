# task8: S08 · S08. 트랜잭션 관리

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S08-transactions.md
- 원문 SHA256: `364142fe4a16b661ab5fee7ec388bcf1b4dca306d37ae9af521a7d40e6fc4e30` / 329줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/s08-2026-10-20/VERIFICATION.md
- 참고 개념: 트랜잭션 관리자와 rollback proxy, 전파·격리·after commit·outbox
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: S08. 트랜잭션 관리
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L26: `PlatformTransactionManager`의 역할
- L32: 전파 7종
- L48: 격리수준과 동시성 이상
- L64: `@Transactional` 속성
- L78: 3. 내부 동작·원리
- L80: 선언적 경계의 호출 흐름
- L106: 전파는 호출 경계와 물리 자원을 나눈다
- L110: 롤백 규칙 매칭
- L120: 이벤트와 커밋의 관계
- L126: 4. 코드로 확인
- L128: 예제 1 — 서비스 경계와 checked 예외 롤백
- L164: 예제 2 — `TransactionTemplate`으로 좁은 구간을 명시
- L202: 예제 3 — 커밋 후 알림과 그 한계
- L235: 5. 버전별 변화 — 왜 바뀌었나
- L244: 6. 실무 가이드
- L255: 아웃박스: DB 커밋과 메시지 전달 사이를 메우기
- L272: 7. 함정·안티패턴
- L282: 8. 자가점검 Q&A (면접 대비)
- L284: Q1. `PlatformTransactionManager`와 `@Transactional`의 관계는?
- L290: Q2. 내부 `REQUIRED` 메서드가 rollback-only가 되면 왜 바깥 커밋에서 예외가 나는가?
- L295: Q3. `REQUIRES_NEW` 대신 `NESTED`를 선택할 수 있는 상황은?
- L300: Q4. checked 예외를 던졌는데 롤백되지 않는 이유와 해결책은?
- L306: Q5. `isolation=SERIALIZABLE`이면 재시도 코드는 필요 없는가?
- L311: Q6. `@TransactionalEventListener(AFTER_COMMIT)`와 아웃박스의 차이는?
- L316: 9. 참고문헌

## 기존 관련 파일

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s08-learning.bundle.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s08-learning.css
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s08-learning.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s08-learning.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s08-lesson-data.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:s08`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task8/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
