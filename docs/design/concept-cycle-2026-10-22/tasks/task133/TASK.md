# task133: W25 · W25. 스프링은 왜 멀티스레드인가 — 요청마다 스레드, 공유되는 싱글턴 빈

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md
- 원문 SHA256: `817cc1dead9cb20712c56220c46edb80ed77414f83d00bd4321cb2ce8fedb607` / 355줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Spring singleton scope and request-thread concurrency, ThreadLocal context, worker pools and resource pool sizing
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W25. 스프링은 왜 멀티스레드인가 — 요청마다 스레드, 공유되는 싱글턴 빈
- L7: 1. 질문
- L17: 2. 짧은 답
- L27: 3. 왜 그런가 — 원리
- L29: 프로세스 하나 안에서 요청 스레드가 나뉜다
- L59: 싱글턴은 한 객체를 공유한다
- L75: 풀은 서로 다른 단계의 용량이다
- L79: ThreadLocal은 스레드별 칸이지 요청별 저장소가 아니다
- L85: 4. 선택지 비교
- L98: 5. 코드로 보기
- L100: 5.1 공유 싱글턴 필드에서 요청 상태가 섞이는 순수 Java 재현
- L163: 5.2 기본 추천: 싱글턴 서비스는 입력을 받아 계산한다 (미실행)
- L198: 5.3 요청 상태를 객체로 묶어야 할 때: request scope (미실행)
- L241: 5.4 별도 스레드로 넘기는 작업은 executor를 명시한다 (미실행)
- L281: 6. 실무에서는 실제로
- L289: 7. 흔한 오해와 실수
- L299: 8. 자가점검 Q&A (면접 대비)
- L301: Q1. Spring 싱글턴 서비스가 동시 요청을 처리할 수 있는 이유는?
- L307: Q2. 한 HTTP 요청은 항상 처음부터 끝까지 같은 스레드인가?
- L313: Q3. 스레드 덤프에서 `http-nio-8080-exec-*`가 200개 바쁘면 무엇부터 볼까?
- L319: Q4. `private final Repository repository`는 왜 괜찮다고 하나?
- L325: Q5. `ThreadLocal`은 요청별 객체를 만들어 주는가?
- L331: Q6. Tomcat worker 수와 Hikari 커넥션 수는 어떻게 맞추나?
- L337: Q7. `@Async`로 실행한 작업은 호출한 트랜잭션에 포함되는가?
- L343: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task133/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task133/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task133/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task133/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w25`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task133/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task133/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
