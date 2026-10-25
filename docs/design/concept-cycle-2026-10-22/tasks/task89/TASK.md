# task89: S04 · S04. 외부 설정·프로파일

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S04-config-profiles.md
- 원문 SHA256: `9f56fe453ca8655621780757cea81383a2b3463ed3428c5c91e92da303407368` / 327줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: PropertySource 우선순위와 Config Data, Profiles·typed binding·validation·configtree
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: S04. 외부 설정·프로파일
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L30: 헷갈리기 쉬운 구분
- L41: 3. 내부 동작·원리
- L43: 3.1 값은 PropertySource 순서대로 합성된다
- L65: 3.2 Config Data 안에서도 순서가 있다
- L79: 3.3 프로파일 이름은 “실행 모드”가 아니라 조합 키다
- L87: 3.4 설정 바인딩은 이름을 정규화하고 타입을 변환한다
- L95: 3.5 바인딩 다음에 검증하고 빈이 사용한다
- L101: 3.6 외부 파일을 Config Data로 가져온다
- L105: 3.7 메타데이터는 개발 도구를 돕는다
- L109: 4. 코드로 확인
- L113: 예제 1 — 타입 안전한 속성, 기본값, 검증
- L157: 예제 2 — 운영 프로파일 그룹과 문서 조건
- L182: application-proddb.properties
- L192: 예제 3 — Kubernetes Secret 볼륨을 config tree로 읽기
- L225: 5. 버전별 변화 — 왜 바뀌었나
- L230: 6. 실무 가이드
- L245: 7. 함정·안티패턴
- L256: 8. 자가점검 Q&A (면접 대비)
- L258: Q1. `application.yml`의 운영 주소가 있는데 환경변수 주소로 연결되는 이유는?
- L266: Q2. `spring.profiles.active`와 `spring.config.activate.on-profile`의 차이를 설명하라.
- L274: Q3. 프로파일 그룹은 어떤 문제를 해결하며 `include`와 어떻게 다른가?
- L282: Q4. 왜 여러 설정 키를 `@Value`로 각각 주입하지 않고 `@ConfigurationProperties`로 묶는가?
- L290: Q5. relaxed binding은 무엇이며 환경변수 이름을 어떻게 만들까?
- L298: Q6. `@Validated`만 붙이면 중첩 설정도 자동으로 검증되는가?
- L306: Q7. Kubernetes ConfigMap과 Secret을 `configtree:`로 읽는 기준은?
- L314: Q8. 활성 프로파일에서 목록 항목을 하나만 수정하면 기본 목록에 덧붙는가?
- L322: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task89/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task89/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task89/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task89/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:s04`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task89/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task89/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
