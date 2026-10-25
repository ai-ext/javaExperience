# task75: P27 · P27. 애노테이션은 누가·언제 실행하나 — 시점별 동작 지도

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P27-annotations-when-how.md
- 원문 SHA256: `58aed5ddac322acb0104c1c310fd955b8acc01f0337eccb109bbb57de6e99b23` / 333줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 컴파일러와 annotation processor, Bean 등록과 자동 구성, MVC resolver와 validation, AOP proxy 경계, 테스트 bootstrap 범위
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P27. 애노테이션은 누가·언제 실행하나 — 시점별 동작 지도
- L7: 1. 한 줄로 말하면
- L13: 2. 당장 알아야 할 것
- L15: 2.1 시점 지도
- L28: 2.3 컴파일 시점: 검사와 코드 생성은 다르다
- L41: 2.4 기동 시점: 애노테이션을 빈으로 바꾸는 일
- L49: 2.5 요청 시점: MVC가 선언을 해석한다
- L61: 2.6 메서드 호출 시점: 프록시를 거쳐야 advice가 적용된다
- L90: 2.7 안 먹힐 때는 이 순서로 진단한다
- L97: 3. 따라 하기
- L101: 1단계: 프로젝트와 AOP 의존성
- L116: 2단계: 서비스 작성
- L136: 3단계: 읽힐 애노테이션 정의
- L157: 4단계: Aspect로 프록시 호출 감싸기
- L194: 5단계: 표식을 붙이고 HTTP 호출
- L239: 6단계: MVC 슬라이스 테스트에서 협력 빈 교체
- L245: 4. 치트시트
- L260: 5. 자주 나는 에러와 해결
- L273: 6. 한 단계 더
- L279: 7. 자가점검 Q&A (면접 대비)
- L281: Q1. @Transactional을 붙이면 바로 트랜잭션이 시작되나?
- L287: Q2. @Component가 붙었는데 빈을 찾지 못하는 이유는?
- L293: Q3. @Override와 @Transactional의 시점 차이는?
- L299: Q4. @RequestBody와 @PathVariable은 누가 메서드 인자로 바꾸나?
- L305: Q5. @PostConstruct가 호출되지 않을 수 있는 이유는?
- L311: Q6. @WebMvcTest와 @SpringBootTest는 어떻게 고르나?
- L317: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task75/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task75/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task75/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task75/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p27`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task75/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task75/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
