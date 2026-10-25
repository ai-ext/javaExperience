# task70: P22 · P22. 데이터소스 여러 개 쓰기와 읽기 복제본 라우팅

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P22-multiple-datasources.md
- 원문 SHA256: `e8c88b796c1f66a50d14ff0a2293cfb419d1affda54a8b53bc7ab24ae67abb40` / 385줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: DataSource/EMF/transaction manager 경계, 별도 DB와 primary/replica 구분, readOnly 기반 routing·lazy connection, 복제 지연·다중 DB atomicity
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P22. 데이터소스 여러 개 쓰기와 읽기 복제본 라우팅
- L7: 1. 한 줄로 말하면
- L11: 2. 당장 알아야 할 것
- L13: 2.1 Boot 자동 구성과 @Primary
- L19: 2.2 두 DB와 primary/replica는 다르다
- L23: 2.3 DataSourceProperties와 url/jdbc-url
- L33: 2.4 read-only를 routing key로 사용하기
- L37: 2.5 replica 최신성
- L41: 3. 따라 하기
- L45: 3.1 프로젝트와 서버
- L109: 3.2 방식 ① users/orders DB를 완전히 분리하기
- L189: 3.3 방식 ② 읽기/쓰기 라우팅 전체 코드
- L298: 4. 치트시트
- L311: 5. 자주 나는 에러와 해결
- L313: `No qualifying bean of type 'jakarta.persistence.EntityManagerFactory'`
- L317: `Not a managed type: class ...Order`
- L321: `jdbcUrl is required with driverClassName`
- L325: 읽기가 계속 primary로 간다
- L329: 쓰기 직후 GET이 이전 값을 반환한다
- L333: 두 저장 중 한쪽만 커밋됐다
- L337: 6. 한 단계 더
- L341: 7. 자가점검 Q&A (면접 대비)
- L343: Q1. `@Primary`란?
- L349: Q2. lazy proxy가 필요한 이유는?
- L355: Q3. 두 DB를 트랜잭션 하나로 묶을 수 있나?
- L361: Q4. readOnly면 쓰기가 절대 불가능한가?
- L367: Q5. repository 패키지를 나누는 이유는?
- L373: Q6. primary/replica 불일치를 라우팅 버그로 단정할 수 있나?
- L379: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task70/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task70/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task70/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task70/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p22`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task70/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task70/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
