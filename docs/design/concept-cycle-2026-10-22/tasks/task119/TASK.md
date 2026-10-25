# task119: W08 · W08. 예외는 어디서 잡나 — 계층별 처리와 전역 핸들러

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W08-where-to-handle-exceptions.md
- 원문 SHA256: `7e2afa96f88843fb5bbb03d0b3a2afaf523341252d471cc538e6459c90a5886b` / 390줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 예외를 잡는 기준과 계층 책임, Spring rollback rules, checked/caught exceptions, MVC local handler vs global Advice and ProblemDetail, 로그 경계, 개인정보, 중복 사건
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W08. 예외는 어디서 잡나 — 계층별 처리와 전역 핸들러
- L7: 1. 질문
- L17: 2. 짧은 답
- L27: 3. 왜 그런가 — 원리
- L48: 어디서 잡나: 판단 기준
- L58: 트랜잭션이 예외를 보는 방식
- L64: 4. 선택지 비교
- L74: 5. 코드로 보기
- L78: 도메인 오류와 서비스
- L157: 선택 A: 그 컨트롤러에서만 처리
- L186: 선택 B: API 공통 Advice
- L232: 기술 예외를 도메인 예외로 변환
- L270: 체크 예외를 롤백해야 할 때
- L300: 6. 실무에서는 실제로
- L310: 7. 흔한 오해와 실수
- L322: 8. 자가점검 Q&A (면접 대비)
- L324: Q1. 어떤 경우에 예외를 잡나?
- L332: Q2. Repository, Service, Controller의 책임을 비교하라.
- L340: Q3. Spring에서 런타임 예외가 많은 이유와 체크 예외의 용도는?
- L348: Q4. 컨트롤러 로컬 처리와 전역 Advice는 어떻게 고르나?
- L356: Q5. 트랜잭션 메서드에서 예외를 catch하면 롤백되나?
- L364: Q6. Problem Details에서 클라이언트가 무엇으로 분기해야 하나?
- L372: Q7. 같은 예외를 여러 계층에서 로깅하면 어떤 문제가 있나?
- L380: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task119/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task119/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task119/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task119/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w08`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task119/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task119/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
