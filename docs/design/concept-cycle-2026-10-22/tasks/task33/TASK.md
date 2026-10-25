# task33: J04 · J04. 예외 처리

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J04-exceptions.md
- 원문 SHA256: `19a44ae7d7c7bb3db711c8f9e5103925fd9121245d926859aa79d7962d7f2570` / 346줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 예외 계층과 체크 규칙, try-with-resources와 suppressed, cause 체인·checked 예외와 람다, Checked exceptions in lambdas and cost
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: J04. 예외 처리
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L44: 3. 내부 동작·원리
- L46: 발생부터 포착까지
- L64: `try-with-resources`와 suppressed
- L72: `finally`의 완료 규칙
- L76: 예외 변환과 체이닝
- L82: 스택 트레이스는 언제 비용을 쓰나
- L88: 람다에서 checked exception이 막히는 이유
- L94: 4. 코드로 확인
- L98: 4.1 계층 경계에서 원인을 보존하고 `finally` 반환 함정을 보기
- L155: 4.2 주 예외와 닫기 실패의 suppressed 보존
- L202: 4.3 checked 예외를 받는 함수형 인터페이스와 래퍼
- L248: 5. 버전별 변화 — 왜 바뀌었나
- L256: 6. 실무 가이드
- L268: 7. 함정·안티패턴
- L284: 8. 자가점검 Q&A (면접 대비)
- L286: Q1. `Exception`과 `RuntimeException`의 차이는 무엇이며 컴파일러가 무엇을 보장하나?
- L292: Q2. checked exception은 언제 설계상 유용한가?
- L298: Q3. `catch (Exception)`은 `Error`도 잡는가? `catch (Throwable)`은?
- L306: Q4. TWR에서 본문과 `close()`가 모두 예외를 던지면 어떤 예외가 바깥으로 나가는가?
- L312: Q5. `finally`에서 반환하거나 새 예외를 던지면 왜 위험한가?
- L318: Q6. 예외를 추상화 계층에서 바꿀 때 원인을 왜 붙여야 하나?
- L324: Q7. checked 예외를 던지는 메서드를 `Consumer` 람다에서 호출할 수 없는 이유는?
- L330: Q8. 예외가 비싼 편이라는 말은 어떤 맥락에서 맞나?
- L336: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task33/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task33/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task33/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task33/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:j04`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task33/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task33/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
