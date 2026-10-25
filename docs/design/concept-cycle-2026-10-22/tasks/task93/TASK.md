# task93: S10 · S10. Spring Data와 쿼리 도구

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S10-spring-data-query.md
- 원문 SHA256: `c7ac0dac78e7fd157c948f8edc348746c761a0bbf28e055ed92f7f5a9b6fcc9a` / 321줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Spring Data derived query·@Query·Specification, Projection·Page/Slice/Window·도구 선택
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: S10. Spring Data와 쿼리 도구
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L30: 도구 비교
- L42: 3. 내부 동작·원리
- L44: 리포지토리 메서드는 SQL로 바로 치환되지 않는다
- L62: `@Query`는 선언 시점에 쿼리를 분리한다
- L66: Specification과 Projection은 서로 다른 문제를 푼다
- L72: 페이징은 정렬과 건수 계산의 계약이다
- L76: 감사 정보는 저장 이벤트의 메타데이터다
- L80: 4. 코드로 확인
- L84: 예제 1 — 파생 쿼리, `@Query`, projection, 페이징 (미실행)
- L132: 예제 2 — 조합 가능한 조건 (미실행)
- L165: 예제 3 — 생성 시각과 수정 시각 감사 (미실행)
- L197: 예제 4 — 이름 있는 매개변수로 SQL 실행 (미실행)
- L227: 5. 버전별 변화 — 왜 바뀌었나
- L238: 6. 실무 가이드
- L251: 7. 함정·안티패턴
- L262: 8. 자가점검 Q&A (면접 대비)
- L264: Q1. 쿼리 메서드와 `@Query`는 어떻게 고르는가?
- L271: Q2. Specification은 쿼리 메서드와 무엇이 다른가?
- L278: Q3. Projection이 성능에 도움이 되는 이유는?
- L285: Q4. `Page`와 `Slice` 중 무엇을 선택하는가?
- L292: Q5. Querydsl을 새 프로젝트에서 선택할 때 주의점은?
- L299: Q6. `@CreatedDate`만 사용해도 `AuditorAware`가 필요한가?
- L306: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task93/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task93/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task93/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task93/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:s10`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task93/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task93/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
