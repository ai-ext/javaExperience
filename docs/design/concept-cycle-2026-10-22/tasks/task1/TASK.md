# task1: P09 · P09. Java 문법 기초 — 클래스·필드·메서드·생성자를 선언하고 호출하기

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P09-java-syntax-basics.md
- 원문 SHA256: `c5a15287bafd153ef959c71d0856c2f6b6ae9629bf636ca9aa6418e862caa9d8` / 489줄
- 첫 단계: 기존 보강 독립 감사
- 기존 보강 근거: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-2026-10-20/VERIFICATION.md
- 참고 개념: class·field·object·scope, method call·return·overload·varargs, 캡슐화·접근 제어·final, Java 값 전달과 참조 별칭, 연산자·우선순위·short circuit
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P09. Java 문법 기초 — 클래스·필드·메서드·생성자를 선언하고 호출하기
- L7: 1. 한 줄로 말하면
- L11: 2. 당장 알아야 할 것
- L13: 1) 소스 파일·패키지·import
- L25: 2) 클래스 구성과 생성자
- L38: 3) 변수 종류·스코프·기본값
- L57: 4) 메서드 선언 해부
- L67: 5) 호출·`this`·`return`
- L76: 6) 접근 제어자
- L89: 7) 캡슐화·getter/setter·`final`
- L104: 8) 오버로딩·가변 인자
- L125: 9) Java는 항상 값 전달
- L129: 10) `main`
- L137: 연산자 표와 식 읽기 (보강)
- L217: 3. 따라 하기
- L221: 단계 1 — 프로젝트 뼈대 만들기
- L268: 단계 2 — main에서 Spring Boot 시작
- L288: 단계 3 — Controller의 메서드와 모델 필드 연결
- L331: 단계 4 — HTTP 요청으로 메서드 확인
- L347: 순수 Java 실행 검증 — 참조값도 값으로 전달
- L378: 순수 Java 실행 검증 — 오버로딩·varargs·static 호출
- L413: 4. 치트시트
- L428: 5. 자주 나는 에러와 해결
- L437: 6. 한 단계 더
- L443: 7. 자가점검 Q&A (면접 대비)
- L445: Q1. 필드와 지역 변수의 초기화 규칙은 왜 다른가?
- L451: Q2. 객체를 메서드에 넘겼는데 필드 변경은 보이고 재할당은 안 보이는 이유는?
- L457: Q3. 반환 타입만 바꿔 오버로딩할 수 없는 이유는?
- L463: Q4. `static` 메서드에서 `this`를 쓸 수 없는 이유는?
- L469: Q5. `private` 필드에 getter와 setter를 모두 만들면 캡슐화가 되는가?
- L475: Q7. varargs를 선언하면 메서드 본문에서 여러 인자는 어떻게 보이는가?
- L481: 8. 참고문헌

## 기존 관련 파일

- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p09-assets.mjs
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p09-learning.bundle.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p09-learning.css
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p09-learning.js
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p09-learning.mjs
- LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/tools/site/p09-lesson-data.mjs

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p09`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task1/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
