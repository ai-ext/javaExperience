# task116: W05 · W05. JPA vs MyBatis — 언제 무엇을, 섞어 쓰는 전략

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W05-jpa-vs-mybatis-strategy.md
- 원문 SHA256: `a52e675e43f705a6d3254a6edb0d1777cd9cf1df2dddad08865c87d8d2c14f05` / 346줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: JPA and MyBatis persistence-state mental models, 새 entity 판정과 persist/merge return identity, MyBatis SQL as a DB-focused read model, JPA/MyBatis same transaction but separate cache and state, Persistence tool selection and gradual migration, readOnly transaction semantics in JPA/provider
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: W05. JPA vs MyBatis — 언제 무엇을, 섞어 쓰는 전략
- L7: 1. 질문
- L13: 2. 짧은 답
- L25: 3. 왜 그런가 — 원리
- L27: 두 추상화가 보관하는 정보
- L41: 요청이 DB에 닿는 순서
- L76: 4. 선택지 비교
- L94: 5. 코드로 보기
- L98: JPA — projection 쿼리
- L187: MyBatis — 같은 목록을 명시적 SQL로 조회
- L241: 6. 실무에서는 실제로
- L245: 신규 서비스
- L251: 레거시 전환
- L257: SI·금융·공공 성격의 프로젝트
- L261: 스타트업·제품 팀
- L265: 선택 후 마이그레이션 순서
- L275: 7. 흔한 오해와 실수
- L286: 8. 자가점검 Q&A (면접 대비)
- L288: Q1. JPA와 MyBatis는 가장 근본적으로 무엇이 다른가?
- L296: Q2. 엔티티 필드를 바꿨는데 `save()`가 없어도 DB에 저장되는 이유는?
- L303: Q3. 통계 화면은 왜 MyBatis가 더 편할 수 있나?
- L311: Q4. JPA와 MyBatis를 같은 서비스에서 호출하면 한 트랜잭션인가?
- L319: Q5. MyBatis로 수정한 row를 JPA 엔티티에서 다시 읽으면 어떻게 되나?
- L326: Q6. 기존 MyBatis 프로젝트는 JPA로 전면 전환해야 하나?
- L333: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task116/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task116/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task116/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task116/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:w05`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task116/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task116/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
