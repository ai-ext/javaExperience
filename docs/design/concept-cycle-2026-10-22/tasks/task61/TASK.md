# task61: P10 · P10. 자료구조 실무 사용법 — 배열·List·Set·Map·Queue·Deque·PriorityQueue

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P10-data-structures-usage.md
- 원문 SHA256: `f5adeefced1afec5f07688a876f868ed5e2f937745b506097279871d6ce139a5` / 396줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 컬렉션 인터페이스·구현 선택, 배열·List 수정 가능성, Set/Map의 중복·동등성·순서, Queue·Deque·PriorityQueue 동작, Collection mutation·complexity
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: P10. 자료구조 실무 사용법 — 배열·List·Set·Map·Queue·Deque·PriorityQueue
- L7: 1. 한 줄로 말하면
- L11: 2. 당장 알아야 할 것
- L13: 2.1 구현체가 아닌 인터페이스로 선언한다
- L24: 2.2 배열은 크기가 고정이고, `Arrays.asList`도 크기를 못 바꾼다
- L39: 2.3 `ArrayList`가 기본 `List`, `LinkedList`는 필요가 드물다
- L50: 2.4 중복·순서 조건으로 `Set`을 고른다
- L67: 2.5 키로 찾을 땐 `Map`; 목적에 맞는 메서드를 쓴다
- L94: 2.6 FIFO·스택은 `ArrayDeque`; 빈 큐는 예외 대신 `poll`·`peek`
- L108: 2.7 우선순위가 필요하면 `PriorityQueue`
- L120: 2.8 불변성·정렬·삭제는 호출 전에 의도를 정한다
- L124: 3. 따라 하기
- L128: 1단계: 프로젝트 준비
- L165: 2단계: 모델과 ID 색인 작성
- L237: 3단계: 컨트롤러와 실행
- L303: 4. 치트시트
- L323: 5. 자주 나는 에러와 해결
- L333: 6. 한 단계 더
- L340: 7. 자가점검 Q&A (면접 대비)
- L342: Q1. `List<String> x = new ArrayList<>()`처럼 인터페이스로 선언하는 이유는?
- L348: Q2. `Arrays.asList`와 `List.of`는 어떻게 다른가?
- L354: Q3. 중복을 제거하면서 입력 순서를 유지하려면 무엇을 쓰나?
- L360: Q4. `HashMap` 순회 결과를 사용자에게 그대로 보여도 되나?
- L366: Q5. `Queue.remove()`와 `poll()`은 어떤 차이가 있나?
- L372: Q6. `PriorityQueue`를 순회하면 왜 정렬 순서가 아닌가?
- L378: Q7. 반복 중 삭제에서 `ConcurrentModificationException`이 발생하면?
- L384: 8. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task61/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task61/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task61/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task61/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:p10`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task61/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task61/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
