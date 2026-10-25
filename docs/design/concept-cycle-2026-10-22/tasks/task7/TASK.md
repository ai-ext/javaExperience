# task7: S09 · S09. JPA·Hibernate

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md
- 원문 SHA256: `23e3a001a2afbad0e4234795d9566645e25fffd5ab9f06a82b8f27b8c550d05e` / 304줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/s09-2026-10-20/VERIFICATION.md
- 참고 개념: JPA entity state·persistence context·flush/merge, 관계 주인·fetch/N+1·cascade·OSIV·락
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: S09. JPA·Hibernate
- L7: 1. 왜 알아야 하나
- L19: 2. 핵심 개념
- L33: 엔티티 상태
- L44: 헷갈리는 매핑 옵션
- L55: 3. 내부 동작·원리
- L57: 조회부터 변경 저장까지
- L78: 관계형 매핑과 주인
- L84: LAZY와 N+1
- L93: OSIV와 경계
- L97: 4. 코드로 확인
- L101: 예제 1: 소유자와 양방향 관계 일관성
- L148: 예제 2: 영속 상태 변경과 flush
- L179: 예제 3: 유스케이스에 맞춘 fetch join
- L208: 5. 버전별 변화 — 왜 바뀌었나
- L219: 6. 실무 가이드
- L232: 7. 함정·안티패턴
- L244: 8. 자가점검 Q&A (면접 대비)
- L246: Q1. 영속성 컨텍스트의 1차 캐시가 애플리케이션 캐시와 다른 점은?
- L252: Q2. dirty checking은 언제 UPDATE를 내고, `flush()`는 무엇을 보장하지 않는가?
- L258: Q3. 양방향 일대다에서 어느 쪽이 FK를 바꾸나?
- L264: Q5. LAZY를 기본으로 두어도 N+1이 생기는 이유와 대응은?
- L270: Q6. OSIV를 끄면 어떤 코드 구조가 필요해지는가?
- L276: Q7. `merge()` 호출 뒤 원래 객체를 계속 써도 되는가?
- L282: Q8. 낙관적 락과 비관적 락은 어떻게 고르는가?
- L288: Q9. Hibernate 7 업그레이드에서 코드 컴파일 외에 무엇을 점검하나?
- L294: 9. 참고문헌

## 기존 관련 파일

- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-learning.bundle.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-learning.css
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-learning.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-learning.mjs
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:s09`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task7/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
