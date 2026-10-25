# task36: J07 · J07. 컬렉션 프레임워크 내부

- 원문: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J07-collections-internals.md
- 원문 SHA256: `34d09b6ee3cd1b1fada7c5a64a0440f48edc02639d8abd26f4076f6cb19f2a6b` / 382줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 컬렉션 계약·선택 기준, ArrayList·LinkedList 내부, HashMap 해시·equals·resize, 순서 맵·정렬 맵·LRU, fail-fast와 unmodifiable view
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: J07. 컬렉션 프레임워크 내부
- L7: 1. 왜 알아야 하나
- L15: 2. 핵심 개념
- L44: 구현별 연산 비용의 기본형
- L57: 3. 내부 동작·원리
- L59: 3.1 `ArrayList`: 배열 공간을 미리 마련하고 복사를 드물게 한다
- L67: 3.2 `LinkedList`: 양방향 노드지만 인덱스는 공짜가 아니다
- L73: 3.3 `HashMap`: 해시에서 버킷을 찾고, 동등성으로 키를 확인한다
- L95: 3.4 `LinkedHashMap`: 해시 조회에 별도의 순서 링크를 얹는다
- L101: 3.5 `TreeMap`: 비교 순서를 레드블랙 트리로 유지한다
- L107: 3.6 iterator의 fail-fast: 버그 감지 장치이지 동기화가 아니다
- L120: 4. 코드로 확인
- L122: 예제 1: 읽기 전용 뷰와 복사본의 차이
- L163: 예제 2: `LinkedHashMap`으로 만드는 크기 제한 LRU
- L206: 예제 3: Sequenced Collections와 정렬 범위
- L243: 예제 4: 충돌 키와 `TreeMap` 순서
- L287: 5. 버전별 변화 — 왜 바뀌었나
- L296: 6. 실무 가이드
- L312: 7. 함정·안티패턴
- L323: 8. 자가점검 Q&A (면접 대비)
- L325: Q1. `ArrayList` 끝 추가가 왜 O(1)인가?
- L331: Q2. `LinkedList`의 중간 삽입이 O(1)이라면 왜 기본 리스트로 잘 안 쓰나?
- L337: Q3. `HashMap`에서 `hashCode`가 같으면 키가 같은가?
- L343: Q4. `HashMap` 확장 때 왜 모든 키를 다시 `% newCapacity` 하지 않는가?
- L349: Q5. `Collections.unmodifiableList(x)`와 `List.copyOf(x)` 중 방어 복사에 맞는 것은?
- L355: Q6. fail-fast iterator가 동시성 안전을 보장하는가?
- L361: Q7. `TreeMap`과 `LinkedHashMap`은 둘 다 순서가 있는데 언제 각각 쓰나?
- L369: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task36/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task36/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task36/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task36/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:j07`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task36/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: /Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task36/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
