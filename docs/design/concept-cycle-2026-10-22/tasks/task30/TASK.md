# task30: J01 · J01. 기본 타입·참조 타입·박싱·String

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J01-types-string.md
- 원문 SHA256: `b3a17a035cd5036f2b54e613cbe0533d347f409376c6b5a6451d0aa9d6ff0993` / 316줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 기본형과 참조형·박싱, 오버플로와 BigDecimal, String 불변성과 연결, Equality and conversion pitfalls
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: J01. 기본 타입·참조 타입·박싱·String
- L5: 1. 왜 알아야 하나
- L11: 2. 핵심 개념
- L24: 헷갈리는 비교
- L35: 3. 내부 동작·원리
- L37: 3.1 기본 타입에서 wrapper로, 다시 값으로
- L54: 3.2 캐시와 `==`의 함정
- L62: 3.3 오버플로와 부동소수점
- L68: 3.4 `BigDecimal`의 값과 표현
- L74: 3.5 String 불변성, pool, 연결
- L98: 4. 코드로 확인
- L102: 예제 1 — 박싱, 캐시, 언박싱
- L141: 예제 2 — 문자열 정체성, 불변성, 연결
- L184: 예제 3 — 정수 오버플로, 부동소수점, BigDecimal
- L224: 5. 버전별 변화 — 왜 바뀌었나
- L231: 6. 실무 가이드
- L240: 7. 함정·안티패턴
- L251: 8. 자가점검 Q&A (면접 대비)
- L253: Q1. 기본 타입과 wrapper는 메모리 위치만 다른가?
- L259: Q2. `Integer a = 127, b = 127; a == b`는 왜 참일 수 있고 왜 이 비교가 잘못인가?
- L265: Q3. 오토언박싱이 NPE를 일으키는 표현을 말해보라.
- L271: Q4. `int` overflow가 왜 장애 원인이 되는가?
- L277: Q5. `double`을 돈에 쓰지 않는 이유는 무엇인가?
- L283: Q6. `new BigDecimal("1.0").equals(new BigDecimal("1.00"))`은 왜 거짓인가?
- L289: Q7. String이 불변이라는 것은 변수에 다른 값을 넣을 수 없다는 뜻인가?
- L295: Q8. JEP 280 이후 `+`와 `StringBuilder`를 어떻게 나누어 쓰는가?
- L303: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task30/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task30/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task30/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task30/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:j01`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task30/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task30/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
