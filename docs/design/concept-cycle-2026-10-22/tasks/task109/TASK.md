# task109: V03 · V03. mock 실전 — 무엇을 가짜로 바꾸고 무엇은 실제로 두나

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V03-mocking-in-practice.md
- 원문 SHA256: `fee49db918c67dfef5c2aff8790616711c55e68193ad36cdd509dc6baacebd3a` / 422줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: test double 역할 구분, spy side effect와 객체 상태, mock 경계와 상호작용 assertion, 제어 가능한 clock과 외부 HTTP 테스트 경계
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: V03. mock 실전 — 무엇을 가짜로 바꾸고 무엇은 실제로 두나
- L7: 1. 한 줄로 말하면
- L11: 2. 당장 알아야 할 것
- L13: 2.1 경계를 세운다
- L17: 2.2 다섯 더블은 목적이 다르다
- L49: 2.2.1 spy는 실물의 일부 동작을 보존한다 (보강)
- L148: 2.3 Boot 4 MVC 슬라이스는 Controller를 실물로 둔다
- L163: 2.4 순수 단위 테스트는 생성자 주입, 스프링 테스트는 컨텍스트 주입
- L167: 2.5 Mockito는 필요한 상호작용만 준비·검증한다
- L187: 2.6 인프라 목적을 분리한다
- L191: 2.7 시간과 난수는 작은 의존성으로 넣는다
- L212: 3. 따라 하기
- L216: 1단계 — 테스트 의존성 확인
- L229: 2단계 — Controller 요청과 Service 경계를 검증
- L284: 3단계 — 외부 HTTP를 서버 없이 고정 응답으로 확인
- L345: 4. 치트시트
- L358: 5. 자주 나는 에러와 해결
- L366: 6. 한 단계 더
- L375: 7. 자가점검 Q&A (면접 대비)
- L377: Q1. stub과 mock을 어떻게 구분하나?
- L383: Q2. Service 테스트에서 Repository mock만 쓰면 충분한가?
- L389: Q3. `@MockitoBean` 대신 생성자로 fake를 전달하는 기준은?
- L395: Q4. strict stubs는 무엇을 잡나?
- L401: Q5. 외부 HTTP 클라이언트도 Mockito로 mock하면 되나?
- L407: Q6. 테스트에서 `LocalDateTime.now()`를 고정하는 방법은?
- L413: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task109/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task109/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task109/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task109/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:v03`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task109/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task109/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
