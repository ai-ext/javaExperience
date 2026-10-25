# task115: W04 · W04. MyBatis XML 쿼리 실무 — mapper·동적 SQL·#{}와 ${}

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W04-mybatis-xml-practical.md
- 원문 SHA256: `6c61a48e2033a6275b662b0a855a0f9ec0cc4dccc15d8904acb599471af93c7c` / 436줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: MyBatis Mapper interface/XML statement registry, SQL parameterization and SQL injection boundary, MyBatis dynamic SQL safety and empty predicates, resultType vs resultMap and joined cardinality, MyBatis-Spring transaction and test slice boundaries, MyBatis runtime version and Java baseline
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W04. MyBatis XML 쿼리 실무 — mapper·동적 SQL·#{}와 ${}
- L7: 1. 질문
- L13: 2. 짧은 답
- L21: 3. 왜 그런가 — 원리
- L23: Mapper 메서드와 XML의 연결
- L41: #{}와 ${}는 안전성 모델이 다르다
- L47: 동적 태그가 줄이는 것과 줄이지 않는 것
- L53: 결과 집합을 객체 관계로 바꾸기
- L59: Spring 트랜잭션이 Mapper를 감싸는 이유
- L63: 4. 선택지 비교
- L76: 5. 코드로 보기
- L80: 5.1 Mapper 인터페이스 ↔ XML CRUD (미실행)
- L92: application.properties
- L96: 개발 프로필에서만
- L170: 5.2 같은 검색: XML 동적 SQL과 annotation (미실행)
- L281: 5.3 조인 결과를 resultMap으로 만들기 (미실행)
- L323: 5.4 @MybatisTest로 Mapper 검증 (미실행)
- L373: 6. 실무에서는 실제로
- L383: 7. 흔한 오해와 실수
- L393: 8. 자가점검 Q&A (면접 대비)
- L395: Q1. #{}와 ${}의 차이는?
- L400: Q2. Invalid bound statement (not found)는 어떻게 찾나?
- L405: Q3. resultType과 resultMap은 어떻게 고르나?
- L410: Q4. <where>가 해결하는 것과 못 하는 것은?
- L415: Q5. 조인한 1:N을 매핑하려면?
- L420: Q6. @Transactional은 어디에 두나?
- L425: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task115/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task115/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task115/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task115/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w04`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task115/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task115/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
