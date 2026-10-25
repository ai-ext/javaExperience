# task31: J02 · J02. OOP와 Object 규약

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J02-oop-object-contracts.md
- 원문 SHA256: `aa76f3ab9226a9dd1fc624eafae144f1e10884ef79bc1c0400e0c287428165cc` / 351줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 캡슐화·추상화·상속·조합, 오버로딩과 오버라이딩, equals/hashCode/compareTo 규약, 불변 객체·접근·중첩 타입
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: J02. OOP와 Object 규약
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L26: 접근 제어자
- L37: 추상 클래스와 인터페이스
- L48: 오버로딩·오버라이딩·동적 디스패치
- L58: Object 및 정렬 메서드 계약
- L69: 중첩 클래스 종류
- L78: 3. 내부 동작·원리
- L80: 호출은 두 단계로 해석된다
- L96: equals와 hashCode가 함께 움직이는 이유
- L102: 비교 순서는 컬렉션의 동등성 규칙이 된다
- L106: 불변 객체는 상태 계약을 고정한다
- L112: 상속은 계약과 초기화 순서를 함께 물려준다
- L118: 4. 코드로 확인
- L120: 4.1 오버로딩 선택과 동적 디스패치
- L157: 4.2 값 객체의 네 가지 규약
- L205: 4.3 조합과 네 가지 중첩 클래스 형태
- L261: 5. 버전별 변화 — 왜 바뀌었나
- L267: 6. 실무 가이드
- L278: 7. 함정·안티패턴
- L289: 8. 자가점검 Q&A (면접 대비)
- L291: Q1. 상위 타입 변수로 하위 객체의 오버로드와 오버라이드 메서드를 호출하면 각각 무엇이 결정하는가?
- L297: Q2. `a.equals(b)`가 true이면 해시 코드도 같아야 한다. 해시 코드가 같은데 `equals`가 false인 경우는 가능한가?
- L303: Q3. 상속 가능한 값 클래스에서 `equals`를 구현할 때 대칭성이 깨지는 상황은?
- L309: Q4. `compareTo`가 0이면 `equals`도 true여야 하는가?
- L315: Q5. 인터페이스 `default` 메서드의 두 구현이 충돌하면 어떻게 하는가?
- L321: Q6. 모든 필드를 `final`로 선언하면 객체는 불변인가?
- L327: Q7. 상속보다 조합을 기본 선택으로 권하는 이유는?
- L333: Q8. 생성자 안에서 `normalize()` 같은 오버라이드 가능한 메서드를 호출하면 왜 위험한가?
- L339: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task31/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task31/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task31/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task31/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:j02`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task31/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task31/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
