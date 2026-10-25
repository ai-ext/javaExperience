# task104: S21 · S21. Spring Boot 3→4·Framework 7 변화와 마이그레이션

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S21-boot4-migration.md
- 원문 SHA256: `8a1982833b9ff63eec22213dda6e05b4c5370ecdb92d4bf2dd82786928c43d04` / 261줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Boot 4 의존성·플랫폼 기준선, properties migrator와 OpenRewrite, JSpecify null-safety, HttpHeaders·HTTP Service Client, API version resolver·parser·deprecation
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: S21. Spring Boot 3→4·Framework 7 변화와 마이그레이션
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L27: 헷갈리는 변화의 비교
- L40: 3. 내부 동작·원리
- L42: 3.1 업그레이드는 하나의 dependency graph 재해결이다
- L61: 3.2 JSpecify null-safety는 runtime 검사가 아니라 계약의 이동이다
- L69: 3.3 HttpHeaders와 HTTP interface의 설계 차이
- L79: 3.4 API Versioning의 분리된 책임
- L85: 4. 코드로 확인
- L87: 예제 1 — properties migrator를 진단 단계에만 추가
- L101: 예제 2 — HTTP Service Client
- L120: 예제 3 — API Versioning 설정의 출발점
- L134: 예제 4 — 순수 Java로 property rename을 검증
- L166: 5. 버전별 변화 — 왜 바뀌었나
- L178: 6. 실무 가이드
- L190: 7. 함정·안티패턴
- L200: 8. 자가점검 Q&A (면접 대비)
- L202: Q1. Boot 4에서 Java 25가 필수인가?
- L208: Q2. Boot 3.5를 거쳐야 하는 이유는?
- L214: Q3. properties migrator를 계속 운영 dependency로 두면 어떤가?
- L220: Q4. Framework 7의 JSpecify는 `@NonNull`과 같은가?
- L226: Q5. `HttpHeaders`가 `MultiValueMap`을 상속하지 않게 된 이유는?
- L232: Q6. Boot 4의 API Versioning auto-configuration이 controller 버전 분기를 없애 주는가?
- L238: Q7. Jackson 2 코드를 import만 바꾸면 Jackson 3로 갈 수 있는가?
- L244: Q8. 4.0 deprecated는 언제 고쳐야 하는가?
- L250: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task104/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task104/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task104/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task104/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:s21`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task104/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task104/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
