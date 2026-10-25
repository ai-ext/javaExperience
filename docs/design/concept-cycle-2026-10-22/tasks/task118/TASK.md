# task118: W07 · W07. 왜 System.out.println 대신 로거(SLF4J)를 쓰나

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W07-why-logger.md
- 원문 SHA256: `432bf8d9bf113b211f20257a44ade4168618471c63366fee87a0c61f4fa9a3c4` / 302줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: SLF4J facade vs logging provider, Logger levels and lazy parameter evaluation, Exception logging, MDC context and structured logs, Synchronous vs asynchronous logging choice
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W07. 왜 System.out.println 대신 로거(SLF4J)를 쓰나
- L7: 1. 질문
- L15: 2. 짧은 답
- L25: 3. 왜 그런가 — 원리
- L27: `println`은 쓰기만 하고 운영 정책은 모른다
- L33: 파사드와 구현체가 분리되는 이유
- L41: 로그 레벨은 운영 시점의 선택 스위치다
- L47: 출력에서 검색까지는 별도의 파이프라인이다
- L66: 자리표시자와 예외는 이벤트의 비용·정보를 바꾼다
- L74: MDC와 JSON은 검색 문맥을 만든다
- L84: 4. 선택지 비교
- L96: 5. 코드로 보기
- L160: application.properties — Boot에서 logger 레벨을 패키지 단위로 조정
- L164: 중앙 수집기가 JSON을 받도록 구성한 환경에서 선택
- L201: 6. 실무에서는 실제로
- L213: 7. 흔한 오해와 실수
- L224: 8. 자가점검 Q&A (면접 대비)
- L226: Q1. Spring Boot에서 `println` 대신 SLF4J를 쓰는 운영상 이유는?
- L234: Q2. SLF4J와 Logback은 각각 무엇인가?
- L242: Q3. DEBUG 레벨을 INFO로 바꾸면 어떤 코드 비용이 없어지나?
- L250: Q4. 예외를 로깅할 때 스택 추적을 어떻게 보존하나?
- L258: Q5. MDC에 requestId를 넣고도 값이 사라지거나 다른 요청 값이 보이는 이유는?
- L266: Q6. 운영 로그 레벨을 어떻게 고르나?
- L274: Q7. 구조화 로그와 일반 문자열 로그의 차이는?
- L282: Q8. 비동기 로깅을 언제 도입해야 하나?
- L290: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task118/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task118/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task118/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task118/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w07`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task118/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task118/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
