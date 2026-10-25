# task3: P16 · P16. JSON·Jackson 실무 — 요청/응답 직렬화에서 막히는 것들

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P16-json-jackson-practical.md
- 원문 SHA256: `53c490407480ef4bcea2476bafe8a2bcef4a0e4b576251e2fa99f136784474b8` / 335줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/p16-2026-10-20/VERIFICATION.md
- 참고 개념: JSON·Jackson·HttpMessageConverter, DTO contract·프로퍼티 정책, 날짜·Enum·unknown input·생성 규칙, 엔티티 순환/지연로딩과 실행검증, JSON failure diagnosis
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P16. JSON·Jackson 실무 — 요청/응답 직렬화에서 막히는 것들
- L7: 1. 한 줄로 말하면
- L13: 2. 당장 알아야 할 것
- L15: 2.1 요청과 응답은 DTO로 고정한다
- L38: 2.2 `@RequestBody`가 동작하는 지점
- L53: 2.3 이름을 바꿀 때는 계약에 명시한다
- L74: 2.4 포함·무시는 보안과 계약의 문제다
- L89: 2.5 생성 규칙: getter, 생성자, record
- L93: 2.6 날짜·시간은 “문자열”이 아니라 계약이다
- L115: 2.7 Enum은 이름과 표시값을 분리한다
- L136: 2.8 알 수 없는 필드는 API 진화 정책으로 결정한다
- L147: 2.9 JPA 엔티티와 순환 참조는 DTO로 끊는다
- L151: 3. 따라 하기
- L155: 3.1 프로젝트 만들기
- L186: 3.2 DTO와 컨트롤러 작성
- L226: 3.3 직접 JsonMapper를 쓰는 최소 예
- L250: 4. 치트시트
- L269: 5. 자주 나는 에러와 해결
- L283: 6. 한 단계 더
- L291: 7. 자가점검 Q&A (면접 대비)
- L293: Q1. `@RequestBody`가 바로 Jackson을 호출하나?
- L298: Q2. JPA 엔티티를 그대로 반환하면 왜 안 되나?
- L303: Q3. `LocalDateTime`과 `Instant` 중 무엇을 고르나?
- L308: Q4. unknown property를 전역에서 무시하면 편하지 않나?
- L313: Q5. getter가 없고 기본 생성자도 없는 클래스는 어떻게 읽나?
- L320: Q6. 응답 JSON 필드 순서가 바뀌면 API가 깨지나?
- L326: 8. 참고문헌

## 기존 관련 파일

- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-contract-data.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-contract-learning.bundle.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-contract-learning.css
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-contract-learning.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-contract-learning.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-execution-evidence.mjs
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-json-visual.css
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-json-visual.js
- /Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p16-json-visual.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p16`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task3/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
