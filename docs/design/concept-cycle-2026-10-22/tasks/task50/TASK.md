# task50: J22 · J22. 코딩테스트 알고리즘 — Java로 빠르게 구현하기

- 원문: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J22-coding-test-algorithms.md
- 원문 SHA256: `281bf25c0ab90803257b744af104de2fc7bb52a2f5953feb07d9404bfb2912b3` / 367줄
- 첫 단계: 기존24개 감사·우선 결함 처리 후 원문 전문 검토
- 기존 보강 근거: 해당 queue의 이번 보강 기록 없음. 기존 공통 시각 자료의 유무는 원문/HTML 대조 단계에서 확인한다.
- 참고 개념: 입력 크기와 시간/공간 복잡도, 정렬·lower/upper bound, BFS·DFS·Dijkstra·PriorityQueue, prefix sum·two pointers·stack·DP·Union-Find, Java 구현 실수·검증
- 참고 census 원문 해시 일치: True; 참고 자료는 현재 감사 판정과 구분한다.
- 검증자: gpt-6.1-sol / high. 수정·구현자: gpt-6-luna / high.

## 원문 주요 절

- L1: J22. 코딩테스트 알고리즘 — Java로 빠르게 구현하기
- L7: 1. 왜 알아야 하나
- L23: 2. 핵심 개념
- L57: 3. 내부 동작·원리
- L59: 입력과 출력
- L70: 정렬·경계 탐색
- L76: BFS·DFS·최단거리
- L91: 누적합·투 포인터·스택
- L97: 그리디·DP·Union-Find
- L103: 4. 코드로 확인
- L107: 예제 1 — 정렬·커스텀 정렬·lower/upper bound
- L124: 예제 2 — 격자/그래프 BFS와 Dijkstra
- L140: 예제 3 — 누적합·단조 스택·0-1 배낭
- L157: 예제 4 — 입출력·StringBuilder·Union-Find·빈도
- L172: 5. 버전별 변화 — 왜 바뀌었나
- L178: 6. 실무 가이드
- L198: 복잡도와 경계 검증 절차 (보강)
- L313: 7. 함정·안티패턴
- L325: 8. 자가점검 Q&A (면접 대비)
- L327: Q1. `Arrays.binarySearch` 대신 lower bound를 직접 구현하는 이유는?
- L331: Q2. BFS가 무가중치 최단거리를 보장하는 이유는?
- L335: Q3. Dijkstra에서 같은 정점이 힙에 여러 번 들어가도 되는가?
- L339: Q4. 투 포인터와 누적합은 어떻게 선택하는가?
- L343: Q5. 0-1 배낭에서 용량을 역순으로 순회하는 이유는?
- L347: Q6. 재귀 DFS를 반복 DFS로 바꾸면 무엇을 저장하는가?
- L351: Q7. `PriorityQueue`를 향상된 for 문으로 출력하면 왜 안 되는가?
- L355: Q8. `int` 배열의 최단거리도 `long`이어야 하는 경우는?
- L359: 9. 참고문헌

## 기존 관련 파일

- ID별 전용 파일이 없다. 현행 공통 렌더러/원문 HTML을 먼저 조사하고 새 전용 파일 필요성은 메인이 결정한다.

## 실행 단계 → 확인 방법

- [ ] 원문 전문과 현재 HTML·기존 source-proof를 읽는다 → 절별 stageIds/값/코드/근거와 covered/partial/missing/unrun을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task50/source-coverage.json에 기록한다.
- [ ] 기존 구현의 정확성을 먼저 검토한다 → LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task50/review.json에 specReview와 qualityReview를 분리하고 재현 가능한 finding을 기록한다.
- [ ] 필요한 변경 사양을 메인이 확정한다 → 각 결함의 입력/관찰값/기대값/실패 재현 명령·수정 파일을 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task50/IMPLEMENTATION.md에 확정한 뒤 구현자에게 전달한다. 문서 공백은 오류 수정과 구분한다.
- [ ] Luna high가 명시 사양 범위만 구현한다 → 실제로 실패하는 회귀 검사와 수정 뒤 통과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task50/repair에 기록한다. 새 이미지가 필요하면 스킬 기반 actual imagegen 후 최종 JPEG를 사용한다.
- [ ] 관련 검사 `npm --prefix tools/site run test:j22`를 실행한다 → 현재 script가 없으면 구현 단계에서 관련 원문/상태 검사를 등록하고 하네스의 허용 목록을 갱신한다. 실제 exit0과 소스 해시 보존이 통과 조건이다.
- [ ] fresh Sol high가 수정 뒤 spec을 확인한다 → 필요한 장면·코드·검사와 원문 보존에 누락/초과가 없어야 한다.
- [ ] spec 통과 뒤 Sol high quality 검토를 받는다 → 미해결 critical/important가 없어야 한다. 실패하면 같은 구현자에게 구체 finding과 재검사 조건을 돌려준다.
- [ ] 메인이 현재 desktop/mobile에서 값·그림·관련 코드·복사·이전/다음·확대/가로 이동·원문 앵커·문서 overflow를 확인한다 → JPEG 실제 헤더/DOM viewport·조작 결과를 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task50/browser.json에 기록한다.
- [ ] HTML 변경이 있으면 `npm --prefix tools/site run build`, `audit:visual`, `audit:version-cards`, `audit:parity`를 실행한다 → 현재 명령 exit0과 원문135/학습자17 해시 일치, 새 링크 오류0을 기록한다.
- [ ] 메인이 결과를 종합해 ledger에 판정한다 → 자동검사/부분정확성/전체커버리지/현재브라우저를 별도 필드로 갱신하며 미검증은 미검증으로 남긴다. 로컬 커밋만 한다.

## 출력과 제한

출력: LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task50/ . 기존 files/application/학습자서버/다른 task를 reviewer가 수정하지 않는다. 문서 전체 완료는 모든 의미 단위의 필수 관문을 충족할 때만 true다. source-coverage에 missing/partial이 있으면 필요한 후속 장면을 적고 needs_completion으로 기록한다. 학습자 이해를 자동검사만으로 인증하지 않는다.
