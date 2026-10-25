# task123: W14 · W14. 동기 vs 비동기, 블로킹 vs 논블로킹 — 백엔드에서 언제

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W14-sync-async-blocking.md
- 원문 SHA256: `8bc18f82cdff90c194813e1d747994ae275f619853cbbce16873bb4358d73d0d` / 339줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 동기/비동기와 블로킹/논블로킹의 두 축, 응답 비동기·@Async·메시지 큐·작업 상태의 전달 보장
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W14. 동기 vs 비동기, 블로킹 vs 논블로킹 — 백엔드에서 언제
- L7: 1. 질문
- L13: 2. 짧은 답
- L23: 3. 왜 그런가 — 원리
- L25: 네 용어는 호출자 관점에서 나눈다
- L38: MVC 요청 스레드가 막히는 순간
- L62: 논블로킹과 가상 스레드가 해결하는 비용
- L84: 4. 선택지 비교
- L98: 5. 코드로 보기
- L102: 예제 1 — Future를 기다리면 호출자도 기다린다
- L136: 예제 2 — 동기 MVC와 비차단 WebFlux
- L177: 예제 3 — `@Async`로 best-effort 후처리
- L217: 예제 4 — Kafka에 맡기고 완료 응답 받기
- L258: 6. 실무에서는 실제로
- L268: 7. 흔한 오해와 실수
- L279: 8. 자가점검 Q&A (면접 대비)
- L281: Q1. 동기/비동기와 블로킹/논블로킹은 왜 같은 구분이 아닌가?
- L289: Q2. MVC에서 외부 HTTP 호출이 5초 걸릴 때 무엇이 블로킹되는가?
- L297: Q3. 왜 JPA를 쓰는 서비스에 WebFlux 도입이 간단한 해법이 아닌가?
- L305: Q4. `@Async` worker에서 `@Transactional`을 다시 선언하는 이유는?
- L313: Q5. `CompletableFuture.thenApply`와 `thenApplyAsync`에서 주의할 점은?
- L321: Q6. `@Async`와 메시지 큐는 언제 갈라지는가?
- L329: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task123/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task123/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task123/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task123/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w14`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task123/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task123/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
