# task6: P20 · P20. JPA 엔티티·연관관계 매핑 따라 하기

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md
- 원문 SHA256: `6cd8b34253f33255e8c7ec5608f07c382d3fe020b049182bfa0bc536dabdd125` / 386줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p20-2026-10-20/VERIFICATION.md
- 참고 개념: Entity·스키마 매핑, PK·생성전략·Enum·값 타입, 관계 owner·mappedBy·편의 메서드, cascade·orphanRemoval·다대다 관계, fetch·프록시·DTO 응답 경계, Auditing·공통 매핑, JPA Entity 클래스의 무인자 생성자 계약
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P20. JPA 엔티티·연관관계 매핑 따라 하기
- L7: 1. 한 줄로 말하면
- L11: 2. 당장 알아야 할 것
- L13: 2.1 최소 엔티티
- L19: 2.2 ID와 기본 타입
- L46: 2.3 감사 필드
- L50: 2.4 연관관계의 주인
- L76: 2.5 cascade, orphanRemoval, 다대다
- L88: 3. 따라 하기
- L92: 3.1 DB
- L121: 3.2 Gradle과 설정
- L167: 3.3 코드 전체
- L305: 3.4 순수 Java 실행 검증
- L314: 4. 치트시트
- L332: 5. 자주 나는 에러와 해결
- L341: 6. 한 단계 더
- L345: 7. 자가점검 Q&A (면접 대비)
- L347: Q1. `mappedBy`는 무엇인가?
- L351: Q2. 왜 `@ManyToOne(fetch=LAZY)`를 명시하나?
- L355: Q3. cascade와 orphanRemoval의 차이는?
- L359: Q4. Enum ORDINAL의 문제는?
- L363: Q5. 왜 `@Data`를 피하나?
- L367: Q6. Entity를 직접 반환하지 않는 이유는?
- L371: Q7. 언제 `@OneToMany` 대신 `@ManyToOne`만 두나?
- L375: 8. 참고문헌

## 기존 관련 파일

- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-learning.bundle.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-learning.css
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-learning.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-learning.mjs
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-lesson-data.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p20`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task6/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
