# task66: P15 · P15. IntelliJ IDEA 실무 — 프로젝트 열기부터 디버깅·리팩토링까지

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P15-intellij-practical.md
- 원문 SHA256: `ad7e9674015643a4abd1c5c6a4f0fc5f8c5d88be04e28c9ccf6e18106c2f09a2` / 345줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: Gradle 모델과 JDK 선택, Run Configuration과 환경, 리팩터링과 디버거, HTTP Client·Database·Git 도구
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P15. IntelliJ IDEA 실무 — 프로젝트 열기부터 디버깅·리팩토링까지
- L7: 1. 한 줄로 말하면
- L13: 2. 당장 알아야 할 것
- L15: 2.1 프로젝트는 파일이 아니라 빌드 모델로 연다
- L26: 2.2 Project SDK와 Gradle JVM은 각각 확인한다
- L33: gradle.properties — 개발자 컴퓨터마다 경로가 달라지므로 보통은 개인 파일에 둔다.
- L34: org.gradle.java.home=/Users/me/.jdks/jdk-25
- L40: 2.3 Spring Boot 실행은 Run Configuration으로 저장한다
- L53: 2.4 자주 쓰는 단축키는 macOS와 Windows를 함께 기억한다
- L73: 2.5 자동 import와 Alt+Enter를 사용한다
- L77: 2.6 Lombok은 의존성과 annotation processing을 함께 맞춘다
- L92: 2.7 리팩토링은 텍스트 치환이 아니라 심볼 변경이다
- L98: 2.8 디버거는 “멈춤 → 상태 관찰 → 한 단계 실행” 순서다
- L104: 2.9 HTTP Client로 API 호출을 프로젝트와 함께 보관한다
- L109: health
- L113: create
- L125: 2.10 Database와 Git tool window의 역할을 구분한다
- L131: 3. 따라 하기
- L133: 3.1 프로젝트 생성과 열기
- L157: 3.2 실행 구성에 프로파일과 포트를 넣기
- L213: 3.3 리팩토링을 안전하게 적용하기
- L226: 3.4 디버거로 인자와 컬렉션을 관찰하기
- L252: 4. 치트시트
- L270: 5. 자주 나는 에러와 해결
- L288: 6. 한 단계 더
- L294: 7. 자가점검 Q&A (면접 대비)
- L296: Q1. Project SDK와 Gradle JVM이 왜 둘 다 필요한가?
- L302: Q2. 임시 Run Configuration을 저장해야 하는 상황은?
- L308: Q3. Rename과 Find/Replace의 차이는?
- L314: Q4. 조건 breakpoint가 일반 breakpoint보다 유리한 때는?
- L320: Q5. HTTP Client를 curl 대신 쓰는 이유는?
- L326: Q6. Lombok 빨간 줄의 원인을 어떻게 분리하나?
- L332: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task66/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task66/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task66/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task66/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p15`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task66/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task66/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
